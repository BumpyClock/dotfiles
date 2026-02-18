import { codexProvider } from "./codex";
import type { ProviderAdapter } from "./types";

const PROVIDERS: Record<string, ProviderAdapter> = {
  [codexProvider.name]: codexProvider,
};

export function listProviderNames(): string[] {
  return Object.keys(PROVIDERS).sort();
}

export function getProviderAdapter(name: string): ProviderAdapter {
  const normalized = name.trim().toLowerCase();
  const provider = PROVIDERS[normalized];
  if (!provider) {
    const supported = listProviderNames().join(", ");
    throw new Error(`Unsupported provider "${name}". Supported providers: ${supported}`);
  }
  return provider;
}
