#!/usr/bin/env bash
set -euo pipefail
# Single Vercel build entry point. Production behaviour is unchanged; staging builds only
# in the isolated project. Any other project or environment stops before building.
case "${VERCEL_PROJECT_ID:-}" in
  prj_JmAsZX65Qx58gtg62XnvOaawja7V)
    bash scripts/native-build/check-production-target.sh
    env -i PATH="$PATH" HOME="$PWD/.probe-home" bash scripts/native-build/build-native.sh
    npm run build
    ;;
  prj_swbuhEFJNiaPqVkEAyPomH1c05Ln)
    bash scripts/native-build/check-staging-target.sh
    env -i PATH="$PATH" HOME="$PWD/.probe-home" bash scripts/native-build/build-native.sh
    NEXT_PUBLIC_APP_URL="https://${VERCEL_URL}" npm run build
    ;;
  *)
    echo 'build_target_unknown_project' >&2
    exit 1
    ;;
esac
