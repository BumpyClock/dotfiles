import { describe, expect, test } from "bun:test";
import {
  buildClaudeEnvironment,
  proxyReleaseFor,
  sha256,
  validateArchiveEntries,
} from "./claude-gpt";

describe("proxyReleaseFor", () => {
  test.each([
    ["darwin", "x64", "claude-code-proxy-darwin-amd64.tar.gz"],
    ["darwin", "arm64", "claude-code-proxy-darwin-arm64.tar.gz"],
    ["linux", "x64", "claude-code-proxy-linux-amd64.tar.gz"],
    ["linux", "arm64", "claude-code-proxy-linux-arm64.tar.gz"],
    ["win32", "x64", "claude-code-proxy-windows-amd64.zip"],
    ["win32", "arm64", "claude-code-proxy-windows-arm64.zip"],
  ] as const)("selects %s/%s", (platform, arch, archiveName) => {
    const release = proxyReleaseFor(platform, arch);
    expect(release.archiveName).toBe(archiveName);
    expect(release.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(release.binarySha256).toMatch(/^[a-f0-9]{64}$/);
  });

  test("rejects unsupported targets", () => {
    expect(() => proxyReleaseFor("freebsd", "x64")).toThrow("does not support freebsd/x64");
    expect(() => proxyReleaseFor("linux", "ia32")).toThrow("does not support linux/ia32");
  });
});

describe("archive integrity", () => {
  test("hashes bytes with SHA-256", () => {
    expect(sha256(new TextEncoder().encode("proxy"))).toBe(
      "1241936d4dd3aad68fe7bfbdfe854b935926bc678fc72377e15166078916227a",
    );
  });

  test("accepts only the expected single-file layout", () => {
    expect(() => validateArchiveEntries(["claude-code-proxy", ""], "claude-code-proxy")).not.toThrow();
    expect(() => validateArchiveEntries(["../claude-code-proxy"], "claude-code-proxy")).toThrow();
    expect(() => validateArchiveEntries(["other", "claude-code-proxy"], "claude-code-proxy")).toThrow();
  });
});

describe("buildClaudeEnvironment", () => {
  test("sanitizes inherited providers and installs the isolated model mapping", () => {
    const source = {
      PATH: "test-path",
      ANTHROPIC_API_KEY: "must-not-leak",
      ANTHROPIC_BASE_URL: "https://wrong.invalid",
      ANTHROPIC_DEFAULT_OPUS_MODEL: "wrong",
      CLAUDE_CODE_USE_BEDROCK: "1",
      CLAUDE_CODE_USE_VERTEX: "1",
    };

    const env = buildClaudeEnvironment(source);

    expect(source.ANTHROPIC_API_KEY).toBe("must-not-leak");
    expect(env.PATH).toBe("test-path");
    expect(env.ANTHROPIC_API_KEY).toBeUndefined();
    expect(env.CLAUDE_CODE_USE_BEDROCK).toBeUndefined();
    expect(env.CLAUDE_CODE_USE_VERTEX).toBeUndefined();
    expect(env.ANTHROPIC_BASE_URL).toBe("http://127.0.0.1:18765");
    expect(env.ANTHROPIC_DEFAULT_FABLE_MODEL).toBe("gpt-5.6-sol[1m]");
    expect(env.ANTHROPIC_DEFAULT_OPUS_MODEL).toBe("gpt-5.6-terra[1m]");
    expect(env.ANTHROPIC_DEFAULT_SONNET_MODEL).toBe("gpt-5.6-luna[1m]");
    expect(env.ANTHROPIC_DEFAULT_HAIKU_MODEL).toBe("gpt-5.4-mini[1m]");
    expect(env.ANTHROPIC_SMALL_FAST_MODEL).toBe("gpt-5.4-mini[1m]");
  });
});
