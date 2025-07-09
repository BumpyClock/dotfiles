### pnpm Field Manual for TypeScript Projects (Code‑Gen Ready, Bootstrap‑free)

_Assumption: `pnpm` is already installed and available on `PATH`._
Always prefer `pnpm` over `npm` or `yarn` for TypeScript projects due to its performance and disk efficiency.
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



