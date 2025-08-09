#!/usr/bin/env python3
"""
Lines and Areas management routes for Medical Management System
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorClient
import os
import jwt
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import uuid

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'test_database')]

# JWT Configuration  
JWT_SECRET_KEY = "your-secret-key-change-in-production"
JWT_ALGORITHM = "HS256"

# Security
security = HTTPBearer()

# Create router
router = APIRouter(prefix="/api", tags=["lines-areas"])

# Models
class Line(BaseModel):
    id: str
    name: str
    code: str
    description: Optional[str] = None
    manager_id: Optional[str] = None
    manager_name: Optional[str] = None
    is_active: bool = True

class Area(BaseModel):
    id: str
    name: str
    code: str
    description: Optional[str] = None
    parent_line_id: str
    manager_id: Optional[str] = None
    is_active: bool = True

def verify_jwt_token(token: str) -> dict:
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user from JWT token"""
    try:
        token = credentials.credentials
        payload = verify_jwt_token(token)
        return payload
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

# Sample data creation function
async def ensure_sample_data():
    """Create sample lines and areas if they don't exist"""
    
    # Check if we have lines data
    lines_count = await db.lines.count_documents({})
    if lines_count == 0:
        # Create sample lines
        sample_lines = [
            {
                "id": "line-cairo-north",
                "name": "خط القاهرة الشمالية",
                "code": "CN",
                "description": "يغطي المناطق الشمالية للقاهرة والجيزة",
                "manager_id": None,
                "manager_name": "محمد أحمد",
                "is_active": True,
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": "line-alexandria",
                "name": "خط الإسكندرية",
                "code": "ALX",
                "description": "يغطي محافظة الإسكندرية والمناطق المجاورة",
                "manager_id": None,
                "manager_name": "سمير عبد الله",
                "is_active": True,
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": "line-upper-egypt",
                "name": "خط صعيد مصر",
                "code": "UE",
                "description": "يغطي محافظات الصعيد من أسيوط إلى أسوان",
                "manager_id": None,
                "manager_name": "أحمد محمود",
                "is_active": True,
                "created_at": datetime.utcnow().isoformat()
            }
        ]
        
        await db.lines.insert_many(sample_lines)
        print("✅ تم إنشاء بيانات الخطوط النموذجية")

    # Check if we have areas data
    areas_count = await db.areas.count_documents({})
    if areas_count == 0:
        # Create sample areas
        sample_areas = [
            {
                "id": "area-nasr-city",
                "name": "مدينة نصر",
                "code": "NC",
                "description": "منطقة مدينة نصر والتجمع الأول",
                "parent_line_id": "line-cairo-north",
                "manager_id": None,
                "is_active": True,
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": "area-heliopolis",
                "name": "مصر الجديدة",
                "code": "HE",
                "description": "منطقة مصر الجديدة وروكسي",
                "parent_line_id": "line-cairo-north",
                "manager_id": None,
                "is_active": True,
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": "area-moharam-bek",
                "name": "محرم بك",
                "code": "MB",
                "description": "منطقة محرم بك ووسط الإسكندرية",
                "parent_line_id": "line-alexandria",
                "manager_id": None,
                "is_active": True,
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": "area-miami",
                "name": "ميامي",
                "code": "MI",
                "description": "منطقة ميامي وسيدي بشر",
                "parent_line_id": "line-alexandria",
                "manager_id": None,
                "is_active": True,
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": "area-assiut",
                "name": "أسيوط",
                "code": "AS",
                "description": "مدينة أسيوط والقرى المجاورة",
                "parent_line_id": "line-upper-egypt",
                "manager_id": None,
                "is_active": True,
                "created_at": datetime.utcnow().isoformat()
            }
        ]
        
        await db.areas.insert_many(sample_areas)
        print("✅ تم إنشاء بيانات المناطق النموذجية")

# Routes

@router.get("/lines", response_model=List[Dict[str, Any]])
async def get_lines(current_user: dict = Depends(get_current_user)):
    """Get all active lines"""
    try:
        # Ensure sample data exists
        await ensure_sample_data()
        
        lines = []
        async for line in db.lines.find({"is_active": True}, {"_id": 0}):
            lines.append(line)
        
        return lines
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving lines: {str(e)}")

@router.get("/areas", response_model=List[Dict[str, Any]])
async def get_areas(current_user: dict = Depends(get_current_user)):
    """Get all active areas"""
    try:
        # Ensure sample data exists
        await ensure_sample_data()
        
        areas = []
        async for area in db.areas.find({"is_active": True}, {"_id": 0}):
            areas.append(area)
        
        return areas
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving areas: {str(e)}")

