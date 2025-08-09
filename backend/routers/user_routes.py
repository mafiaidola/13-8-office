#!/usr/bin/env python3
"""
User management routes for Medical Management System
"""

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorClient
import os
import jwt
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import uuid
import hashlib

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
router = APIRouter(prefix="/api", tags=["users"])

# User model
class User(BaseModel):
    id: str
    username: str
    full_name: str
    role: str
    email: Optional[str] = None
    is_active: bool = True

# User creation model
class CreateUserRequest(BaseModel):
    username: str
    full_name: str
    password: str
    role: str
    email: Optional[str] = None
    line_id: Optional[str] = None
    area_id: Optional[str] = None
    manager_id: Optional[str] = None

def hash_password(password: str) -> str:
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_jwt_token(token: str) -> dict:
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Get current user from JWT token"""
    try:
        # Extract token from Bearer
        token = credentials.credentials
        payload = verify_jwt_token(token)
        
        # Get user from database
        user_data = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0, "password_hash": 0, "password": 0})
        if not user_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        return User(**user_data)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}"
        )

# User routes
@router.get("/users", response_model=List[Dict[str, Any]])
async def get_users(current_user: User = Depends(get_current_user)):
    """
    Get all users (Admin and GM only)
    Other roles have limited access
    """
    try:
        # Role-based access control
        if current_user.role in ["medical_rep", "sales_rep"]:
            # Sales reps can only see themselves
            user_data = await db.users.find_one({"id": current_user.id}, {"_id": 0, "password_hash": 0})
            if user_data:
                return [user_data]
            return []
        
        # Admin and GM can see all users
        if current_user.role in ["admin", "gm"]:
            users = []
            async for user in db.users.find({}, {"_id": 0, "password_hash": 0, "password": 0}):
                users.append(user)
            return users
        
        # Other roles have limited access based on hierarchy
        users = []
        if current_user.role in ["manager", "line_manager", "area_manager"]:
            # Managers can see their team members
            async for user in db.users.find(
                {"manager_id": current_user.id}, 
                {"_id": 0, "password_hash": 0, "password": 0}
            ):
                users.append(user)
        
        return users
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving users: {str(e)}"
        )

@router.post("/users", response_model=Dict[str, Any])
async def create_user(
    user_request: CreateUserRequest,
    current_user: User = Depends(get_current_user)
):
    """Create a new user (Admin only)"""
    try:
        # Only admin can create users
        if current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only administrators can create users"
            )
        
        # Check if username already exists
        existing_user = await db.users.find_one({"username": user_request.username})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already exists"
            )
        
        # Create new user
        user_id = str(uuid.uuid4())
        user_data = {
            "id": user_id,
            "username": user_request.username,
            "full_name": user_request.full_name,
            "password_hash": hash_password(user_request.password),
            "role": user_request.role,
            "email": user_request.email,
            "line_id": user_request.line_id,
            "area_id": user_request.area_id,
            "manager_id": user_request.manager_id,
            "is_active": True,
            "created_at": datetime.utcnow().isoformat(),
            "created_by": current_user.id
        }
        
        # Insert user into database
        result = await db.users.insert_one(user_data)
        
        # Return user data without password
        user_data.pop("password_hash")
        user_data["message"] = "User created successfully"
        
        return user_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating user: {str(e)}"
        )

@router.get("/users/{user_id}", response_model=Dict[str, Any])
async def get_user_by_id(
    user_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get user by ID"""
    try:
        # Users can view their own profile
        # Admins and managers can view their team members
        if user_id != current_user.id and current_user.role not in ["admin", "gm", "manager", "line_manager", "area_manager"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to view this user"
            )
        
        user_data = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0, "password": 0})
        if not user_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return user_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving user: {str(e)}"
        )

@router.put("/users/{user_id}", response_model=Dict[str, Any])
async def update_user(
    user_id: str,
    user_request: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Update user (Admin only or own profile)"""
    try:
        # Users can update their own profile (limited fields)
        # Admins can update any user
        if user_id != current_user.id and current_user.role not in ["admin", "gm"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to update this user"
            )
        
        # Check if user exists
        existing_user = await db.users.find_one({"id": user_id})
        if not existing_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Prepare update data
        update_data = {}
        allowed_fields = ["full_name", "email", "line_id", "area_id", "manager_id"]
        
        # Admin can update additional fields
        if current_user.role in ["admin", "gm"]:
            allowed_fields.extend(["role", "is_active"])
        
        # Handle password update
        if "password" in user_request:
            update_data["password_hash"] = hash_password(user_request["password"])
        
        # Update allowed fields
        for field in allowed_fields:
            if field in user_request:
                update_data[field] = user_request[field]
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid fields to update"
            )
        
        update_data["updated_at"] = datetime.utcnow().isoformat()
        update_data["updated_by"] = current_user.id
        
        # Update user
        result = await db.users.update_one(
            {"id": user_id},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No changes made to user"
            )
        
        # Return updated user data
        updated_user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0, "password": 0})
        updated_user["message"] = "User updated successfully"
        
        return updated_user
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating user: {str(e)}"
        )

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete user (Admin only)"""
    try:
        # Only admin can delete users
        if current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only administrators can delete users"
            )
        
        # Prevent self-deletion
        if user_id == current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete your own account"
            )
        
        # Check if user exists
        existing_user = await db.users.find_one({"id": user_id})
        if not existing_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Delete user
        result = await db.users.delete_one({"id": user_id})
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to delete user"
            )
        
        return {"message": "User deleted successfully", "deleted_user_id": user_id}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting user: {str(e)}"
        )