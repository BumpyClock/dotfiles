import { parseArgs } from "./core/cli";
import { runLoop } from "./core/loop-engine";
import { getProviderAdapter } from "./providers/registry";

async function main(): Promise<void> {
  const options = parseArgs();
  const provider = getProviderAdapter(options.provider);
  await runLoop(options, provider);
}

main().catch((error) => {
  console.error("ouroboros failed:", error);
  process.exit(1);
});