@router.get("/lines/{line_id}/areas", response_model=List[Dict[str, Any]])
async def get_areas_by_line(line_id: str, current_user: dict = Depends(get_current_user)):
    """Get all areas for a specific line"""
    try:
        areas = []
        async for area in db.areas.find(
            {"parent_line_id": line_id, "is_active": True}, 
            {"_id": 0}
        ):
            areas.append(area)
        
        return areas
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving areas for line: {str(e)}")

@router.post("/lines", response_model=Dict[str, Any])
async def create_line(line_data: Dict[str, Any], current_user: dict = Depends(get_current_user)):
    """Create a new line (Admin only)"""
    try:
        # Only admin can create lines
        if current_user.get("role") not in ["admin", "gm"]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        line_id = str(uuid.uuid4())
        new_line = {
            "id": line_id,
            "name": line_data.get("name"),
            "code": line_data.get("code"),
            "description": line_data.get("description", ""),
            "manager_id": line_data.get("manager_id"),
            "manager_name": line_data.get("manager_name"),
            "is_active": True,
            "created_at": datetime.utcnow().isoformat(),
            "created_by": current_user.get("user_id")
        }
        
        await db.lines.insert_one(new_line)
        
        # Return without MongoDB _id
        new_line.pop("_id", None)
        new_line["message"] = "Line created successfully"
        
        return new_line
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating line: {str(e)}")

@router.post("/areas", response_model=Dict[str, Any])
async def create_area(area_data: Dict[str, Any], current_user: dict = Depends(get_current_user)):
    """Create a new area (Admin only)"""
    try:
        # Only admin can create areas
        if current_user.get("role") not in ["admin", "gm"]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        area_id = str(uuid.uuid4())
        new_area = {
            "id": area_id,
            "name": area_data.get("name"),
            "code": area_data.get("code"),
            "description": area_data.get("description", ""),
            "parent_line_id": area_data.get("parent_line_id"),
            "manager_id": area_data.get("manager_id"),
            "is_active": True,
            "created_at": datetime.utcnow().isoformat(),
            "created_by": current_user.get("user_id")
        }
        
        await db.areas.insert_one(new_area)
        
        # Return without MongoDB _id
        new_area.pop("_id", None)
        new_area["message"] = "Area created successfully"
        
        return new_area
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating area: {str(e)}")

@router.put("/lines/{line_id}", response_model=Dict[str, Any])
async def update_line(line_id: str, line_data: Dict[str, Any], current_user: dict = Depends(get_current_user)):
    """Update a line (Admin only)"""
    try:
        # Only admin can update lines
        if current_user.get("role") not in ["admin", "gm"]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        # Check if line exists
        existing_line = await db.lines.find_one({"id": line_id})
        if not existing_line:
            raise HTTPException(status_code=404, detail="Line not found")
        
        # Update data
        update_data = {
            "name": line_data.get("name", existing_line["name"]),
            "code": line_data.get("code", existing_line["code"]),
            "description": line_data.get("description", existing_line.get("description", "")),
            "manager_id": line_data.get("manager_id", existing_line.get("manager_id")),
            "manager_name": line_data.get("manager_name", existing_line.get("manager_name")),
            "is_active": line_data.get("is_active", existing_line.get("is_active", True)),
            "updated_at": datetime.utcnow().isoformat(),
            "updated_by": current_user.get("user_id")
        }
        
        await db.lines.update_one({"id": line_id}, {"$set": update_data})
        
        # Return updated line
        updated_line = await db.lines.find_one({"id": line_id}, {"_id": 0})
        updated_line["message"] = "Line updated successfully"
        
        return updated_line
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating line: {str(e)}")

@router.put("/areas/{area_id}", response_model=Dict[str, Any])
async def update_area(area_id: str, area_data: Dict[str, Any], current_user: dict = Depends(get_current_user)):
    """Update an area (Admin only)"""
    try:
        # Only admin can update areas
        if current_user.get("role") not in ["admin", "gm"]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        # Check if area exists
        existing_area = await db.areas.find_one({"id": area_id})
        if not existing_area:
            raise HTTPException(status_code=404, detail="Area not found")
        
        # Update data
        update_data = {
            "name": area_data.get("name", existing_area["name"]),
            "code": area_data.get("code", existing_area["code"]),
            "description": area_data.get("description", existing_area.get("description", "")),
            "parent_line_id": area_data.get("parent_line_id", existing_area["parent_line_id"]),
            "manager_id": area_data.get("manager_id", existing_area.get("manager_id")),
            "is_active": area_data.get("is_active", existing_area.get("is_active", True)),
            "updated_at": datetime.utcnow().isoformat(),
            "updated_by": current_user.get("user_id")
        }
        
        await db.areas.update_one({"id": area_id}, {"$set": update_data})
        
        # Return updated area
        updated_area = await db.areas.find_one({"id": area_id}, {"_id": 0})
        updated_area["message"] = "Area updated successfully"
        
        return updated_area
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating area: {str(e)}")