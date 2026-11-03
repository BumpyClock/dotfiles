#!/usr/bin/env zsh
# Run explicitly after shell/plugin updates. Native source freshness checks keep
# edited files working without a rebuild. No work is added to interactive startup.
emulate -R zsh
setopt extendedglob
umask 077

root="${${(%):-%x}:A:h}"
omz="${ZSH:-$HOME/.oh-my-zsh}"
custom="${ZSH_CUSTOM:-$omz/custom}"
files=(
  "$root/shared.zsh"
  "$omz/oh-my-zsh.sh"
  "$omz/tools/check_for_upgrade.sh"
  "$omz"/lib/*.zsh(N)
  "$custom/plugins/zsh-autosuggestions/zsh-autosuggestions.zsh"
  "$custom/plugins/fast-syntax-highlighting/fast-syntax-highlighting.plugin.zsh"
  "$custom/plugins/fast-syntax-highlighting/fast-highlight"
  "$custom/plugins/fast-syntax-highlighting/fast-string-highlight"
  "$HOME/.bun/_bun"
)

# Do not compile user profiles or git.plugin.zsh. Those can depend on aliases
# established by earlier statements, which whole-file compilation cannot retain.
integer compiled=0 current=0
for file in "${files[@]}"; do
  [[ -f "$file" && -w "${file:h}" ]] || continue
  if [[ "$file.zwc" -nt "$file" ]] && zcompile -t "$file.zwc" >/dev/null 2>&1; then
    (( current++ ))
    continue
  fi
  zcompile -U -- "$file" || exit 1
  (( compiled++ ))
done
print -r -- "Compiled $compiled startup files; $current already current."
