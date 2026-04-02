import argparse
import sys


DEFAULT_PORT = 6969


def main():
    parser = argparse.ArgumentParser(
        prog="swarm-debug",
        description="A colorized, toggleable debug logger with a web GUI.",
    )
    parser.add_argument(
        "--gui",
        action="store_true",
        help="Launch the debug configuration GUI",
    )
    parser.add_argument(
        "--port", "-p",
        type=int,
        default=DEFAULT_PORT,
        help=f"Port for the GUI server (default: {DEFAULT_PORT})",
    )
    parser.add_argument(
        "--version",
        action="version",
        version="swarm-debug 0.1.0",
    )

    args = parser.parse_args()

    if args.gui:
        from backend.main import start_server
        start_server(port=args.port, open_browser=True)
    else:
        parser.print_help()
        sys.exit(0)
