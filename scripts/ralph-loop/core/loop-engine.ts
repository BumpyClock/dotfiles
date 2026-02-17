import { existsSync, readFileSync } from "node:fs";
import { ChildProcess } from "node:child_process";
import * as path from "node:path";
import { formatShort } from "./text";
import {
  ANSI,
  LiveRunRenderer,
  badge,
  colorize,
  createSpinner,
  labelTone,
  printPreview,
  printSection,
  printUsageSummary,
  progressBar,
} from "./terminal-ui";
import { buildRunFileBase, isCircuitBroken, loadIterationState, resolveIterationStatePath, sleep, writeIterationState } from "./state";
import { resolveRunnableCommand, runAgentProcess, terminateChildProcess } from "./process-runner";
import { extractReferencedBeadIds, loadBeadsSnapshot } from "./beads";
import type { BeadIssue, BeadsSnapshot, CliOptions, RunDefinition, RunResult, Tone } from "./types";
import type { ProviderAdapter } from "../providers/types";

function buildRuns(
  iteration: number,
  parallelAgents: number,
  logDir: string,
  provider: ProviderAdapter,
  options: CliOptions
): RunDefinition[] {
  return Array.from({ length: parallelAgents }, (_, index) => {
    const agentId = index + 1;
    const runBase = `${buildRunFileBase(iteration)}-agent-${String(agentId).padStart(2, "0")}`;
    const jsonlLogPath = path.join(logDir, `${runBase}.jsonl`);
    const lastMessagePath = path.join(logDir, `${runBase}.last-message.txt`);
    const args = provider.buildExecArgs(lastMessagePath, options);
    return { agentId, jsonlLogPath, lastMessagePath, args };
  });
}

function printInitialSummary(
  provider: ProviderAdapter,
  options: CliOptions,
  command: string,
  promptPath: string,
  logDir: string,
  maxIterations: number
): void {
  printSection(`${provider.displayName} Loop`);
  console.log(`${badge("PROVIDER", "neutral")} ${provider.name}`);
  console.log(`${badge("PROJECT", "neutral")} ${options.projectRoot}`);
  console.log(`${badge("PROJECT_KEY", "neutral")} ${options.projectKey}`);
  console.log(`${badge("COMMAND", "neutral")} ${colorize(command, ANSI.bold)}`);
  console.log(`${badge("PROMPT", "neutral")} ${promptPath}`);
  console.log(`${badge("LOGS", "neutral")} ${logDir}`);
  console.log(`${badge("LIMIT", "neutral")} max iterations: ${maxIterations}`);
  if (options.model.trim()) {
    console.log(`${badge("MODEL", "neutral")} ${options.model.trim()}`);
  }
  console.log(`${badge("EFFORT", "neutral")} reasoning_effort=${options.reasoningEffort}`);
  console.log(
    `${badge("PARALLEL", options.parallelAgents > 1 ? "warn" : "neutral")} ${options.parallelAgents}`
  );
  console.log(
    `${badge("YOLO", options.yolo ? "warn" : "muted")} ${options.yolo ? "enabled" : "disabled"}`
  );
}

