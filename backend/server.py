from fastapi import FastAPI, APIRouter, HTTPException, Query, Path, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import re
import requests
from passlib.context import CryptContext
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(
    title="SHAO MACAO",
    description="Global mutual cash transaction matching platform",
    version="1.0.0"
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Secret
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-here')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Currency Service
class CurrencyService:
    def __init__(self):
        self.cache = {}
        self.cache_duration = timedelta(hours=1)
    
    def get_exchange_rates(self, base_currency: str = 'USD') -> Dict:
        cache_key = f"{base_currency}_{datetime.now().strftime('%Y%m%d%H')}"
        
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        try:
            # Using free ExchangeRate-API
            url = f"https://api.exchangerate-api.com/v4/latest/{base_currency}"
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            if 'rates' in data:
                self.cache[cache_key] = data
                return data
            else:
                raise ValueError("Invalid API response format")
                
        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to fetch exchange rates: {str(e)}")

currency_service = CurrencyService()

# Data Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    first_name: str
    last_name: str
    email: str
    phone: str
    country: str
    city: str
    date_of_birth: datetime
    business_card_number: str = Field(default="")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True
    likes_count: int = 0
    is_trusted: bool = False

class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: str
    country: str
    city: str
    date_of_birth: datetime
    password: str
    
    @validator('email')
    def validate_email(cls, v):
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', v):
            raise ValueError('Invalid email format')
        return v.lower()
    
    @validator('phone')
    def validate_phone(cls, v):
        if not re.match(r'^\+?[1-9]\d{6,14}$', v):
            raise ValueError('Invalid phone number format')
        return v
    
    @validator('date_of_birth')
    def validate_age(cls, v):
        today = datetime.now()
        age = today.year - v.year - ((today.month, today.day) < (v.month, v.day))
        if age < 21:
            raise ValueError('Must be at least 21 years old')
        return v

class UserLogin(BaseModel):
    email: str
    password: str

class Application(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_city: str  # Where user is located
    target_city: str  # Where user is looking for counterparty
    amount: float
    currency: str = "USD"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime = Field(default_factory=lambda: datetime.utcnow() + timedelta(days=14))
    is_active: bool = True
    
class ApplicationCreate(BaseModel):
    target_city: str
    amount: float
    currency: str = "USD"
    
    @validator('amount')
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Amount must be positive')
        if v > 6000:
            raise ValueError('Amount cannot exceed $6,000')
        return round(v, 2)

class Comment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    target_user_id: str  # User being commented on
    commenter_id: str    # User making the comment
    commenter_name: str
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CommentCreate(BaseModel):
    target_user_id: str
    content: str

class Like(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    target_user_id: str  # User being liked
    liker_id: str        # User giving the like
    created_at: datetime = Field(default_factory=datetime.utcnow)

# World cities data (major cities with 1M+ population + capitals)
WORLD_CITIES = [
    # Major cities alphabetically
    "Addis Ababa", "Adelaide", "Ahmedabad", "Alexandria", "Algiers", "Almaty",
    "Amsterdam", "Ankara", "Athens", "Atlanta", "Auckland", "Baghdad", "Baku",
    "Bangkok", "Barcelona", "Beijing", "Belgrade", "Berlin", "Birmingham", 
    "Bogotá", "Boston", "Brisbane", "Brussels", "Bucharest", "Budapest",
    "Buenos Aires", "Cairo", "Calgary", "Cape Town", "Caracas", "Casablanca",
    "Chennai", "Chicago", "Cologne", "Copenhagen", "Dallas", "Damascus", "Delhi",
    "Detroit", "Dhaka", "Dubai", "Dublin", "Düsseldorf", "Edinburgh", "Frankfurt",
    "Geneva", "Glasgow", "Guadalajara", "Hamburg", "Helsinki", "Ho Chi Minh City",
    "Hong Kong", "Houston", "Istanbul", "Jakarta", "Johannesburg", "Karachi",
    "Kiev", "Kuala Lumpur", "Lagos", "Lahore", "Lima", "Lisbon", "London",
    "Los Angeles", "Lyon", "Madrid", "Manchester", "Manila", "Melbourne",
    "Mexico City", "Miami", "Milan", "Minneapolis", "Montreal", "Moscow",
    "Mumbai", "Munich", "Nairobi", "New York", "Oslo", "Paris", "Perth",
    "Philadelphia", "Phoenix", "Prague", "Riyadh", "Rome", "San Francisco",
    "Santiago", "São Paulo", "Seoul", "Shanghai", "Singapore", "Stockholm",
    "Sydney", "Taipei", "Tehran", "Tel Aviv", "Tokyo", "Toronto", "Vancouver",
    "Vienna", "Warsaw", "Washington", "Zurich"
]

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def generate_business_card_number(country: str, phone: str) -> str:
    # Country codes mapping (simplified)
    country_codes = {
        "USA": "1", "Canada": "1", "Russia": "7", "Kazakhstan": "7",
        "Egypt": "20", "South Africa": "27", "Greece": "30", "Netherlands": "31",
        "Belgium": "32", "France": "33", "Spain": "34", "Hungary": "36",
        "Italy": "39", "Romania": "40", "Switzerland": "41", "Austria": "43",
        "United Kingdom": "44", "Denmark": "45", "Sweden": "46", "Norway": "47",
        "Poland": "48", "Germany": "49", "Peru": "51", "Mexico": "52",
        "Cuba": "53", "Argentina": "54", "Brazil": "55", "Chile": "56",
        "Colombia": "57", "Venezuela": "58", "Malaysia": "60", "Australia": "61",
        "Indonesia": "62", "Philippines": "63", "New Zealand": "64", "Singapore": "65",
        "Thailand": "66", "Japan": "81", "South Korea": "82", "Vietnam": "84",
        "China": "86", "Turkey": "90", "India": "91", "Pakistan": "92",
        "Afghanistan": "93", "Myanmar": "95", "Iran": "98"
    }
    
    country_code = country_codes.get(country, "000")
    # Get last 3 digits of phone number
    phone_digits = re.sub(r'\D', '', phone)[-3:]
    return f"0000{country_code}{phone_digits}"

async def get_current_user(token: str = None):
    if not token:
        return None
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            return None
        user = await db.users.find_one({"id": user_id})
        return User(**user) if user else None
    except jwt.PyJWTError:
        return None

# Routes
@api_router.get("/")
async def root():
    return {
        "message": "Welcome to SHAO MACAO",
        "description": "Global mutual cash transaction matching platform",
        "version": "1.0.0"
    }

@api_router.get("/cities")
async def get_cities():
    """Get list of supported cities"""
    return {"cities": sorted(WORLD_CITIES)}

@api_router.post("/register")
async def register_user(user_data: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = hash_password(user_data.password)
    
    # Create user
    user_dict = user_data.dict()
    del user_dict['password']
    
    user = User(**user_dict)
    user.business_card_number = generate_business_card_number(user.country, user.phone)
    
    # Save to database
    await db.users.insert_one(user.dict())
    await db.user_passwords.insert_one({"user_id": user.id, "password_hash": hashed_password})
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    
    return {
        "message": "User registered successfully",
        "user": user,
        "access_token": access_token,
        "token_type": "bearer"
    }

@api_router.post("/login")
async def login_user(login_data: UserLogin):
    # Find user
    user = await db.users.find_one({"email": login_data.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check password
    password_record = await db.user_passwords.find_one({"user_id": user["id"]})
    if not password_record or not verify_password(login_data.password, password_record["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create access token
    access_token = create_access_token(data={"sub": user["id"]})
    
    return {
        "message": "Login successful",
        "user": User(**user),
        "access_token": access_token,
        "token_type": "bearer"
    }

@api_router.post("/applications")
async def create_application(app_data: ApplicationCreate, token: str = Query(...)):
    current_user = await get_current_user(token)
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    application = Application(
        user_id=current_user.id,
        user_city=current_user.city,
        target_city=app_data.target_city,
        amount=app_data.amount,
        currency=app_data.currency
    )
    
    await db.applications.insert_one(application.dict())
    
    return {
        "message": "Application created successfully",
        "application": application
    }

@api_router.get("/applications/search")
async def search_applications(
    target_city: str = Query(..., description="City where you're looking for counterparty"),
    token: str = Query(..., description="Authentication token")
):
    current_user = await get_current_user(token)
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    # Find applications where:
    # - User is from target_city (reverse match)
    # - Looking for counterparty in current user's city
    # - Application is still active and not expired
    
    now = datetime.utcnow()
    
    applications = await db.applications.find({
        "user_city": target_city,
        "target_city": current_user.city,
        "is_active": True,
        "expires_at": {"$gt": now},
        "user_id": {"$ne": current_user.id}  # Don't show own applications
    }).to_list(100)
    
    # Get user details for each application
    result = []
    for app in applications:
        user = await db.users.find_one({"id": app["user_id"]})
        if user:
            days_active = (now - app["created_at"]).days
            app_with_user = {
                **app,
                "user": User(**user),
                "days_active": days_active,
                "status": "Active" if app["expires_at"] > now else "Expired"
            }
            result.append(app_with_user)
    
    return {"applications": result}

@api_router.get("/user/{user_id}")
async def get_user_profile(user_id: str, token: str = Query(...)):
    current_user = await get_current_user(token)
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    # Get user details
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_obj = User(**user)
    
    # Get comments for this user
    comments = await db.comments.find({"target_user_id": user_id}).to_list(100)
    
    # Get likes count
    likes_count = await db.likes.count_documents({"target_user_id": user_id})
    
    # Check if current user has already liked this user
    has_liked = await db.likes.find_one({"target_user_id": user_id, "liker_id": current_user.id}) is not None
    
    # Update trusted status if needed
    if likes_count >= 4 and not user_obj.is_trusted:
        await db.users.update_one({"id": user_id}, {"$set": {"is_trusted": True, "likes_count": likes_count}})
        user_obj.is_trusted = True
    
    user_obj.likes_count = likes_count
    
    return {
        "user": user_obj,
        "comments": comments,
        "likes_count": likes_count,
        "has_liked": has_liked
    }

@api_router.post("/comments")
async def create_comment(comment_data: CommentCreate, token: str = Query(...)):
    current_user = await get_current_user(token)
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    comment = Comment(
        target_user_id=comment_data.target_user_id,
        commenter_id=current_user.id,
        commenter_name=f"{current_user.first_name} {current_user.last_name}",
        content=comment_data.content
    )
    
    await db.comments.insert_one(comment.dict())
    
    return {
        "message": "Comment added successfully",
        "comment": comment
    }

@api_router.post("/likes/{user_id}")
async def toggle_like(user_id: str, token: str = Query(...)):
    current_user = await get_current_user(token)
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot like yourself")
    
    # Check if already liked
    existing_like = await db.likes.find_one({"target_user_id": user_id, "liker_id": current_user.id})
    
    if existing_like:
        # Remove like
        await db.likes.delete_one({"target_user_id": user_id, "liker_id": current_user.id})
        message = "Like removed"
    else:
        # Add like
        like = Like(target_user_id=user_id, liker_id=current_user.id)
        await db.likes.insert_one(like.dict())
        message = "Like added"
    
    # Update likes count and trusted status
    likes_count = await db.likes.count_documents({"target_user_id": user_id})
    is_trusted = likes_count >= 4
    
    await db.users.update_one(
        {"id": user_id}, 
        {"$set": {"likes_count": likes_count, "is_trusted": is_trusted}}
    )
    
    return {
        "message": message,
        "likes_count": likes_count,
        "is_trusted": is_trusted
    }

@api_router.get("/currency/rates/{base_currency}")
async def get_currency_rates(base_currency: str = "USD"):
    """Get current exchange rates"""
    try:
        rates_data = currency_service.get_exchange_rates(base_currency.upper())
        return {
            "base_currency": base_currency.upper(),
            "rates": rates_data.get("rates", {}),
            "last_updated": rates_data.get("date", "Unknown")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/my/applications")
async def get_my_applications(token: str = Query(...)):
    current_user = await get_current_user(token)
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    applications = await db.applications.find({"user_id": current_user.id}, {"_id": 0}).to_list(100)
    
    now = datetime.utcnow()
    result = []
    for app in applications:
        days_active = (now - app["created_at"]).days
        status = "Active" if app["expires_at"] > now and app["is_active"] else "Expired"
        app_with_status = {
            **app,
            "days_active": days_active,
            "status": status
        }
        result.append(app_with_status)
    
    return {"applications": result}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()