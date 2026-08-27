#!/usr/bin/env bash
# Opt-in local release script for a standalone Python agent. It never runs in
# the mobile app or server deployment and does not store keys in this project.
set -euo pipefail

SOURCE="${1:?Usage: bash scripts/protect-python-agent.sh /absolute/path/to/agent.py [output-dir]}"
OUTPUT="${2:-dist-protected-agent}"

if [[ ! -f "$SOURCE" || "${SOURCE##*.}" != "py" ]]; then
  echo "The first argument must be an existing .py file." >&2
  exit 2
fi

python3 -m pip install --upgrade pyarmor
rm -rf "$OUTPUT"
pyarmor gen --output "$OUTPUT" --obf-code 2 --mix-str "$SOURCE"

echo "Protected distribution created in: $OUTPUT"
echo "Distribute the entire directory, including pyarmor_runtime_*. Test it on the target Python version and platform."
