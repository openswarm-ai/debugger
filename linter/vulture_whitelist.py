# Vulture whitelist — suppress false positives for symbols used by
# frameworks, entry points, and external consumers.
#
# Pass this file as an argument to vulture alongside source directories.
# Each bare name tells vulture "this symbol is intentionally used."

# backend/main.py — entry points referenced by string, not direct call
main
app

# FastAPI route handlers — registered via decorators, called by framework
pull_structure
push_structure
reset_color
reset_emoji
check

# FastAPI lifespan context managers — passed to SubApp constructor
debugger_lifespan
health_lifespan

# debug.py — module replaces itself with the debug() function via
# sys.modules[__name__] = debug, consumed by external packages
debug
