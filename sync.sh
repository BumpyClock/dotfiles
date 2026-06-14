#!/bin/bash
# ABOUTME: Sync dotfiles repo: optionally discard local changes/commits, fast-forward pull, update submodules.
# ABOUTME: Use --latest to bump submodules to their upstream HEAD (commits new SHAs in parent).
# ABOUTME: Use --discard-commits to drop unpushed local commits and hard-reset to upstream.

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status()  { echo -e "${GREEN}[INFO]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARN]${NC} $1"; }
print_error()   { echo -e "${RED}[ERROR]${NC} $1"; }

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_ROOT"

usage() {
    cat <<'EOF'
Usage: sync.sh [options]

Options:
  --keep               Keep local tracked-file changes (default: discard unstaged)
  --discard-commits    Drop unpushed local commits + unstaged changes (hard reset to upstream)
  --no-submodules      Skip submodule update
  --latest             Bump submodules to upstream HEAD before recursive update
  -h, --help           Show this help message and exit

Default flow: discard unstaged tracked-file changes, fast-forward pull from
origin, then init + recursively update submodules to parent-recorded SHAs.
Warns when local has unpushed commits (use --discard-commits to drop them).
EOF
}

KEEP_LOCAL=0
DISCARD_COMMITS=0
UPDATE_SUBS=1
LATEST=0

while [[ $# -gt 0 ]]; do
    case "$1" in
        --keep)             KEEP_LOCAL=1 ;;
        --discard-commits)  DISCARD_COMMITS=1 ;;
        --no-submodules)    UPDATE_SUBS=0 ;;
        --latest)           LATEST=1 ;;
        -h|--help)          usage; exit 0 ;;
        *) print_error "Unknown option: $1"; usage; exit 1 ;;
    esac
    shift
done

if [[ $KEEP_LOCAL -eq 1 && $DISCARD_COMMITS -eq 1 ]]; then
    print_error "--keep and --discard-commits are mutually exclusive"
    exit 1
fi

print_status "Repo: $REPO_ROOT"

print_status "Fetching origin"
git fetch origin --quiet

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
UPSTREAM="$(git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null || echo "origin/$BRANCH")"
AHEAD="$(git rev-list --count "$UPSTREAM..HEAD" 2>/dev/null || echo 0)"
BEHIND="$(git rev-list --count "HEAD..$UPSTREAM" 2>/dev/null || echo 0)"

[[ $AHEAD -gt 0 ]]   && print_warning "Local is $AHEAD commit(s) ahead of $UPSTREAM"
[[ $BEHIND -gt 0 ]]  && print_warning "Local is $BEHIND commit(s) behind $UPSTREAM"

if [[ $DISCARD_COMMITS -eq 1 ]]; then
    if [[ -n "$(git status --porcelain)" ]] || [[ $AHEAD -gt 0 ]]; then
        print_warning "Hard-resetting to $UPSTREAM (--discard-commits)"
        git reset --hard "$UPSTREAM"
    else
        print_status "Nothing to discard"
    fi
else
    if [[ $AHEAD -gt 0 && $BEHIND -gt 0 ]]; then
        print_error "Diverged from $UPSTREAM. Use --discard-commits or rebase manually."
        exit 1
    fi
    if [[ $KEEP_LOCAL -eq 0 ]] && [[ -n "$(git status --porcelain)" ]]; then
        print_warning "Discarding unstaged changes (--keep to preserve)"
        git restore .
    fi
    if [[ $AHEAD -gt 0 ]]; then
        print_warning "Keeping $AHEAD local commit(s); --ff-only will no-op. Use --discard-commits to drop them."
    fi
    print_status "Pulling (fast-forward only)"
    git pull --ff-only
fi

if [[ $UPDATE_SUBS -eq 1 ]]; then
    if [[ $LATEST -eq 1 ]]; then
        print_status "Bumping submodules to upstream HEAD (--merge)"
        git submodule update --remote --merge
    fi
    print_status "Updating submodules (init + recursive)"
    git submodule update --init --recursive
fi

print_status "Done"
git status --short -b
git submodule status
