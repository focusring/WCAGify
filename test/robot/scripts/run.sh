#!/usr/bin/env bash
# Run the Robot Framework e2e suite using the suite's virtualenv. Forwards any
# extra CLI arguments to `robot`, so users can target individual tests:
#
#   pnpm test:robot                                   # full suite
#   pnpm test:robot -- --include smoke                # one tag
#   pnpm test:robot -- tests/02_extension_api_contract.robot
set -euo pipefail

ROBOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# On Windows (Git Bash / MSYS2) the venv layout uses Scripts/ instead of bin/.
if [[ -d "${ROBOT_DIR}/.venv/Scripts" ]]; then
  VENV_BIN="${ROBOT_DIR}/.venv/Scripts"
else
  VENV_BIN="${ROBOT_DIR}/.venv/bin"
fi

if [[ -x "$VENV_BIN/robot" ]]; then
  ROBOT_CMD="$VENV_BIN/robot"
elif [[ -x "$VENV_BIN/robot.exe" ]]; then
  ROBOT_CMD="$VENV_BIN/robot.exe"
else
  echo "Robot Framework venv not found. Run \`pnpm test:robot:setup\` first." >&2
  exit 1
fi

cd "$ROBOT_DIR"

# Default to running every suite under tests/ when no path is given.
if [[ "$#" -eq 0 ]]; then
  exec "$ROBOT_CMD" --outputdir results tests
else
  exec "$ROBOT_CMD" --outputdir results "$@"
fi
