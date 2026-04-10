import { describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { buildRequestParts, parseCliArgs } from './nanobanana.ts';

const createTempDir = (): string => fs.mkdtempSync(path.join(os.tmpdir(), 'dotfiles-nanobanana-test-'));

describe('parseCliArgs', () => {
  test('keeps the original single-image CLI syntax working', () => {
    expect(parseCliArgs(['photo.png', 'remove the background', 'edited.png'])).toEqual({
      imagePaths: ['photo.png'],
      prompt: 'remove the background',
      explicitOutputPath: 'edited.png',
    });
  });

  test('accepts a second image through the --ref flag', () => {
    expect(parseCliArgs(['room.png', '--ref', 'chair.png', 'place this chair by the window', 'staged-room.png'])).toEqual({
      imagePaths: ['room.png', 'chair.png'],
      prompt: 'place this chair by the window',
      explicitOutputPath: 'staged-room.png',
    });
  });

  test('accepts the --ref=<path> shorthand', () => {
    expect(parseCliArgs(['room.png', '--ref=chair.png', 'place this chair by the window'])).toEqual({
      imagePaths: ['room.png', 'chair.png'],
      prompt: 'place this chair by the window',
      explicitOutputPath: undefined,
    });
  });

  test('rejects extra positional arguments after the --ref=<path> shorthand', () => {
    expect(parseCliArgs(['room.png', '--ref=chair.png', 'place this chair by the window', 'staged-room.png', 'extra'])).toBeNull();
  });
});

test('buildRequestParts adds one inline image part for each input image', async () => {
  const tempDir = createTempDir();
  const firstImagePath = path.join(tempDir, 'room.png');
  const secondImagePath = path.join(tempDir, 'chair.jpg');

  try {
    fs.writeFileSync(firstImagePath, 'room-image');
    fs.writeFileSync(secondImagePath, 'chair-image');

    const parts = await buildRequestParts([firstImagePath, secondImagePath], 'Place the chair in the room');

    expect(parts).toHaveLength(3);
    expect(parts[0]).toEqual({ text: 'Place the chair in the room' });

    expect('inlineData' in parts[1]).toBeTrue();
    if ('inlineData' in parts[1]) {
      expect(parts[1].inlineData.mimeType).toBe('image/png');
      expect(Buffer.from(parts[1].inlineData.data, 'base64').toString('utf8')).toBe('room-image');
    }

    expect('inlineData' in parts[2]).toBeTrue();
    if ('inlineData' in parts[2]) {
      expect(parts[2].inlineData.mimeType).toBe('image/jpeg');
      expect(Buffer.from(parts[2].inlineData.data, 'base64').toString('utf8')).toBe('chair-image');
    }
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
