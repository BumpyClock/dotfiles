#!/usr/bin/env bun

import { GoogleGenAI } from "@google/genai";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_MODEL = "gemini-2.5-flash-image";
const USAGE = `nanobanana - Image editing with Gemini's Nano Banana Pro API
Usage: nanobanana <image-path> "<prompt>" [output-path]

Examples:
  nanobanana photo.jpg "remove the people in the background"
  nanobanana selfie.png "add a sunset background" sunset_selfie.png
  nanobanana food.jpg "make it look more appetizing"

Requires: GEMINI_API_KEY environment variable`;

function mimeTypeFor(filePath: string): string {
  switch (path.extname(filePath).toLowerCase()) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    default:
      return "application/octet-stream";
  }
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

async function editImage(imagePath: string, prompt: string, explicitOutputPath?: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable not set");
  }

  const ai = new GoogleGenAI({ apiKey });
  const imageBytes = await readFile(imagePath);
  console.log(`📷 Loading: ${imagePath}`);
  console.log("🍌 Sending to Nano Banana Pro...");
  console.log(`   Prompt: ${prompt}`);

  const response = await ai.models.generateContent({
    model: DEFAULT_MODEL,
    contents: [
      { text: prompt },
      {
        inlineData: {
          data: imageBytes.toString("base64"),
          mimeType: mimeTypeFor(imagePath),
        },
      },
    ],
    config: {
      responseModalities: ["TEXT", "IMAGE"],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData?.data) {
      const outputExtension = extensionForMimeType(part.inlineData.mimeType, imagePath);
      const outputPath =
        explicitOutputPath ??
        path.join(path.dirname(imagePath), `${path.parse(imagePath).name}_edited${outputExtension}`);
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

  const [imagePath, prompt, explicitOutputPath] = argv;
  if (!imagePath || !prompt) {
    console.log(USAGE);
    process.exit(1);
  }

  if (!existsSync(imagePath)) {
    console.error(`Error: Image not found: ${imagePath}`);
    process.exit(1);
  }

  try {
    await editImage(imagePath, prompt, explicitOutputPath);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    process.exit(1);
  }
}

await main();
