import type { CliOptions, PreviewEntry, UsageSummary } from "../core/types";

export type ProviderDefaults = {
  command: string;
  logDir: string;
  model: string;
  reasoningEffort: "low" | "medium" | "high";
  yolo: boolean;
};

export type ProviderAdapter = {
  name: string;
  displayName: string;
  defaults: ProviderDefaults;
  buildExecArgs: (lastMessagePath: string, options: CliOptions) => string[];
  previewEntriesFromLine: (line: string) => PreviewEntry[];
  collectMessages: (output: string) => PreviewEntry[];
  collectRawJsonLines: (output: string, previewCount: number) => string[];
  extractUsageSummary: (output: string) => UsageSummary | null;
  extractRetryDelaySeconds: (output: string) => number | null;
  hasStopMarker: (output: string) => boolean;
  formatCommandHint: (command: string) => string;
};
