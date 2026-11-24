#!/bin/sh
set -eu
: "${CEE_PROBE_PG_CONFIG:?private official pg_config required}"
case "$1" in
 --ldflags) cat <<'FLAGS'
-Wl,-rpath,\'$$ORIGIN\'
FLAGS
;;
 *) exec "$CEE_PROBE_PG_CONFIG" "$@";;
esac
