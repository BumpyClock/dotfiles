import { readFile } from "node:fs/promises";

export type ProviderName = "claude" | "copilot" | "codex" | "opencode";
export type ModelClass = "fast" | "balanced" | "strong";
export type ModelProfile = "economy";

export type ProviderModelDefinition = {
  default: string;
  profiles?: Partial<Record<ModelProfile, string>>;
};

export type AgentTemplateConfig = {
  providers: Record<ProviderName, Record<ModelClass, ProviderModelDefinition>>;
};

function assertProviderModels(value: unknown, configPath: string): AgentTemplateConfig["providers"] {
  if (!value || typeof value !== "object") {
    throw new Error(`Missing providers config in ${configPath}`);
  }

  return value as AgentTemplateConfig["providers"];
}

function normalizeProviderDefinition(
  providerConfig: Record<string, unknown>,
  providerName: ProviderName,
  configPath: string,
): Record<ModelClass, ProviderModelDefinition> {
  const modelClasses: ModelClass[] = ["fast", "balanced", "strong"];
  const normalized = {} as Record<ModelClass, ProviderModelDefinition>;

  for (const modelClass of modelClasses) {
    const definition = providerConfig[modelClass];
    if (!definition || typeof definition !== "object" || typeof definition.default !== "string") {
      throw new Error(`Missing ${providerName}.${modelClass}.default in ${configPath}`);
    }

    const profiles = Object.entries(definition)
      .filter(([key]) => key !== "default")
      .reduce<Partial<Record<ModelProfile, string>>>((result, [key, rawValue]) => {
        if (key === "economy" && typeof rawValue === "string") {
          result[key as ModelProfile] = rawValue;
        }

        return result;
      }, {});

    normalized[modelClass] = {
      default: definition.default,
      profiles: Object.keys(profiles).length > 0 ? profiles : undefined,
    };
  }

  return normalized;
}

function toOpenCodeModel(modelId: string): string {
  if (modelId.includes("/")) {
    return modelId;
  }

  if (modelId.startsWith("claude-")) {
    return `anthropic/${modelId}`;
  }

  if (modelId.startsWith("gpt-") || modelId.startsWith("o1") || modelId.startsWith("o3") || modelId.startsWith("o4")) {
    return `openai/${modelId}`;
  }

  return modelId;
}

function deriveOpenCodeProvider(copilot: Record<ModelClass, ProviderModelDefinition>): Record<ModelClass, ProviderModelDefinition> {
  return {
    fast: {
      default: toOpenCodeModel(copilot.fast.default),
      profiles: copilot.fast.profiles
        ? Object.fromEntries(Object.entries(copilot.fast.profiles).map(([key, value]) => [key, toOpenCodeModel(value)]))
        : undefined,
    },
    balanced: {
      default: toOpenCodeModel(copilot.balanced.default),
      profiles: copilot.balanced.profiles
        ? Object.fromEntries(Object.entries(copilot.balanced.profiles).map(([key, value]) => [key, toOpenCodeModel(value)]))
        : undefined,
    },
    strong: {
      default: toOpenCodeModel(copilot.strong.default),
      profiles: copilot.strong.profiles
        ? Object.fromEntries(Object.entries(copilot.strong.profiles).map(([key, value]) => [key, toOpenCodeModel(value)]))
        : undefined,
    },
  };
}

function normalizeProviderDefinitions(providers: AgentTemplateConfig["providers"], configPath: string): AgentTemplateConfig["providers"] {
  const requiredProviderNames: Array<Exclude<ProviderName, "opencode">> = ["claude", "copilot", "codex"];
  const normalized = {} as AgentTemplateConfig["providers"];

  for (const providerName of requiredProviderNames) {
    const providerConfig = providers[providerName];
    if (!providerConfig || typeof providerConfig !== "object") {
      throw new Error(`Missing provider '${providerName}' in ${configPath}`);
    }

    normalized[providerName] = normalizeProviderDefinition(providerConfig as Record<string, unknown>, providerName, configPath);
  }

  const opencodeConfig = providers.opencode;
  normalized.opencode =
    opencodeConfig && typeof opencodeConfig === "object"
      ? normalizeProviderDefinition(opencodeConfig as Record<string, unknown>, "opencode", configPath)
      : deriveOpenCodeProvider(normalized.copilot);

  return normalized;
}

export async function loadAgentTemplateConfig(configPath: string): Promise<AgentTemplateConfig> {
  const raw = await readFile(configPath, "utf8");
  const parsed = Bun.TOML.parse(raw) as Record<string, unknown>;

  return {
    providers: normalizeProviderDefinitions(assertProviderModels(parsed.providers, configPath), configPath),
  };
}
