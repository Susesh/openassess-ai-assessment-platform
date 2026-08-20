#!/usr/bin/env python3
"""
OpenAssess Backend & Frontend Startup Verification Script
Tests both backend and frontend readiness
"""

import subprocess
import sys
from pathlib import Path

def run_command(cmd, description):
    """Run command and report result"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            print(f"✓ {description}")
            return True
        else:
            print(f"✗ {description}")
            if result.stderr:
                print(f"  Error: {result.stderr[:100]}")
            return False
    except subprocess.TimeoutExpired:
        print(f"✗ {description} (Timeout)")
        return False
    except Exception as e:
        print(f"✗ {description} (Error: {str(e)[:50]})")
        return False

def main():
    print("=" * 60)
    print("OpenAssess Backend & Frontend Verification")
    print("=" * 60)
    print()
    
    # Backend checks
    print("BACKEND CHECKS:")
    print("-" * 60)
    
    checks = [
        ("python -c \"from backend.main import app; print('OK')\"", 
         "Backend imports successfully"),
        ("python backend/database.py | findstr \"successfully\"",
         "Database connection works"),
        ("pip show fastapi | findstr Name",
         "FastAPI installed"),
        ("pip show uvicorn | findstr Name",
         "Uvicorn installed"),
        ("pip show sqlalchemy | findstr Name",
         "SQLAlchemy installed"),
    ]
    
    backend_ok = True
    for cmd, desc in checks:
        if not run_command(cmd, desc):
            backend_ok = False
    
    print()
    print("FRONTEND CHECKS:")
    print("-" * 60)
    
    checks = [
        ("npm --version", "npm is installed"),
        ("cd frontend && npm list next | findstr next",
         "Next.js installed"),
        ("cd frontend && npm list react | findstr react",
         "React installed"),
        ("powershell Test-Path 'frontend/.env.local'",
         "Frontend .env.local configured"),
    ]
    
    frontend_ok = True
    for cmd, desc in checks:
        if not run_command(cmd, desc):
            frontend_ok = False
    
    print()
    print("=" * 60)
    print("SUMMARY:")
    print("-" * 60)
    
    if backend_ok:
        print("✓ Backend is ready to run")
    else:
        print("✗ Backend has issues")
    
    if frontend_ok:
        print("✓ Frontend is ready to run")
    else:
        print("✗ Frontend has issues")
    
    print()
    if backend_ok and frontend_ok:
        print("READY TO START:")
        print("-" * 60)
        print("Terminal 1: cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000")
        print("Terminal 2: cd frontend && npm run dev")
        print()
        print("Then open: http://localhost:3000")
        return 0
    else:
        print("Please fix the issues above before starting")
        return 1

if __name__ == "__main__":
    sys.exit(main())
