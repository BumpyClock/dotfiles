#!/bin/bash
# Initial setup for aconfmgr

set -e

cd "$(dirname "$0")/.."

echo ":: Running initial aconfmgr save..."
sudo aconfmgr -c arch/aconfmgr save

echo ""
echo ":: Done! Your system state has been saved to arch/aconfmgr/"
echo ":: Review the generated files and commit them to git when ready."
echo ""
echo ":: To update the snapshot later, run:"
echo "   sudo aconfmgr -c arch/aconfmgr save"
