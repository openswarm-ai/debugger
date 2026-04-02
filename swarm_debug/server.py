import logging
import os
import uvicorn

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

from swarm_debug.config.Apps import MainApp
from swarm_debug.apps.health.health import health
from swarm_debug.apps.debugger.debugger import debugger
from fastapi.middleware.cors import CORSMiddleware

main_app = MainApp([health, debugger])
app = main_app.app

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.staticfiles import StaticFiles

BUILD_DIR = os.path.join(os.path.dirname(__file__), "debugger_gui_build")

if os.path.isdir(BUILD_DIR):
    app.mount("/", StaticFiles(directory=BUILD_DIR, html=True), name="gui")


def start_server(port: int = 6969, open_browser: bool = False):
    if open_browser:
        import threading
        import webbrowser
        threading.Timer(1.0, lambda: webbrowser.open(f"http://localhost:{port}")).start()
    uvicorn.run("swarm_debug.server:app", host="0.0.0.0", port=port, reload=False)


def main():
    port = int(os.environ.get("BACKEND_PORT", 6969))
    start_server(port=port)


if __name__ == "__main__":
    main()