async function runIteration(
  iteration: number,
  stateMaxIterations: number,
  options: CliOptions,
  provider: ProviderAdapter,
  beadsSnapshot: BeadsSnapshot,
  prompt: string,
  command: string,
  logDir: string,
  activeChildren: Set<ChildProcess>,
  activeSpinnerStopRef: { value: ((message: string, tone?: Tone) => void) | null }
): Promise<{ results: RunResult[]; pickedByAgent: Map<number, BeadIssue> }> {
  const runs = buildRuns(iteration, options.parallelAgents, logDir, provider, options);
  const startedAt = new Date().toLocaleTimeString();
  console.log();
  console.log(
    `${badge("ITERATION", "info")} ${iteration}/${stateMaxIterations} ${colorize(
      progressBar(iteration, stateMaxIterations),
      ANSI.cyan
    )}`
  );
  console.log(`${badge("START", "muted")} ${startedAt}`);
  console.log(`${badge("RUN", "muted")} ${command} ${runs[0].args.join(" ")}`);
  console.log(`${badge("BATCH", "muted")} target ${runs.length} parallel agent(s), staged startup`);
  for (const run of runs) {
    console.log(`${badge(`A${run.agentId}`, "muted")} ${run.jsonlLogPath}`);
  }
  if (options.showRaw) {
    console.log(`${badge("STREAM", "warn")} raw event stream enabled`);
  }

  const liveRenderer = options.showRaw
    ? null
    : new LiveRunRenderer(
        iteration,
        stateMaxIterations,
        runs.map((run) => run.agentId),
        options.previewLines
      );
  liveRenderer?.setBeadsSnapshot(beadsSnapshot);
  const liveRendererEnabled = Boolean(liveRenderer?.isEnabled());
  const spinner =
    options.showRaw || liveRendererEnabled
      ? null
      : createSpinner(`running ${runs.length} ${provider.name} agent(s) for iteration ${iteration}`);
  activeSpinnerStopRef.value = liveRendererEnabled
    ? (message: string, tone: Tone = "success") => {
        liveRenderer?.stop(message, tone);
      }
    : spinner?.stop ?? null;

  const liveSeen = new Set<string>();
  const liveCountByAgent = new Map<number, number>();
  const pickedByAgent = new Map<number, BeadIssue>();
  const knownBeadIds = new Set(beadsSnapshot.byId.keys());

  let readinessCount = 0;
  const readinessWaiters: Array<{ target: number; resolve: () => void }> = [];
  const flushReadinessWaiters = () => {
    const remaining: Array<{ target: number; resolve: () => void }> = [];
    for (const waiter of readinessWaiters) {
      if (readinessCount >= waiter.target) {
        waiter.resolve();
      } else {
        remaining.push(waiter);
      }
    }
    readinessWaiters.length = 0;
    readinessWaiters.push(...remaining);
  };
  const releaseReadiness = () => {
    readinessCount += 1;
    flushReadinessWaiters();
  };
  const waitForReadiness = (target: number): Promise<void> => {
    if (readinessCount >= target) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      readinessWaiters.push({ target, resolve });
    });
  };

  const launchedRuns: Array<Promise<RunResult>> = [];
  for (let runIndex = 0; runIndex < runs.length; runIndex += 1) {
    const run = runs[runIndex];
    if (runIndex > 0) {
      await waitForReadiness(runIndex);
      console.log(
        `${badge("SPAWN", "muted")} launching agent ${run.agentId} after readiness ${runIndex}/${runs.length}`
      );
    }

    const launchedRun = (async (): Promise<RunResult> => {
      let trackedChild: ChildProcess | null = null;
      let readinessReleased = false;
      const releaseReadinessOnce = () => {
        if (readinessReleased) {
          return;
        }
        readinessReleased = true;
        releaseReadiness();
      };

      try {
        const result = await runAgentProcess({
          prompt,
          command,
          args: run.args,
          logPath: run.jsonlLogPath,
          showRaw: options.showRaw,
          formatCommandHint: provider.formatCommandHint,
          onChildChange: (child) => {
            if (child) {
              trackedChild = child;
              activeChildren.add(child);
            } else if (trackedChild) {
              activeChildren.delete(trackedChild);
              trackedChild = null;
            }
          },
          onStdoutLine: (line) => {
            if (options.showRaw) {
              return;
            }
            const liveEntries = provider.previewEntriesFromLine(line).filter(
              (entry) =>
                entry.kind === "reasoning" ||
                entry.kind === "tool" ||
                entry.kind === "assistant" ||
                entry.kind === "error"
            );
            for (const entry of liveEntries) {
              const matchedIds = extractReferencedBeadIds(entry.text, knownBeadIds);
              if (matchedIds.length > 0) {
                const matchedIssue = beadsSnapshot.byId.get(matchedIds[0]);
                if (matchedIssue) {
                  pickedByAgent.set(run.agentId, matchedIssue);
                  liveRenderer?.setAgentPickedBead(run.agentId, matchedIssue);
                }
              }
              if (liveRendererEnabled) {
                liveRenderer?.update(run.agentId, entry);
                continue;
              }

              const key = `${run.agentId}:${entry.kind}:${entry.text}`;
              if (liveSeen.has(key)) {
                continue;
              }
              liveSeen.add(key);
              const count = (liveCountByAgent.get(run.agentId) ?? 0) + 1;
              liveCountByAgent.set(run.agentId, count);
              if (count > 20 && entry.kind !== "assistant" && entry.kind !== "error") {
                continue;
              }

              if (process.stdout.isTTY) {
                process.stdout.write("\r\x1b[2K");
              }
              const agentPrefix = runs.length > 1 ? `${badge(`A${run.agentId}`, "muted")} ` : "";
              const entryBadge = badge(entry.label.toUpperCase(), labelTone(entry.label));
              console.log(
                `${badge("LIVE", "info")} ${agentPrefix}${entryBadge} ${formatShort(entry.text, 180)}`
              );
            }
          },
          onFirstResponse: () => {
            releaseReadinessOnce();
          },
        });
        return {
          agentId: run.agentId,
          jsonlLogPath: run.jsonlLogPath,
          lastMessagePath: run.lastMessagePath,
          result,
        };
      } finally {
        releaseReadinessOnce();
      }
    })();

    launchedRuns.push(launchedRun);
  }

  return {
    results: await Promise.all(launchedRuns),
    pickedByAgent,
  };
}

