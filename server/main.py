import os
import uuid
import time
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from server.config import settings
from server.routes import parse_router, logs_router, insights_router, health_router
from server.telemetry.structured_logger import log_event

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Personal Gemini Food Journal API",
    description="Enterprise-grade AI Food Journal backend powered by Gemini 3.7 Flash on Google Cloud Vertex AI",
    version="2.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Trace Context and Telemetry Middleware
@app.middleware("http")
async def trace_and_telemetry_middleware(request: Request, call_next):
    start_time = time.time()
    trace_header = request.headers.get("x-cloud-trace-context")
    if not trace_header:
        trace_id = str(uuid.uuid4()).replace("-", "")
    else:
        trace_id = trace_header.split("/")[0]

    response = await call_next(request)
    duration_ms = (time.time() - start_time) * 1000

    # Attach trace ID header
    response.headers["x-trace-id"] = trace_id

    # Emit telemetry for API requests
    if request.url.path.startswith("/api/"):
        log_event(
            event_type="API_REQUEST",
            severity="INFO",
            duration_ms=duration_ms,
            trace_id=trace_id,
            metadata={
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code
            }
        )

    return response

# Mount API Routers
app.include_router(health_router)
app.include_router(parse_router)
app.include_router(logs_router)
app.include_router(insights_router)

# Mount Frontend Static Assets if built
client_dist_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "client", "dist")
if os.path.exists(client_dist_path):
    app.mount("/assets", StaticFiles(directory=os.path.join(client_dist_path, "assets")), name="assets")

    @app.api_route("/", methods=["GET", "HEAD"])
    async def serve_root():
        return FileResponse(os.path.join(client_dist_path, "index.html"))

    @app.api_route("/{full_path:path}", methods=["GET", "HEAD"])
    async def serve_spa(full_path: str):
        if full_path.startswith("api/"):
            return {"error": "Not Found"}
        file_path = os.path.join(client_dist_path, full_path)
        if os.path.exists(file_path) and not os.path.isdir(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(client_dist_path, "index.html"))

if __name__ == "__main__":
    import uvicorn
    is_dev = settings.ENV == "development"
    uvicorn.run("server.main:app", host=settings.HOST, port=settings.PORT, reload=is_dev)
