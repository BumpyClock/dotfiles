import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

type ParsedArgs = {
  promptPathOverride?: string;
  maxIterationsOverride?: number;
  parallelAgentsOverride?: number;
};

const parsePositiveInt = (raw: string, flag: string): number => {
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${flag} must be a positive integer`);
  }
  return parsed;
};

const parseArgs = (argv: string[]): ParsedArgs => {
  let promptPathOverride: string | undefined;
  let maxIterationsOverride: number | undefined;
  let parallelAgentsOverride: number | undefined;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index] ?? '';
    if (arg === '--prompt') {
      const next = argv[index + 1];
      if (!next) {
        throw new Error(`${arg} requires a path`);
      }
      promptPathOverride = next;
      index += 1;
      continue;
    }
    if (arg.startsWith('--prompt=')) {
      const [, rawValue] = arg.split('=', 2);
      if (!rawValue) {
        throw new Error(`${arg} requires a path`);
      }
      promptPathOverride = rawValue;
      continue;
    }
    if (arg === '--max-iterations') {
      const next = argv[index + 1];
      if (!next) {
        throw new Error(`${arg} requires a number`);
      }
      maxIterationsOverride = parsePositiveInt(next, arg);
      index += 1;
      continue;
    }
    if (arg.startsWith('--max-iterations=')) {
      const [, rawValue] = arg.split('=', 2);
      if (!rawValue) {
        throw new Error(`${arg} requires a number`);
      }
      maxIterationsOverride = parsePositiveInt(rawValue, '--max-iterations');
      continue;
    }
    if (arg === '--parallel-agents') {
      const next = argv[index + 1];
      if (!next) {
        throw new Error(`${arg} requires a number`);
      }
      parallelAgentsOverride = parsePositiveInt(next, arg);
      index += 1;
      continue;
    }
    if (arg.startsWith('--parallel-agents=')) {
      const [, rawValue] = arg.split('=', 2);
      if (!rawValue) {
        throw new Error(`${arg} requires a number`);
      }
      parallelAgentsOverride = parsePositiveInt(rawValue, '--parallel-agents');
    }
  }
  return { promptPathOverride, maxIterationsOverride, parallelAgentsOverride };
};

const { promptPathOverride, maxIterationsOverride, parallelAgentsOverride } = parseArgs(
  process.argv.slice(2),
);
const promptPath = resolve(process.cwd(), promptPathOverride ?? 'prompt.md');
const defaultMaxIterations = 10;
const maxIterations = maxIterationsOverride ?? defaultMaxIterations;
const defaultParallelAgents = 1;
const parallelAgents = parallelAgentsOverride ?? defaultParallelAgents;
const defaultDelayMs = 1000;
const delayEnv = process.env.CLAUDE_LOOP_DELAY_MS;
const parsedDelay = delayEnv ? Number.parseInt(delayEnv, 10) : defaultDelayMs;
const delayMs = Number.isFinite(parsedDelay) && parsedDelay >= 0 ? parsedDelay : defaultDelayMs;

const readPrompt = (): string => readFileSync(promptPath, 'utf8');

const createWriter = (
  prefix: string,
  write: (chunk: string) => void,
): { write: (chunk: string) => void; flush: () => void } => {
  if (prefix.length === 0) {
    return { write, flush: () => {} };
  }
  let buffer = '';
  const writeChunk = (chunk: string) => {
    buffer += chunk;
    let newlineIndex = buffer.indexOf('\n');
    while (newlineIndex !== -1) {
      const line = buffer.slice(0, newlineIndex + 1);
      buffer = buffer.slice(newlineIndex + 1);
      write(`${prefix}${line}`);
      newlineIndex = buffer.indexOf('\n');
    }
  };
  const flush = () => {
    if (buffer.length > 0) {
      write(`${prefix}${buffer}`);
      buffer = '';
    }
  };
  return { write: writeChunk, flush };
};

const runClaude = async (prompt: string, agentId: number, totalAgents: number): Promise<string> =>
  await new Promise((resolve, reject) => {
    const prefix = totalAgents > 1 ? `[agent ${agentId}] ` : '';
    const child = spawn(
      'claude',
      ['-p', prompt, '--dangerously-skip-permissions', '--output-format', 'text', '--print'],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    );
    let stdout = '';
    let stderr = '';
    const stdoutWriter = createWriter(prefix, (chunk) => process.stdout.write(chunk));
    const stderrWriter = createWriter(prefix, (chunk) => process.stderr.write(chunk));
    if (child.stdout) {
      child.stdout.setEncoding('utf8');
      child.stdout.on('data', (chunk) => {
        stdout += chunk;
        stdoutWriter.write(chunk);
      });
    }
    if (child.stderr) {
      child.stderr.setEncoding('utf8');
      child.stderr.on('data', (chunk) => {
        stderr += chunk;
        stderrWriter.write(chunk);
      });
    }
    child.on('error', (error) => {
      reject(error);
    });
    child.on('close', (code) => {
      stdoutWriter.flush();
      stderrWriter.flush();
      if (code && code !== 0) {
        reject(new Error(`claude exited with code ${code}`));
        return;
      }
      resolve(`${stdout}${stderr}`);
    });
  });

const startSpinner = (label: string): (() => void) => {
  const frames = ['-', '\\', '|', '/'];
  let index = 0;
  const render = () => {
    const frame = frames[index % frames.length] ?? '-';
    index += 1;
    process.stderr.write(`\r${frame} ${label}`);
  };
  render();
  const timer = setInterval(render, 80);
  return () => {
    clearInterval(timer);
    const padding = ' '.repeat(label.length + 2);
    process.stderr.write(`\r${padding}\r${label} done\n`);
  };
};

const sleep = async (ms: number): Promise<void> => {
  if (ms <= 0) {
    return;
  }
  await new Promise<void>((resolve) => setTimeout(resolve, ms));
};

const main = async (): Promise<void> => {
  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    const label = `Iteration ${iteration + 1} of ${maxIterations} (${parallelAgents} agents)`;
    const stopSpinner = startSpinner(label);
    const prompt = readPrompt();
    let outputs: string[] = [];
    try {
      outputs = await Promise.all(
        Array.from({ length: parallelAgents }, (_, index) =>
          runClaude(prompt, index + 1, parallelAgents),
        ),
      );
    } finally {
      stopSpinner();
    }
    const hasCompleted = outputs.some((output) => output.trim() === 'Task Complete');
    if (hasCompleted) {
      return;
    }
    if (iteration < maxIterations - 1) {
      await sleep(delayMs);
    }
  }
  throw new Error(`Reached max iterations (${maxIterations}) without Task Complete`);
};

void main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
