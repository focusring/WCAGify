#!/usr/bin/env bash
# Bootstrap a Python venv for the Robot Framework e2e suite and install all
# Python dependencies + Playwright browsers. Re-running is safe — pip is
# idempotent and the venv is reused if present.
set -euo pipefail

ROBOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
VENV_DIR="${ROBOT_DIR}/.venv"

# Browser library 19.x requires Python >= 3.10. Prefer an explicitly-versioned
# binary so we don't accidentally pick the macOS 3.9 system Python.
PYTHON_BIN=""
for candidate in python3.13 python3.12 python3.11 python3.10; do
  if command -v "$candidate" >/dev/null 2>&1; then
    PYTHON_BIN="$candidate"
    break
  fi
done

# Fall back to plain python3 only if it is >= 3.10.
if [[ -z "$PYTHON_BIN" ]] && command -v python3 >/dev/null 2>&1; then
  if python3 -c 'import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)'; then
    PYTHON_BIN="python3"
  fi
fi

if [[ -z "$PYTHON_BIN" ]]; then
  cat >&2 <<'EOF'
Error: Python >= 3.10 is required by robotframework-browser 19.x but no
suitable interpreter was found on PATH.

Install one, then re-run this command:
  • macOS (Homebrew):   brew install python@3.12
  • Other platforms:    https://www.python.org/downloads/
EOF
  exit 1
fi

echo "Using $PYTHON_BIN ($($PYTHON_BIN --version))"

if [[ ! -d "$VENV_DIR" ]]; then
  echo "Creating venv at $VENV_DIR"
  "$PYTHON_BIN" -m venv "$VENV_DIR"
fi

# On Windows (Git Bash / MSYS2) the venv layout uses Scripts/ instead of bin/.
# shellcheck disable=SC1091
if [[ -f "$VENV_DIR/Scripts/activate" ]]; then
  source "$VENV_DIR/Scripts/activate"
else
  source "$VENV_DIR/bin/activate"
fi

python -m pip install --upgrade pip >/dev/null
python -m pip install -r "$ROBOT_DIR/requirements.txt"

# Browser library ships with a Node helper that pulls down Playwright browsers
# the first time it runs. Idempotent.
rfbrowser init

echo
echo "Robot Framework e2e suite ready."
echo "Run with: pnpm test:robot"
