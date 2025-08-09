from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn

# Import all routers
from routers.auth_routes import router as auth_router
from routers.user_management_routes import router as user_router
from routers.product_routes import router as product_router
from routers.clinic_routes import router as clinic_router
from routers.order_routes import router as order_router
from routers.integrated_financial_router import api_router as financial_router
from routers.unified_financial_routes import router as unified_financial_router
from routers.enhanced_clinic_routes import router as enhanced_clinic_router
from routers.visit_management_routes import router as visit_management_router
from routers.dashboard_routes import router as dashboard_router

app = FastAPI(title="Medical Management System API", version="2.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(auth_router, prefix="/api", tags=["auth"])
app.include_router(user_router, prefix="/api", tags=["users"])
app.include_router(product_router, prefix="/api", tags=["products"])
app.include_router(clinic_router, prefix="/api", tags=["clinics"])
app.include_router(order_router, prefix="/api", tags=["orders"])
app.include_router(financial_router, tags=["financial"])
app.include_router(unified_financial_router, prefix="/api", tags=["unified-financial"])
app.include_router(enhanced_clinic_router, prefix="/api", tags=["enhanced-clinics"])
app.include_router(visit_management_router, prefix="/api", tags=["visits"])
app.include_router(dashboard_router, tags=["dashboard"])

@app.get("/")
async def root():
    return {"message": "Medical Management System API - نظام الإدارة الطبية"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "النظام يعمل بشكل طبيعي"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)