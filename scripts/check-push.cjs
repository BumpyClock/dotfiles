const { spawnSync } = require('node:child_process');
const fs = require('node:fs');

function selectProjects(files) {
  if (files === null || files.length === 0) return ['scripts/link-dotfiles', 'tools'];
  const selected = new Set();
  for (const file of files) {
    if (file.startsWith('tools/')) selected.add('tools');
    else if (file.startsWith('scripts/link-dotfiles/') || file === 'shell/launchers.json') selected.add('scripts/link-dotfiles');
    else if (!/^(docs\/|shell\/|sysadmin\/|terminal-profiles\/|secrets\/|[^/]+\.md$)/.test(file)) {
      return ['scripts/link-dotfiles', 'tools'];
    }
  }
  return [...selected].sort();
}

function main(bases) {
  const version = spawnSync('bun', ['--version'], { encoding: 'utf8' });
  if (version.status !== 0 || version.stdout.trim() !== '1.3.14') {
    console.error('Use Bun 1.3.14, then prepare both projects with bun install --frozen-lockfile.');
    return 1;
  }
  let files = [];
  if (bases.length === 0) files = null;
  for (const base of bases) {
    const diff = spawnSync('git', ['diff', '--name-only', '-z', '--no-renames', base, 'HEAD', '--'], { encoding: 'utf8' });
    if (/^0+$/.test(base) || diff.status !== 0) { files = null; break; }
    files.push(...diff.stdout.split('\0').filter(Boolean));
  }
  const projects = selectProjects(files);
  console.log('Automation checks only. Shell/PowerShell lint and native macOS/Windows qualification remain separate.');
  for (const project of projects) {
    if (!fs.existsSync(`${project}/node_modules`) || (project === 'scripts/link-dotfiles' && !fs.existsSync(`${project}/node_modules/.bin/tsc`))) {
      console.error(`Run (cd ${project} && bun install --frozen-lockfile) before pushing.`);
      return 1;
    }
    const commands = project === 'scripts/link-dotfiles' ? [['run', 'typecheck'], ['test']] : [['test']];
    for (const args of commands) {
      const run = spawnSync('bun', args, { cwd: project, stdio: 'inherit' });
      if (run.status !== 0) return run.status ?? 1;
    }
  }
  return 0;
}

module.exports = { selectProjects };
if (require.main === module) process.exitCode = main(process.argv.slice(2));
