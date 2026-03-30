import logging
from backend.config.Apps import SubApp
from contextlib import asynccontextmanager
from fastapi.responses import PlainTextResponse
from typeguard import typechecked
from fastapi import status

log = logging.getLogger(__name__)

@asynccontextmanager
async def health_lifespan():
    log.debug("health_lifespan START")
    yield
    log.debug("health_lifespan END")

health = SubApp("health", health_lifespan)

######################################
# Health Check Endpoints #
######################################

@health.router.get("/check")
@typechecked
async def check() -> PlainTextResponse:
    log.info("Health check successful")
    return PlainTextResponse(
        content="OK", 
        status_code=status.HTTP_200_OK,
        headers={
            "Content-Type": "text/plain",
            "Content-Length": "2"
        }
    )
