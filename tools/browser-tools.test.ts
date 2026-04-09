import { describe, expect, test } from 'bun:test';
import os from 'node:os';
import path from 'node:path';
import {
  buildChromeLaunchArgs,
  resolveChromeProfileSettings,
} from './browser-tools';

describe('resolveChromeProfileSettings', () => {
  test('uses the live Chrome user data dir for --real-profile', () => {
    const settings = resolveChromeProfileSettings({
      profile: false,
      realProfile: true,
      profileDir: '/tmp/browser-tools-profile',
    });

    expect(settings).toEqual({
      mode: 'real',
      userDataDir: path.join(os.homedir(), 'Library', 'Application Support', 'Google', 'Chrome'),
    });
  });

  test('rejects conflicting copied and real profile flags', () => {
    expect(() =>
      resolveChromeProfileSettings({
        profile: true,
        realProfile: true,
        profileDir: '/tmp/browser-tools-profile',
      }),
    ).toThrow('--profile and --real-profile cannot be used together');
  });
});

describe('buildChromeLaunchArgs', () => {
  test('includes profile directory when provided', () => {
    expect(
      buildChromeLaunchArgs({
        port: 9222,
        userDataDir: '/tmp/browser-tools-profile',
        profileDirectory: 'Profile 1',
      }),
    ).toEqual([
      '--remote-debugging-port=9222',
      '--user-data-dir=/tmp/browser-tools-profile',
      '--no-first-run',
      '--disable-popup-blocking',
      '--profile-directory=Profile 1',
    ]);
  });
});
