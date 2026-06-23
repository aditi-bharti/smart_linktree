from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, WebSocket
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from app.routes import profiles, analytics, auth, admin
from app.websocket_manager import manager

app = FastAPI(
    title="Smart LinkTree",
    description="A smart linktree-like software with dynamic link highlighting",
    version="1.0.0"
)

# Get static directory
static_dir = os.path.join(os.path.dirname(__file__), "static")

# Include routers
app.include_router(auth.router)
app.include_router(profiles.router)
app.include_router(analytics.router)
app.include_router(admin.router)

# Mount static files
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")


@app.get("/")
async def root():
    """Redirect to Firebase auth page"""
    return FileResponse(os.path.join(static_dir, "auth-firebase.html"), media_type="text/html")


@app.get("/auth.html")
async def auth_page():
    """Serve auth page"""
    return FileResponse(os.path.join(static_dir, "auth.html"), media_type="text/html")


@app.get("/auth-firebase.html")
async def auth_firebase_page():
    """Serve Firebase auth page"""
    return FileResponse(os.path.join(static_dir, "auth-firebase.html"), media_type="text/html")


@app.get("/dashboard.html")
async def dashboard_page():
    """Serve dashboard page"""
    return FileResponse(os.path.join(static_dir, "dashboard.html"), media_type="text/html")


@app.get("/analytics.html")
async def analytics_page():
    """Serve analytics page"""
    return FileResponse(os.path.join(static_dir, "analytics.html"), media_type="text/html")


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy"}


@app.get("/{profile_id}")
async def profile_page(profile_id: str):
    """Serve profile page for any profile ID"""
    # Check if this is a special page
    if profile_id in ["api", "docs", "redoc", "openapi.json", "health", "auth.html", "auth-firebase.html", "dashboard.html", "analytics.html"]:
        return {"message": "Not found"}
    
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path, media_type="text/html")
    return {"message": "Welcome to Smart LinkTree API"}


@app.websocket("/ws/analytics/{profile_id}")
async def websocket_analytics(websocket: WebSocket, profile_id: str):
    """WebSocket endpoint for real-time analytics updates"""
    await manager.connect(websocket, profile_id)
    
    try:
        # Send initial data
        from app.engagement_tracker import get_profile_engagement
        import json
        initial_data = get_profile_engagement(profile_id)
        await websocket.send_text(json.dumps({"type": "initial", "data": initial_data}))
        
        # Keep connection alive and handle ping messages
        while True:
            try:
                message = await websocket.receive_text()
                if message == "ping":
                    await websocket.send_text("pong")
            except:
                break
                
    except Exception as e:
        print(f"WebSocket error for {profile_id}: {e}")
    finally:
        manager.disconnect(websocket, profile_id)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
