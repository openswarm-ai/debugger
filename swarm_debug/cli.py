import argparse
import sys


def main():
    parser = argparse.ArgumentParser(
        prog="swarm-debug",
        description="A colorized, toggleable debug logger with a web GUI.",
    )
    parser.add_argument(
        "--gui",
        action="store_true",
        help="Launch the debug configuration GUI (serves on http://localhost:8324)",
    )
    parser.add_argument(
        "--version",
        action="version",
        version="swarm-debug 0.1.0",
    )

    args = parser.parse_args()

    if args.gui:
        from backend.main import main as start_server
        start_server()
    else:
        parser.print_help()
        sys.exit(0)
