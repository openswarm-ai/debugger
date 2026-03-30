import logging
import os

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

from backend.config.Apps import MainApp
from backend.apps.health.health import health
from backend.apps.debugger.debugger import debugger
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


def main():
    import uvicorn
    port = int(os.environ.get("BACKEND_PORT", 8324))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=True)


if __name__ == "__main__":
    main()
