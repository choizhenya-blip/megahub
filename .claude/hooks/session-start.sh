#!/bin/bash
set -euo pipefail

# Only run in remote (web) environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Install npm dependencies
npm install

# Install Playwright browser binaries (non-fatal if download is unavailable)
npx playwright install --with-deps chromium || echo "Warning: Playwright browser install failed, browsers may already be available"
