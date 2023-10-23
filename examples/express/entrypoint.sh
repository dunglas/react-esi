#!/bin/sh
# entrypoint.sh

# Install dependencies
corepack pnpm --filter=!esi-next install --frozen-lockfile --force

# Start the application
corepack pnpm --filter esi-express run dev