function printBeadsSnapshot(snapshot: BeadsSnapshot): void {
  if (!snapshot.available) {
    const suffix = snapshot.error ? ` (${formatShort(snapshot.error, 120)})` : "";
    console.log(`${badge("BEADS", "warn")} unavailable${suffix}`);
    return;
  }
  console.log(
    `${badge("BEADS", "info")} remaining ${snapshot.remaining} | in_progress ${snapshot.inProgress} | open ${snapshot.open} | blocked ${snapshot.blocked} | closed ${snapshot.closed}`
  );
  for (const issue of snapshot.remainingIssues.slice(0, 3)) {
    const assignee = issue.assignee ? ` @${issue.assignee}` : "";
    console.log(`- ${issue.id} ${issue.title}${assignee}`);
  }
}

export async function runLoop(options: CliOptions, provider: ProviderAdapter): Promise<void> {
  const promptPath = path.resolve(process.cwd(), options.promptPath);
  const statePath = resolveIterationStatePath(process.cwd());
  const logDir = path.resolve(process.cwd(), options.logDir);
  const command = resolveRunnableCommand(options.command, provider.formatCommandHint);
  const activeChildren = new Set<ChildProcess>();
  const activeSpinnerStopRef: { value: ((message: string, tone?: Tone) => void) | null } = {
    value: null,
  };
  let shuttingDown = false;

  const onSignal = (signal: NodeJS.Signals) => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    console.log();
    console.log(`${badge("SHUTDOWN", "warn")} received ${signal}, cleaning up...`);
    void (async () => {
      if (activeSpinnerStopRef.value) {
        activeSpinnerStopRef.value("cancelled", "warn");
        activeSpinnerStopRef.value = null;
      }
      if (activeChildren.size > 0) {
        const count = activeChildren.size;
        await Promise.all([...activeChildren].map((child) => terminateChildProcess(child)));
        activeChildren.clear();
        console.log(`${badge("CLEANUP", "success")} terminated ${count} running child process(es).`);
      }
      process.exit(signal === "SIGINT" ? 130 : 143);
    })();
  };

  process.on("SIGINT", onSignal);
  process.on("SIGTERM", onSignal);

  try {
    const state = loadIterationState(statePath, options.iterationLimit, options.iterationsSet);
    if (isCircuitBroken(state)) {
      console.log(`Circuit breaker hit: max_iterations (${state.max_iterations}) already reached`);
      return;
    }
    if (!existsSync(promptPath)) {
      throw new Error(`Prompt file not found: ${promptPath}`);
    }

    printInitialSummary(provider, options, command, promptPath, logDir, state.max_iterations);

    let stoppedByProviderMarker = false;
    for (; state.current_iteration < state.max_iterations; ) {
      if (shuttingDown) {
        break;
      }

      const prompt = readFileSync(promptPath, "utf8");
      state.current_iteration += 1;
      writeIterationState(statePath, state);

      const iteration = state.current_iteration;
      let results: RunResult[];
      let pickedByAgent = new Map<number, BeadIssue>();
      const beadsSnapshot = await loadBeadsSnapshot(options.projectRoot);
      printBeadsSnapshot(beadsSnapshot);
      try {
        const iterationRun = await runIteration(
          iteration,
          state.max_iterations,
          options,
          provider,
          beadsSnapshot,
          prompt,
          command,
          logDir,
          activeChildren,
          activeSpinnerStopRef
        );
        results = iterationRun.results;
        pickedByAgent = iterationRun.pickedByAgent;

        const allSuccess = results.every((entry) => entry.result.status === 0);
        activeSpinnerStopRef.value?.(
          allSuccess ? "responses received" : "one or more processes exited",
          allSuccess ? "success" : "warn"
        );
        activeSpinnerStopRef.value = null;
      } catch (error) {
        activeSpinnerStopRef.value?.("spawn failed", "error");
        activeSpinnerStopRef.value = null;
        throw error;
      }

      const failed = results.filter((entry) => entry.result.status !== 0);
      if (failed.length > 0) {
        const retryDelays = failed
          .map((entry) => provider.extractRetryDelaySeconds(`${entry.result.stdout}\n${entry.result.stderr}`))
          .filter((value): value is number => value !== null);
        if (retryDelays.length === failed.length && iteration < state.max_iterations) {
          const retrySeconds = Math.max(...retryDelays);
          console.log(
            `${badge("RETRY", "warn")} delay detected (${retrySeconds}s). Waiting before next iteration`
          );
          await sleep(retrySeconds * 1000);
          continue;
        }

        for (const entry of failed) {
          const combined = `${entry.result.stdout}\n${entry.result.stderr}`.trim();
          console.log(`${badge(`A${entry.agentId}`, "error")} exited with status ${entry.result.status}`);
          if (combined) {
            console.log(colorize(formatShort(combined, 600), ANSI.red));
          }
        }
        break;
      }

      let stopDetected = false;
      const knownBeadIds = new Set(beadsSnapshot.byId.keys());
      for (const entry of results) {
        const combined = `${entry.result.stdout}\n${entry.result.stderr}`.trim();
        const context = results.length > 1 ? `agent ${entry.agentId}` : undefined;
        const preview = provider.collectMessages(combined);

        if (preview.length > 0) {
          printPreview(preview, options.previewLines, context);
        } else if (existsSync(entry.lastMessagePath)) {
          const lastMessage = readFileSync(entry.lastMessagePath, "utf8").trim();
          if (lastMessage) {
            printPreview(
              [{ kind: "assistant", label: "assistant", text: formatShort(lastMessage) }],
              options.previewLines,
              context
            );
          } else {
            printPreview([], options.previewLines, context);
          }
        } else {
          printPreview([], options.previewLines, context);
        }

        if (preview.length === 0) {
          const rawPreview = provider.collectRawJsonLines(combined, options.previewLines);
          if (rawPreview.length > 0) {
            const suffix = context ? ` (${context})` : "";
            console.log(`${badge("FALLBACK", "warn")} JSONL preview fallback (raw lines):${suffix}`);
            for (const rawLine of rawPreview) {
              console.log(`- ${colorize(formatShort(rawLine, 200), ANSI.dim)}`);
            }
          }
        }

        const usage = provider.extractUsageSummary(combined);
        if (usage) {
          printUsageSummary(usage, context);
        }

        const lastMessageOutput = existsSync(entry.lastMessagePath)
          ? readFileSync(entry.lastMessagePath, "utf8")
          : "";
        if (provider.hasStopMarker(combined) || provider.hasStopMarker(lastMessageOutput)) {
          stopDetected = true;
        }
        if (!pickedByAgent.has(entry.agentId)) {
          const fallbackIds = extractReferencedBeadIds(combined, knownBeadIds);
          if (fallbackIds.length > 0) {
            const fallbackIssue = beadsSnapshot.byId.get(fallbackIds[0]);
            if (fallbackIssue) {
              pickedByAgent.set(entry.agentId, fallbackIssue);
            }
          }
        }
        const picked = pickedByAgent.get(entry.agentId);
        if (picked) {
          console.log(`${badge(`A${entry.agentId}`, "muted")} picked bead ${picked.id}: ${picked.title}`);
        }
      }

      if (stopDetected) {
        stoppedByProviderMarker = true;
        console.log(`${badge("STOP", "success")} provider stop marker detected`);
        break;
      }

      if (state.current_iteration < state.max_iterations && options.pauseMs > 0) {
        console.log(`${badge("PAUSE", "muted")} waiting ${options.pauseMs}ms`);
        await sleep(options.pauseMs);
      }
    }

    if (!stoppedByProviderMarker && isCircuitBroken(state)) {
      console.log(`${badge("CIRCUIT", "warn")} max_iterations (${state.max_iterations}) reached`);
    }
  } finally {
    process.off("SIGINT", onSignal);
    process.off("SIGTERM", onSignal);
    if (activeChildren.size > 0) {
      await Promise.all([...activeChildren].map((child) => terminateChildProcess(child)));
      activeChildren.clear();
    }
    if (activeSpinnerStopRef.value) {
      activeSpinnerStopRef.value("stopped", "warn");
      activeSpinnerStopRef.value = null;
    }
  }
}
