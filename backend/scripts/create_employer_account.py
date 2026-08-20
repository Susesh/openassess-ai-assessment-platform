#!/usr/bin/env python3
"""Script to create an employer test account in the database."""

import sys
from pathlib import Path

# Add parent directory to path for imports
_root = Path(__file__).resolve().parent.parent.parent
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

from sqlalchemy.orm import Session
from backend.database import SessionLocal, engine
from backend.models.user import User
from backend.utils.auth_utils import hash_password


def create_employer_account():
    """Create an employer test account."""
    db = SessionLocal()
    
    try:
        # Check if employer account already exists
        existing_employer = db.query(User).filter(User.email == "employer@test.com").first()
        if existing_employer:
            print("Employer account already exists: employer@test.com")
            print("Updating role to 'employer'...")
            existing_employer.role = "employer"
            db.commit()
            print("✓ Account updated successfully")
            return
        
        # Create new employer account
        employer = User(
            full_name="Test Employer",
            email="employer@test.com",
            hashed_password=hash_password("employer123"),
            role="employer",
            is_active=True
        )
        
        db.add(employer)
        db.commit()
        db.refresh(employer)
        
        print("✓ Employer account created successfully")
        print(f"  Email: employer@test.com")
        print(f"  Password: employer123")
        print(f"  Role: {employer.role}")
        print(f"  User ID: {employer.id}")
        
    except Exception as e:
        print(f"✗ Error creating employer account: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    create_employer_account()
