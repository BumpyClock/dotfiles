import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import * as path from "node:path";
import type { IterationState } from "./types";

export const ITERATION_STATE_PATH = ".ai_agents/iteration.json";

function ensureDirectory(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function safeJsonParse(text: string): unknown | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function resolveIterationStatePath(cwd: string): string {
  return path.resolve(cwd, ITERATION_STATE_PATH);
}

function normalizeIterationState(input: unknown, fallbackMax: number): IterationState {
  if (!isObject(input)) {
    return { current_iteration: 0, max_iterations: fallbackMax };
  }

  const current = Number.parseInt(String(input.current_iteration ?? "0"), 10);
  const max = Number.parseInt(String(input.max_iterations ?? fallbackMax), 10);
  return {
    current_iteration: Number.isNaN(current) || current < 0 ? 0 : current,
    max_iterations: Number.isNaN(max) || max <= 0 ? fallbackMax : max,
  };
}

export function writeIterationState(statePath: string, state: IterationState): void {
  ensureDirectory(path.dirname(statePath));
  writeFileSync(statePath, `${JSON.stringify(state)}\n`, "utf8");
}

export function loadIterationState(
  statePath: string,
  fallbackMax: number,
  iterationsSet: boolean
): IterationState {
  if (!existsSync(statePath)) {
    const created: IterationState = { current_iteration: 0, max_iterations: fallbackMax };
    writeIterationState(statePath, created);
    return created;
  }

  const raw = readFileSync(statePath, "utf8");
  const parsed = safeJsonParse(raw);
  const state = normalizeIterationState(parsed, fallbackMax);
  if (iterationsSet) {
    state.max_iterations = fallbackMax;
  }
  if (state.max_iterations <= 0) {
    state.max_iterations = fallbackMax;
  }
  writeIterationState(statePath, state);
  return state;
}

export function isCircuitBroken(state: IterationState): boolean {
  return state.current_iteration >= state.max_iterations;
}

export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function buildRunFileBase(iteration: number): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `iter-${String(iteration).padStart(3, "0")}-${stamp}`;
}
