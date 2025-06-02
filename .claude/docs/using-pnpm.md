### pnpm Field Manual for TypeScript Projects (Code‑Gen Ready, Bootstrap‑free)

_Assumption: `pnpm` is already installed and available on `PATH`._

---

## 0 — Sanity Check

```bash
pnpm --version               # verify installation; exits 0
```

If the command fails, halt and report to the user.

---

## 1 — Daily Workflows

### 1.1 Project Setup Flow

```bash
mkdir my-ts-project                # ① create project directory
cd my-ts-project
pnpm init                          # ② initialize package.json
pnpm add -D typescript             # ③ add TypeScript as dev dependency
npx tsc --init                     # ④ create tsconfig.json
pnpm add react react-dom           # ⑤ add dependencies
pnpm add -D @types/react @types/react-dom  # ⑥ add type definitions
```

### 1.2 Figma Plugin Setup Flow

```bash
mkdir my-figma-plugin
cd my-figma-plugin
pnpm init
pnpm add -D typescript @figma/plugin-typings
pnpm add -D @create-figma-plugin/build @create-figma-plugin/tsconfig
pnpm add @create-figma-plugin/ui @create-figma-plugin/utilities preact
```

### 1.3 Development Workflow

```bash
pnpm install                       # install all dependencies
pnpm run build                     # build the project
pnpm run watch                     # watch mode for development
```

### 1.4 Adding Dependencies

```bash
pnpm add package-name              # add production dependency
pnpm add -D package-name           # add development dependency
pnpm remove package-name           # remove a dependency
```

### 1.5 Script Management

```bash
# Add scripts to package.json
# "scripts": {
#   "build": "tsc",
#   "dev": "tsc --watch",
#   "lint": "eslint src --ext .ts,.tsx"
# }

pnpm run build                    # run the build script
pnpm run dev                      # run dev script in watch mode
pnpm lint                         # shorthand for pnpm run lint
```

---

## 2 — Performance‑Tuning Knobs

| Setting               | Purpose                     | Configuration               |
|-----------------------|-----------------------------|----------------------------|
| `node-linker`         | Control how modules link    | Set in `.npmrc`            |
| `shamefully-hoist`    | Improve compatibility       | Set in `.npmrc`            |
| `auto-install-peers`  | Auto-install peer deps      | Set in `.npmrc`            |
| `store-dir`           | Custom location for cache   | Set in `.npmrc`            |
| `resolution`          | Force specific versions     | Add to `package.json`      |

Other handy commands:

```bash
pnpm store path                   # show store location
pnpm store prune                  # remove unused packages
pnpm -r exec -- cmd               # run command in all packages
```

---

## 3 — CI/CD Recipes

### 3.1 GitHub Actions

```yaml
# .github/workflows/build.yml
name: build
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm run build
      - run: pnpm run test
```

### 3.2 Docker

```dockerfile
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

FROM base
WORKDIR /app
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/dist ./dist
RUN pnpm install --prod --frozen-lockfile
CMD ["node", "dist/index.js"]
```

---

## 4 — Migration Matrix

| Legacy Tool          | pnpm Replacement            | Notes                     |
|----------------------|-----------------------------|-----------------------|
| `npm install`        | `pnpm install`              | Faster, disk-efficient   |
| `npm ci`             | `pnpm install --frozen-lockfile` | Strictly use lockfile  |
| `npm run`            | `pnpm run` or just `pnpm`   | Command shorthand works  |
| `npx`                | `pnpm dlx`                  | Run packages directly    |
| `npm publish`        | `pnpm publish`              | Same flags               |
| `yarn workspaces`    | `pnpm -r` or workspace      | Built-in monorepo support|

---

## 5 — Troubleshooting Fast‑Path

| Symptom                    | Resolution                                                |
|----------------------------|---------------------------------------------------------|
| Peer dependency warnings   | Add `auto-install-peers=true` to `.npmrc`               |
| Hoisting compatibility     | Add `shamefully-hoist=true` to `.npmrc`                |
| Lockfile conflicts         | `pnpm install --force`                                  |
| Node.js version mismatch   | Use `.nvmrc` or `volta pin node@X.Y.Z`                  |
| Types not found            | `pnpm add -D @types/package-name`                       |
| Module not found           | Check `tsconfig.json` paths and module resolution       |

---

## 6 — Exec Pitch (30 s)

```text
• 2–3× faster installs with 40% less disk space vs npm or yarn
• Strict dependency tree without node_modules hoisting for fewer bugs
• First-class monorepo support with efficient workspace commands
• Compatible with the npm ecosystem but vastly more efficient
```

---

## 7 — TypeScript Project Cheat‑Sheet (Copy/Paste)

```bash
# new TypeScript project
mkdir my-ts-project && cd my-ts-project && pnpm init -y && pnpm add -D typescript && npx tsc --init

# Figma plugin setup
pnpm add -D typescript @figma/plugin-typings @create-figma-plugin/build @create-figma-plugin/tsconfig
pnpm add @create-figma-plugin/ui @create-figma-plugin/utilities preact

# dev workflow
pnpm install
pnpm run build
pnpm run watch

# TypeScript + React project
pnpm add react react-dom
pnpm add -D @types/react @types/react-dom typescript

# ESLint setup
pnpm add -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

---

## 8 — Migrating From npm to pnpm for Your Figma Plugin

To migrate your Figma plugin from npm to pnpm, follow these steps:

1. Install pnpm if not already installed:
```bash
npm install -g pnpm
```

2. Remove npm's lock file and node_modules:
```bash
rm package-lock.json
rm -rf node_modules
```

3. Install dependencies with pnpm:
```bash
pnpm install
```

4. Update your scripts in package.json to use pnpm instead of npm:
```json
"scripts": {
  "build": "pnpm run build:css && pnpm run build:js",
  "build:css": "tailwindcss --input ./src/input.css --output ./src/output.css",
  "build:js": "build-figma-plugin --typecheck --minify",
  "watch": "pnpm run build:css && concurrently \"pnpm run watch:css\" \"pnpm run watch:js\"",
  "watch:css": "tailwindcss --input ./src/input.css --output ./src/output.css --watch",
  "watch:js": "build-figma-plugin --typecheck --watch"
}
```

5. Create a .npmrc file with recommended settings:
```bash
echo "shamefully-hoist=true" > .npmrc
echo "strict-peer-dependencies=false" >> .npmrc
```

---

_End of manual_
