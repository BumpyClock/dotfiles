#!/bin/bash

# Global Claude Code PreToolUse guard. Rules target commands that delete data,
# overwrite history, or irreversibly alter disks and deployed resources.
set -euo pipefail

deny() {
  jq -cn --arg reason "$1" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $reason
    }
  }'
}

if ! command="$(jq -er '.tool_input.command | select(type == "string" and length > 0)' 2>/dev/null)"; then
  deny "Blocked: destructive-command guard could not inspect Bash input."
  exit 0
fi

boundary='(^|[[:space:];|&()])'

# Compound commands such as `test && rm file` also match the boundary.
if printf '%s\n' "$command" | grep -Eq \
  "${boundary}(rm|rmdir|unlink|shred|srm)([[:space:]]|$)|${boundary}find[[:space:]].*-[[:space:]]*delete([[:space:]]|$)|${boundary}git[[:space:]]+reset[[:space:]]+--hard([[:space:]]|$)|${boundary}git[[:space:]]+clean[^;|&]*(-f|--force)|${boundary}git[[:space:]]+(checkout[[:space:]]+--|restore([[:space:]]|$)|branch[[:space:]]+-D([[:space:]]|$)|filter-(repo|branch)([[:space:]]|$))|${boundary}git[[:space:]]+push[^;|&]*(-f|--force)|${boundary}(mkfs(\.[[:alnum:]_]+)?|wipefs|fdisk|parted|dd)([[:space:]]|$)|${boundary}diskutil[[:space:]]+(eraseDisk|partitionDisk)([[:space:]]|$)|${boundary}(terraform[[:space:]]+destroy|kubectl[[:space:]]+delete|helm[[:space:]]+uninstall|aws[[:space:]]+s3[[:space:]]+rm|gsutil[[:space:]]+rm)([[:space:]]|$)|${boundary}(psql|mysql|sqlite3)[[:space:]].*(DROP[[:space:]]+(DATABASE|TABLE)|TRUNCATE[[:space:]]+TABLE|DELETE[[:space:]]+FROM)"; then
  deny "Blocked by global destructive-command guard. Use a non-destructive alternative or explicitly disable this hook for an intentional destructive operation."
fi
