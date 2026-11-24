#!/usr/bin/env bash
set -euo pipefail
# Build-only source probe. Never imports application code or connects to a database.
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)"
cd "$ROOT"
WORK="$ROOT/.probe-build"
PREFIX="$WORK/prefix"
mkdir -p "$WORK" "$ROOT/.probe-home" "$ROOT/.probe-cache"
for tool in curl tar make gcc g++ python3 perl readelf sha256sum ldd; do command -v "$tool" >/dev/null || { echo "missing_build_tool:$tool"; exit 1; }; done
bash scripts/native-build/build-parser-tools.sh
export PATH="$WORK/parser-prefix/bin:$PATH"
export M4="$WORK/parser-prefix/bin/m4"
export BISON_PKGDATADIR="$WORK/parser-prefix/share/bison"
node -e 'if(process.versions.node.split(".")[0]!=="24"||process.platform!=="linux")process.exit(1); console.log(JSON.stringify({node:process.versions.node,abi:process.versions.modules,arch:process.arch,platform:process.platform}))'
if [ ! -f "$WORK/postgresql.tar.bz2" ]; then
curl --fail --location --proto '=https' --tlsv1.2 --max-time 120 \
  https://ftp.postgresql.org/pub/source/v17.11/postgresql-17.11.tar.bz2 -o "$WORK/postgresql.tar.bz2"
fi
printf '%s  %s\n' dd27f2b3c59e73ed14aa3324901242bf69a032a6347805f274e6260322d42979 "$WORK/postgresql.tar.bz2" | sha256sum --check --status
mkdir -p "$WORK/source"
tar -xjf "$WORK/postgresql.tar.bz2" --strip-components=1 -C "$WORK/source"
cd "$WORK/source"
./configure --prefix="$PREFIX" --with-openssl --without-readline --without-zlib --without-icu --without-ldap --without-gssapi --disable-rpath
make -j2 -C src/interfaces/libpq
make -C src/interfaces/libpq install
make -j2 -C src/bin/pg_config
make -C src/bin/pg_config install
make -C src/include install
cd "$ROOT"
mkdir -p "$WORK/bin"
# Exact relative RUNPATH wrapper is filled after local gyp/make verification.
if [ ! -f scripts/native-build/pg-config-wrapper.sh ]; then echo relative_runpath_wrapper_not_verified; exit 1; fi
export CEE_PROBE_PG_CONFIG="$PREFIX/bin/pg_config"
cp scripts/native-build/pg-config-wrapper.sh "$WORK/bin/pg_config"
chmod +x "$WORK/bin/pg_config"
export PATH="$WORK/bin:$PATH"
npm rebuild libpq --foreground-scripts --userconfig="$ROOT/.probe-home/.npmrc" --globalconfig=/dev/null --cache "$ROOT/.probe-cache"
ADDON="$ROOT/node_modules/libpq/build/Release/addon.node"
cp -L "$PREFIX/lib/libpq.so.5" "$(dirname "$ADDON")/libpq.so.5"
readelf -d "$ADDON"
readelf -d "$ADDON" | grep -E '(RPATH|RUNPATH).*\[\$ORIGIN\]' >/dev/null
if readelf -d "$ADDON" | grep -E '(RPATH|RUNPATH)' | grep -F "$WORK"; then echo absolute_runpath_rejected; exit 1; fi
if ldd "$ADDON" | grep -F 'not found'; then echo missing_native_dependency; exit 1; fi
node -e 'const pg=require("pg");if(!pg.native)process.exit(1);new pg.native.Client({host:"127.0.0.1",port:1,user:"synthetic_unused",password:"synthetic_unused",database:"synthetic_unused"});console.log("native_build_load_pass_no_connection")'
