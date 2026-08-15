#!/usr/bin/env bun

import OpenAI, { toFile } from "openai";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type SupportedModel = "gpt-image-1-mini" | "gpt-image-2" | "gpt-image-1";

const DEFAULT_MODEL: SupportedModel = "gpt-image-1-mini";
const SUPPORTED_MODELS: readonly SupportedModel[] = [
  "gpt-image-1-mini",
  "gpt-image-2",
  "gpt-image-1",
];
const SUPPORTED_MODELS_TEXT = SUPPORTED_MODELS.join(", ");
const MAX_REFERENCE_IMAGES = 16;
const SUPPORTED_IMAGE_MIME_TYPES = new Map<string, string>([
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".webp", "image/webp"],
]);

const USAGE = `gpt-image - Image generation with OpenAI's GPT Image API
Usage:
  gpt-image "<prompt>" [output-path]
  gpt-image --model <model> "<prompt>" [output-path]
  gpt-image --ref <image-path> "<prompt>" [output-path]
  gpt-image --ref <image-path> --ref <image-path> "<prompt>" [output-path]
  gpt-image --transparent "<prompt>" [output-path]

Options:
  --model <model>   Use one of: ${SUPPORTED_MODELS_TEXT} (default: ${DEFAULT_MODEL})

Examples:
  gpt-image "an isometric miniature ramen shop at dusk"
  gpt-image --model gpt-image-1 "a retro-futuristic travel poster for Kyoto" kyoto-poster.png
  gpt-image --ref mug.png "place this mug on a wooden desk in morning light" mug-scene.png
  gpt-image --ref portrait.png --ref logo.png "create a conference badge using these references" badge.png
  gpt-image --transparent "a flat pixel-art cat sticker"

Requires: OPENAI_API_KEY environment variable`;

type BackgroundMode = "transparent" | "opaque";
type RequestKind = "generate" | "edit";

export interface GptImageCliArgs {
  referenceImagePaths: string[];
  prompt: string;
  explicitOutputPath?: string;
  transparentBackground: boolean;
  model?: SupportedModel;
}

export interface GptImageRequestPlan {
  requestKind: RequestKind;
  referenceImagePaths: string[];
  prompt: string;
  model: SupportedModel;
  outputFormat: "png";
  background: BackgroundMode;
}

function mimeTypeFor(filePath: string): string {
  const mimeType = SUPPORTED_IMAGE_MIME_TYPES.get(
    path.extname(filePath).toLowerCase(),
  );
  if (!mimeType) {
    throw new Error(
      `Unsupported image format: ${filePath}. Use png, jpg, or webp`,
    );
  }
  return mimeType;
}

function normalizeModel(value: string): SupportedModel | null {
  const normalizedValue = value.toLowerCase();
  for (const model of SUPPORTED_MODELS) {
    if (model === normalizedValue) {
      return model;
    }
  }

  return null;
}

export function parseCliArgs(argv: string[]): GptImageCliArgs | null {
  const referenceImagePaths: string[] = [];
  const positionals: string[] = [];
  let transparentBackground = false;
  let selectedModel: SupportedModel | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--ref") {
      const referenceImagePath = argv[index + 1];
      if (!referenceImagePath || referenceImagePath.startsWith("-")) {
        return null;
      }
      referenceImagePaths.push(referenceImagePath);
      index += 1;
      continue;
    }

    if (arg.startsWith("--ref=")) {
      const referenceImagePath = arg.slice("--ref=".length);
      if (!referenceImagePath) {
        return null;
      }
      referenceImagePaths.push(referenceImagePath);
      continue;
    }

    if (arg === "--model") {
      const modelName = argv[index + 1];
      if (!modelName || modelName.startsWith("-")) {
        return null;
      }
      const normalizedModel = normalizeModel(modelName);
      if (!normalizedModel) {
        return null;
      }
      selectedModel = normalizedModel;
      index += 1;
      continue;
    }

    if (arg.startsWith("--model=")) {
      const modelName = arg.slice("--model=".length);
      if (!modelName) {
        return null;
      }
      const normalizedModel = normalizeModel(modelName);
      if (!normalizedModel) {
        return null;
      }
      selectedModel = normalizedModel;
      continue;
    }

    if (arg === "--transparent") {
      transparentBackground = true;
      continue;
    }

    if (arg.startsWith("-")) {
      return null;
    }

    positionals.push(arg);
  }

  if (referenceImagePaths.length > MAX_REFERENCE_IMAGES) {
    return null;
  }

  const [prompt, explicitOutputPath, ...extraPositionals] = positionals;
  if (!prompt || extraPositionals.length > 0) {
    return null;
  }

  return {
    referenceImagePaths,
    prompt,
    explicitOutputPath,
    transparentBackground,
    model: selectedModel,
  };
}

