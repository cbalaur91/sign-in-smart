#!/bin/bash
# Bun strips NODE_OPTIONS from child processes, so we set it here
# Required because Supabase auth cookies can exceed Node's default 16KB header limit
export NODE_OPTIONS='--max-http-header-size=131072'
exec node ./node_modules/.bin/next dev --turbopack "$@"
