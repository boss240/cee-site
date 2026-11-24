#!/bin/sh
# Official Debian source originals, hashes anchored in signed trixie Sources metadata.
# Private build-time tools only; no package installation, server, or database connection.
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
WORK="$ROOT/.probe-build/parser-tools"
PREFIX="$ROOT/.probe-build/parser-prefix"
mkdir -p "$WORK" "$PREFIX"
fetch_extract() {
  name=$1; url=$2; digest=$3; directory=$4
  if [ ! -f "$WORK/$name" ]; then
    curl --fail --location --proto '=https' --tlsv1.2 --connect-timeout 15 --max-time 120 "$url" -o "$WORK/$name.partial"
    mv "$WORK/$name.partial" "$WORK/$name"
  fi
  printf '%s  %s\n' "$digest" "$WORK/$name" | sha256sum -c -
  # Fresh source directory prevents old generated artifacts concealing recipe defects.
  [ ! -e "$WORK/$directory" ] || { echo 'parser_source_directory_already_exists' >&2; exit 1; }
  tar -xf "$WORK/$name" -C "$WORK"
}
fetch_extract m4_1.4.19.orig.tar.xz https://deb.debian.org/debian/pool/main/m/m4/m4_1.4.19.orig.tar.xz 63aede5c6d33b6d9b13511cd0be2cac046f2e70fd0a07aa9573a04a82783af96 m4-1.4.19
fetch_extract bison_3.8.2+dfsg.orig.tar.xz https://deb.debian.org/debian/pool/main/b/bison/bison_3.8.2+dfsg.orig.tar.xz dff8a3c96dd34121828f62a7fa49e1f7765815b89e59f564e8d2a9e71c177be5 bison-3.8.2
fetch_extract flex_2.6.4.orig.tar.gz https://deb.debian.org/debian/pool/main/f/flex/flex_2.6.4.orig.tar.gz e87aae032bf07c26f85ac0ed3250998c37621d95f8bd748b31f15b33c45ee995 flex-2.6.4
(
 cd "$WORK/m4-1.4.19"
 ./configure --prefix="$PREFIX" --disable-nls
 make -j2 -C lib
 make -j2 -C src
 make -C src install-binPROGRAMS
)
PATH="$PREFIX/bin:$PATH"; export PATH
M4="$PREFIX/bin/m4"; export M4
(
 cd "$WORK/bison-3.8.2"
 ./configure --prefix="$PREFIX" --disable-nls
 # Target-only build must first generate gnulib headers (normally prerequisites of all).
 printf 'probe-built-headers: $(filter lib/%%,$(BUILT_SOURCES))\n' | make -j2 -f Makefile -f - probe-built-headers
 make -j2 src/bison
 make install-binPROGRAMS install-dist_pkgdataDATA install-dist_m4sugarDATA install-dist_skeletonsDATA
)
BISON_PKGDATADIR="$PREFIX/share/bison"; export BISON_PKGDATADIR
(
 cd "$WORK/flex-2.6.4"
 ./configure --prefix="$PREFIX" --disable-nls --disable-shared
 make -j2 -C src
 make -C src install-binPROGRAMS
)
"$PREFIX/bin/m4" --version | head -1
"$PREFIX/bin/bison" --version | head -1
"$PREFIX/bin/flex" --version
# Functional smoke verifies installed generator data, not just binary startup.
printf 'define(`probe_macro\047,`parser_tools_ok\047)probe_macro\n' | "$PREFIX/bin/m4" | grep -qx parser_tools_ok
cat > "$WORK/probe.y" <<'YACC'
%token TOKEN
%%
input: TOKEN;
%%
YACC
"$PREFIX/bin/bison" -o "$WORK/probe-parser.c" "$WORK/probe.y"
cat > "$WORK/probe.l" <<'LEX'
%option noyywrap
%%
. ECHO;
%%
LEX
"$PREFIX/bin/flex" -o "$WORK/probe-scanner.c" "$WORK/probe.l"
test -s "$WORK/probe-parser.c" && test -s "$WORK/probe-scanner.c"
printf '%s\n' parser_tools_source_build_and_smoke_passed
