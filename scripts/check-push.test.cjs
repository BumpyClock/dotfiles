const assert = require('node:assert/strict');
const { test } = require('node:test');
const { selectProjects } = require('./check-push.cjs');

test('automation selection includes dependencies, deletion, rename and shared fallback', () => {
  const all = ['scripts/link-dotfiles', 'tools'];
  for (const files of [null, [], ['.bun-version'], ['scripts/check-push.cjs'], ['unknown file'], ['scripts/link-dotfiles/deleted.ts', 'tools/renamed file.ts']]) {
    assert.deepEqual(selectProjects(files), all);
  }
  assert.deepEqual(selectProjects(['scripts/link-dotfiles/bun.lock']), ['scripts/link-dotfiles']);
  assert.deepEqual(selectProjects(['scripts/link-dotfiles/tsconfig.json']), ['scripts/link-dotfiles']);
  assert.deepEqual(selectProjects(['tools/package.json']), ['tools']);
  assert.deepEqual(selectProjects(['shell/launchers.json']), ['scripts/link-dotfiles']);
  assert.deepEqual(selectProjects(['shell/zsh/shared.zsh', 'README.md']), []);
});
