#!/usr/bin/env bun

import { execFileSync, spawnSync } from "child_process";
import { createInterface } from "readline";

const SESSIONS: Record<string, string> = {
  shared: "General collaboration shell",
  dev: "Dev / testing",
};

interface SessionInfo {
  name: string;
  windows: string;
  created: string;
  attached: boolean;
}

function listSessions(): SessionInfo[] {
  try {
    const out = execFileSync("tmux", [
      "list-sessions", "-F",
      "#{session_name}\t#{session_windows}\t#{session_created_string}\t#{session_attached}",
    ], { encoding: "utf-8" });
    return out.trim().split("\n").filter(Boolean).map((line) => {
      const [name, windows, created, attached] = line.split("\t");
      return { name, windows, created, attached: attached === "1" };
    });
  } catch {
    return [];
  }
}

function ensureSession(name: string) {
  const active = listSessions().map((s) => s.name);
  if (!active.includes(name)) {
    execFileSync("tmux", ["new-session", "-d", "-s", name]);
    console.log(`Created session: ${name}`);
  }
}

function attach(name: string) {
  spawnSync("tmux", ["attach", "-t", name], { stdio: "inherit" });
}

function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function interactivePicker() {
  const sessions = listSessions();
  if (!sessions.length) {
    console.log("No active tmux sessions.\n");
    console.log("Known sessions:");
    for (const [name, desc] of Object.entries(SESSIONS)) {
      console.log(`  ${name.padEnd(10)} ${desc}`);
    }
    const answer = await prompt("\nCreate and connect to which session? ");
    if (!answer) process.exit(0);
    ensureSession(answer);
    attach(answer);
    return;
  }

  console.log("\n  Active tmux sessions:\n");
  sessions.forEach((s, i) => {
    const desc = SESSIONS[s.name] ?? "";
    const tag = s.attached ? " (attached)" : "";
    console.log(`  ${(i + 1 + ")").padEnd(4)} ${s.name.padEnd(12)} ${s.windows} win${tag}${desc ? `  — ${desc}` : ""}`);
  });

  console.log(`\n  n)   Create new session`);
  const answer = await prompt("\nSelect [1-" + sessions.length + "/n]: ");

  if (answer.toLowerCase() === "n") {
    const name = await prompt("Session name: ");
    if (!name) process.exit(0);
    ensureSession(name);
    attach(name);
  } else {
    const idx = parseInt(answer, 10) - 1;
    if (idx >= 0 && idx < sessions.length) {
      attach(sessions[idx].name);
    } else {
      console.log("Invalid selection.");
      process.exit(1);
    }
  }
}

const arg = process.argv[2];

if (arg === "-h" || arg === "--help") {
  console.log(`Usage: tmux-connect [session]

  (no args)  Interactive session picker
  ls         List active sessions
  <name>     Connect to (or create) session by name`);
  process.exit(0);
}

if (arg === "ls") {
  const sessions = listSessions();
  if (!sessions.length) {
    console.log("No active tmux sessions.");
  } else {
    for (const s of sessions) {
      const desc = SESSIONS[s.name] ?? "";
      const tag = s.attached ? " (attached)" : "";
      console.log(`  ${s.name.padEnd(12)} ${s.windows} win${tag}${desc ? `  — ${desc}` : ""}`);
    }
  }
  process.exit(0);
}

if (arg) {
  ensureSession(arg);
  attach(arg);
} else {
  await interactivePicker();
}
