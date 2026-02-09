#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/backend"

# Install dependencies if missing
if [ ! -d "node_modules" ]; then
  npm install --omit=dev
fi

npm start
