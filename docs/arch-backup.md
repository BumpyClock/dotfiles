# Arch Package Backup

## Exporting the current state
- Run `./arch/export-arch-packages.sh` from the repo root.
- Commit the generated files under `arch/package-state/` so the package state travels with the dotfiles.
- Re-run the script whenever you add/remove packages so the snapshot stays fresh.

## Restoring on a clean Arch install
- Clone the dotfiles repo and ensure the system is up to date with `sudo pacman -Syu`.
- Install repo packages with `sudo pacman -S --needed - < arch/package-state/pacman-native-explicit.txt`.
- Install AUR packages using your preferred helper (example with paru: `paru -S --needed - < arch/package-state/pacman-aur-explicit.txt`).
- Optional: for Flatpak apps, run `flatpak install --user --noninteractive $(cat arch/package-state/flatpak-apps.txt)` or review manually.
- Restart the export script after the restore to verify nothing is missing.