export function buildRequestPlan(args: GptImageCliArgs): GptImageRequestPlan {
  return {
    requestKind: args.referenceImagePaths.length > 0 ? "edit" : "generate",
    referenceImagePaths: args.referenceImagePaths,
    prompt: args.prompt,
    model: args.model ?? DEFAULT_MODEL,
    outputFormat: "png",
    background: args.transparentBackground ? "transparent" : "opaque",
  };
}

export function outputPathFor(
  referenceImagePaths: string[],
  explicitOutputPath?: string,
): string {
  if (explicitOutputPath) {
    return explicitOutputPath;
  }

  const primaryReferenceImage = referenceImagePaths[0];
  if (!primaryReferenceImage) {
    return path.join(process.cwd(), "gpt-image.png");
  }

  const parsed = path.parse(primaryReferenceImage);
  return path.join(parsed.dir, `${parsed.name}_generated.png`);
}

async function loadReferenceImages(imagePaths: string[]) {
  return Promise.all(
    imagePaths.map(async (imagePath) =>
      toFile(await readFile(imagePath), path.basename(imagePath), {
        type: mimeTypeFor(imagePath),
      }),
    ),
  );
}

function normalizeGeneratedImage(data: string | undefined): Buffer {
  if (!data) {
    throw new Error("No image in response");
  }

  return Buffer.from(data, "base64");
}

async function generateImage(args: GptImageCliArgs): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable not set");
  }

  const client = new OpenAI({ apiKey });
  const plan = buildRequestPlan(args);
  const outputPath = outputPathFor(
    plan.referenceImagePaths,
    args.explicitOutputPath,
  );

  if (plan.requestKind === "edit") {
    console.log(`🖼️ Loading: ${plan.referenceImagePaths.join(", ")}`);
  } else {
    console.log("🖼️ Generating from prompt only");
  }
  console.log("✨ Sending to GPT Image...");
  console.log(`   Prompt: ${plan.prompt}`);
  console.log(`   Model: ${plan.model}`);

  const response =
    plan.requestKind === "edit"
      ? await client.images.edit({
          model: plan.model,
          image: await loadReferenceImages(plan.referenceImagePaths),
          prompt: plan.prompt,
          background: plan.background,
          output_format: plan.outputFormat,
        })
      : await client.images.generate({
          model: plan.model,
          prompt: plan.prompt,
          background: plan.background,
          output_format: plan.outputFormat,
        });

  await writeFile(
    outputPath,
    normalizeGeneratedImage(response.data?.[0]?.b64_json),
  );
  console.log(`✅ Saved: ${outputPath}`);
  return outputPath;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(USAGE);
    process.exit(0);
  }

  const parsedArgs = parseCliArgs(argv);
  if (!parsedArgs) {
    console.log(USAGE);
    process.exit(1);
  }

  for (const referenceImagePath of parsedArgs.referenceImagePaths) {
    if (!existsSync(referenceImagePath)) {
      console.error(`Error: Image not found: ${referenceImagePath}`);
      process.exit(1);
    }
  }

  try {
    await generateImage(parsedArgs);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    process.exit(1);
  }
}

if (import.meta.main) {
  await main();
}
