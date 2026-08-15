const STATUS_ID = "git-status";
const UPDATE_INTERVAL_MS = 2_000;
const GIT_TIMEOUT_MS = 2_000;

type Theme = {
  fg(color: "accent" | "dim" | "success" | "warning", text: string): string;
};

type ExtensionContext = {
  cwd: string;
  hasUI: boolean;
  ui: {
    theme: Theme;
    setStatus(key: string, value: string | undefined): void;
  };
};

type ExecResult = {
  stdout: string;
  stderr: string;
  code: number;
  killed: boolean;
};

type ExtensionAPI = {
  on(
    event: string,
    handler: (event: any, ctx: ExtensionContext) => void | Promise<unknown>,
  ): void;
  exec(command: string, args: string[], options?: { timeout?: number }): Promise<ExecResult>;
};

async function runGit(pi: ExtensionAPI, args: string[]) {
  const result = await pi.exec("git", args, { timeout: GIT_TIMEOUT_MS });
  if (result.code !== 0) throw new Error(result.stderr || `git ${args.join(" ")} failed`);
  return result.stdout.trimEnd();
}

async function getBranch(pi: ExtensionAPI) {
  const branch = await runGit(pi, ["branch", "--show-current"]);
  if (branch.length > 0) return branch;

  const head = await runGit(pi, ["rev-parse", "--short", "HEAD"]);
  return head.length > 0 ? `detached@${head}` : "unknown";
}

function countUnstagedFiles(statusOutput: string) {
  if (statusOutput.length === 0) return 0;

  let count = 0;
  for (const line of statusOutput.split("\n")) {
    if (line.startsWith("??") || line[1] !== " ") count += 1;
  }
  return count;
}

async function getUnstagedCount(pi: ExtensionAPI) {
  const status = await runGit(pi, ["status", "--porcelain", "--untracked-files=normal"]);
  return countUnstagedFiles(status);
}

async function updateStatus(pi: ExtensionAPI, ctx: ExtensionContext) {
  if (!ctx.hasUI) return;

  try {
    await runGit(pi, ["rev-parse", "--is-inside-work-tree"]);
    const [branch, unstagedCount] = await Promise.all([
      getBranch(pi),
      getUnstagedCount(pi),
    ]);

    const theme = ctx.ui.theme;
    const dirtyLabel = unstagedCount > 0
      ? theme.fg("warning", `±${unstagedCount}`)
      : theme.fg("success", "clean");
    ctx.ui.setStatus(
      STATUS_ID,
      `${theme.fg("accent", ` ${branch}`)} ${theme.fg("dim", "·")} ${dirtyLabel}`,
    );
  } catch {
    ctx.ui.setStatus(STATUS_ID, undefined);
  }
}

export default function (pi: ExtensionAPI) {
  let interval: ReturnType<typeof setInterval> | undefined;

  pi.on("session_start", async (_event, ctx) => {
    if (interval) clearInterval(interval);

    await updateStatus(pi, ctx);
    interval = setInterval(() => {
      void updateStatus(pi, ctx);
    }, UPDATE_INTERVAL_MS);
  });

  pi.on("input", async (_event, ctx) => {
    await updateStatus(pi, ctx);
    return { action: "continue" };
  });

  pi.on("tool_execution_end", async (_event, ctx) => {
    await updateStatus(pi, ctx);
  });

  pi.on("session_shutdown", async (_event, ctx) => {
    if (interval) {
      clearInterval(interval);
      interval = undefined;
    }
    if (ctx.hasUI) ctx.ui.setStatus(STATUS_ID, undefined);
  });
}
