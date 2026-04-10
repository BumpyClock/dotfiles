import { describe, expect, test } from 'bun:test';
import path from 'node:path';

import { buildRequestPlan, outputPathFor, parseCliArgs } from './gpt-image.ts';

describe('parseCliArgs', () => {
  test('supports prompt-only generation', () => {
    expect(parseCliArgs(['an isometric ramen shop', 'ramen-shop.png'])).toEqual({
      referenceImagePaths: [],
      prompt: 'an isometric ramen shop',
      explicitOutputPath: 'ramen-shop.png',
      transparentBackground: false,
    });
  });

  test('accepts repeated reference images', () => {
    expect(parseCliArgs(['--ref', 'portrait.png', '--ref=logo.png', 'create a badge'])).toEqual({
      referenceImagePaths: ['portrait.png', 'logo.png'],
      prompt: 'create a badge',
      explicitOutputPath: undefined,
      transparentBackground: false,
    });
  });

  test('tracks the transparent background flag', () => {
    expect(parseCliArgs(['--transparent', 'a pixel-art cat sticker'])).toEqual({
      referenceImagePaths: [],
      prompt: 'a pixel-art cat sticker',
      explicitOutputPath: undefined,
      transparentBackground: true,
    });
  });

  test('rejects unsupported flags', () => {
    expect(parseCliArgs(['--unknown', 'prompt'])).toBeNull();
  });
});

describe('buildRequestPlan', () => {
  test('uses generate mode when no reference images are provided', () => {
    expect(
      buildRequestPlan({
        referenceImagePaths: [],
        prompt: 'a retro poster',
        transparentBackground: false,
      }),
    ).toEqual({
      requestKind: 'generate',
      referenceImagePaths: [],
      prompt: 'a retro poster',
      model: 'gpt-image-1-mini',
      outputFormat: 'png',
      background: 'opaque',
    });
  });

  test('uses edit mode when reference images are provided', () => {
    expect(
      buildRequestPlan({
        referenceImagePaths: ['portrait.png', 'logo.png'],
        prompt: 'create a badge',
        transparentBackground: true,
      }),
    ).toEqual({
      requestKind: 'edit',
      referenceImagePaths: ['portrait.png', 'logo.png'],
      prompt: 'create a badge',
      model: 'gpt-image-1-mini',
      outputFormat: 'png',
      background: 'transparent',
    });
  });
});

describe('outputPathFor', () => {
  test('derives a generated filename from the first reference image', () => {
    expect(outputPathFor(['/tmp/portrait.jpg'])).toBe('/tmp/portrait_generated.png');
  });

  test('uses the current working directory for prompt-only generation', () => {
    expect(outputPathFor([])).toBe(path.join(process.cwd(), 'gpt-image.png'));
  });
});
