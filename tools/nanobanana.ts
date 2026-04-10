#!/usr/bin/env bun

import { GoogleGenAI } from "@google/genai";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_MODEL = "gemini-2.5-flash-image";
const MIME_TYPES_BY_EXTENSION = new Map<string, string>([
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".webp", "image/webp"],
  [".gif", "image/gif"],
]);

const USAGE = `nanobanana - Image editing with Gemini's Nano Banana API
Usage:
  nanobanana <image-path> "<prompt>" [output-path]
  nanobanana <image-path> --ref <reference-image-path> "<prompt>" [output-path]

Examples:
  nanobanana photo.jpg "remove the people in the background"
  nanobanana selfie.png "add a sunset background" sunset_selfie.png
  nanobanana food.jpg "make it look more appetizing"
  nanobanana room.png --ref chair.png "place this chair next to the window" staged-room.png

Requires: GEMINI_API_KEY environment variable`;

type PromptPart = {
  text: string;
};

type InlineImagePart = {
  inlineData: {
    data: string;
    mimeType: string;
  };
};

type RequestContentPart = PromptPart | InlineImagePart;

export interface NanobananaCliArgs {
  imagePaths: string[];
  prompt: string;
  explicitOutputPath?: string;
}

function mimeTypeFor(filePath: string): string {
  return MIME_TYPES_BY_EXTENSION.get(path.extname(filePath).toLowerCase()) ?? "application/octet-stream";
}

function outputPathFor(imagePath: string, explicitOutputPath?: string): string {
  if (explicitOutputPath) {
    return explicitOutputPath;
  }

  const parsed = path.parse(imagePath);
  return path.join(parsed.dir, `${parsed.name}_edited${parsed.ext}`);
}

function extensionForMimeType(mimeType: string | undefined, fallbackPath: string): string {
  switch (mimeType) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    default: {
      const fallbackExtension = path.extname(fallbackPath);
      return fallbackExtension || ".png";
    }
  }
}

function normalizeGeneratedImage(data: string | Uint8Array): Buffer {
  if (typeof data === "string") {
    return Buffer.from(data, "base64");
  }

  return Buffer.from(data);
}

export function parseCliArgs(argv: string[]): NanobananaCliArgs | null {
  const [primaryImagePath, ...rest] = argv;
  if (!primaryImagePath) {
    return null;
  }

  if (rest[0] === "--ref") {
    const [, referenceImagePath, prompt, explicitOutputPath, ...extraArgs] = rest;
    if (!referenceImagePath || !prompt || extraArgs.length > 0) {
      return null;
    }
    return {
      imagePaths: [primaryImagePath, referenceImagePath],
      prompt,
      explicitOutputPath,
    };
  }

  if (rest[0]?.startsWith("--ref=")) {
    const referenceImagePath = rest[0].slice("--ref=".length);
    const [, prompt, explicitOutputPath, ...extraArgs] = rest;
    if (!referenceImagePath || !prompt || extraArgs.length > 0) {
      return null;
    }
    return {
      imagePaths: [primaryImagePath, referenceImagePath],
      prompt,
      explicitOutputPath,
    };
  }

  const [prompt, explicitOutputPath, ...extraArgs] = rest;
  if (!prompt || extraArgs.length > 0) {
    return null;
  }

  return {
    imagePaths: [primaryImagePath],
    prompt,
    explicitOutputPath,
  };
}

export async function buildRequestParts(imagePaths: string[], prompt: string): Promise<RequestContentPart[]> {
  const imageParts = await Promise.all(
    imagePaths.map(async (imagePath) => {
      const imageBytes = await readFile(imagePath);
      return {
        inlineData: {
          data: imageBytes.toString("base64"),
          mimeType: mimeTypeFor(imagePath),
        },
      };
    }),
  );

  return [{ text: prompt }, ...imageParts];
}

async function editImage(imagePaths: string[], prompt: string, explicitOutputPath?: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable not set");
  }

  const ai = new GoogleGenAI({ apiKey });
  const contents = await buildRequestParts(imagePaths, prompt);
  const primaryImagePath = imagePaths[0];

  console.log(`📷 Loading: ${imagePaths.join(", ")}`);
  console.log("🍌 Sending to Nano Banana...");
  console.log(`   Prompt: ${prompt}`);

  const response = await ai.models.generateContent({
    model: DEFAULT_MODEL,
    contents,
    config: {
      responseModalities: ["TEXT", "IMAGE"],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData?.data) {
      const outputExtension = extensionForMimeType(part.inlineData.mimeType, primaryImagePath);
      const defaultOutputPath = outputPathFor(primaryImagePath);
      const outputPath = explicitOutputPath ?? path.join(path.dirname(defaultOutputPath), `${path.parse(defaultOutputPath).name}${outputExtension}`);
      await writeFile(outputPath, normalizeGeneratedImage(part.inlineData.data));
      console.log(`✅ Saved: ${outputPath}`);
      return outputPath;
    }

    if ("text" in part && part.text) {
      console.log(`💬 Response: ${part.text}`);
    }
  }

  throw new Error("No image in response");
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

  for (const imagePath of parsedArgs.imagePaths) {
    if (!existsSync(imagePath)) {
      console.error(`Error: Image not found: ${imagePath}`);
      process.exit(1);
    }
  }

  try {
    await editImage(parsedArgs.imagePaths, parsedArgs.prompt, parsedArgs.explicitOutputPath);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    process.exit(1);
  }
}

if (import.meta.main) {
  await main();
}
