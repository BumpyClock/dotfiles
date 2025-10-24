#!/bin/bash
# aconfmgr configuration - files to ignore

# Ignore kernel and bootloader files - we just want the package list
IgnorePath '/boot/*'
IgnorePath '/usr/lib/modules/*'
IgnorePath '/usr/lib/firmware/*'

# Ignore initramfs and kernel images
IgnorePath '/etc/mkinitcpio.d/*'

# Common system-generated files to ignore
IgnorePath '/etc/.updated'
IgnorePath '/etc/.pwd.lock'
IgnorePath '/etc/adjtime'
IgnorePath '/etc/machine-id'
IgnorePath '/etc/ca-certificates/*'
IgnorePath '/etc/ssl/certs/*'

# Ignore pacman cache and database
IgnorePath '/var/cache/pacman/*'
IgnorePath '/var/lib/pacman/local/*'

# Ignore systemd and journal files
IgnorePath '/var/lib/systemd/*'
IgnorePath '/var/log/*'

# Ignore user-specific files
IgnorePath '/etc/passwd'
IgnorePath '/etc/shadow'
IgnorePath '/etc/group'
IgnorePath '/etc/gshadow'
IgnorePath '/etc/subuid'
IgnorePath '/etc/subgid'
