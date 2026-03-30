import logging
import json
import os
from backend.config.Apps import SubApp
from backend.core.project_scanner import update_debug_toggles, dir_to_output_format
from contextlib import asynccontextmanager
from fastapi.responses import JSONResponse
from typeguard import typechecked

log = logging.getLogger(__name__)

NEEDS_RESYNC_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'needs_resync.txt')
DEBUG_TOGGLE_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'debug_toggles.json')


@asynccontextmanager
async def debugger_lifespan():
    log.debug("debugger_lifespan START")
    yield
    log.debug("debugger_lifespan END")


debugger = SubApp("debugger", debugger_lifespan)


@debugger.router.get("/pull_structure")
@typechecked
async def pull_structure() -> JSONResponse:
    log.info("GET /api/debugger/pull_structure")
    scanned_dir = update_debug_toggles(save_to_file=True)
    output = dir_to_output_format(scanned_dir)
    return JSONResponse(content=output)


@debugger.router.post("/push_structure")
@typechecked
async def push_structure(data: dict) -> JSONResponse:
    log.info("POST /api/debugger/push_structure")
    project_structure = data['projectStructure']
    with open(DEBUG_TOGGLE_FILE, 'w', encoding='utf-8') as file:
        json.dump(project_structure, file, indent=4)
    with open(NEEDS_RESYNC_FILE, 'w') as f:
        f.write('1')
    return JSONResponse(content={"status": "success"})


@debugger.router.post("/reset_color")
@typechecked
async def reset_color() -> JSONResponse:
    log.info("POST /api/debugger/reset_color")
    scanned_dir = update_debug_toggles(save_to_file=False)
    scanned_dir.reset_colors()
    output = dir_to_output_format(scanned_dir)
    return JSONResponse(content=output)


@debugger.router.post("/reset_emoji")
@typechecked
async def reset_emoji() -> JSONResponse:
    log.info("POST /api/debugger/reset_emoji")
    scanned_dir = update_debug_toggles(save_to_file=False)
    scanned_dir.reset_emojis()
    output = dir_to_output_format(scanned_dir)
    return JSONResponse(content=output)
