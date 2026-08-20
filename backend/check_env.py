"""
Environment Configuration Checker
This script checks if required environment variables are properly configured.
"""
import os
from dotenv import load_dotenv

load_dotenv()

print("=" * 60)
print("Environment Configuration Check")
print("=" * 60)

# Check required variables
required_vars = {
    "DATABASE_URL": "PostgreSQL database connection string",
    "SECRET_KEY": "JWT secret key for authentication",
    "GOOGLE_API_KEY": "Google AI API key for Gemini integration",
}

optional_vars = {
    "GEMINI_MODEL": "Gemini model to use (default: gemini-2.5-flash)",
    "GEMINI_API_VERSION": "Gemini API version (default: v1)",
    "GEMINI_TIMEOUT_SECONDS": "Gemini API timeout in seconds (default: 60)",
}

print("\nRequired Variables:")
print("-" * 60)
all_required_set = True
for var, description in required_vars.items():
    value = os.getenv(var)
    if value:
        masked_value = value[:8] + "..." if len(value) > 8 else "***"
        print(f"✓ {var}: {masked_value} ({description})")
    else:
        print(f"✗ {var}: NOT SET ({description})")
        all_required_set = False

print("\nOptional Variables:")
print("-" * 60)
for var, description in optional_vars.items():
    value = os.getenv(var)
    if value:
        print(f"✓ {var}: {value} ({description})")
    else:
        print(f"○ {var}: Not set (using default) ({description})")

print("\n" + "=" * 60)
if all_required_set:
    print("✓ All required environment variables are configured!")
else:
    print("✗ Missing required environment variables!")
    print("\nTo fix this:")
    print("1. Copy backend/.env.example to backend/.env")
    print("2. Edit backend/.env and add your actual values")
    print("3. Get a Google API key from: https://makersuite.google.com/app/apikey")
print("=" * 60)
