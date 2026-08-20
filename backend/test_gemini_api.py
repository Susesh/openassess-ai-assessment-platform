"""
Test Gemini API Connection
This script tests if the Gemini API key is valid and working.
"""
import os
from dotenv import load_dotenv
from google import genai
from google.genai import types as genai_types

load_dotenv()

print("=" * 60)
print("Gemini API Connection Test")
print("=" * 60)

api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    print("✗ GOOGLE_API_KEY not found in environment")
    exit(1)

print(f"✓ API Key found: {api_key[:8]}...")

try:
    print("\nInitializing Gemini client...")
    client = genai.Client(
        api_key=api_key,
        http_options=genai_types.HttpOptions(
            api_version="v1",
            timeout=120.0,  # Increased timeout for SSL handshake
        ),
    )
    print("✓ Client initialized successfully")
    
    print("\nTesting simple text generation...")
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents="What is 2+2? Answer with just the number.",
        config=genai_types.GenerateContentConfig(temperature=0.2),
    )
    
    print(f"✓ API call successful!")
    print(f"Response: {response.text}")
    
    print("\n" + "=" * 60)
    print("✓ Gemini API is working correctly!")
    print("=" * 60)
    
except Exception as e:
    print(f"\n✗ API call failed: {str(e)}")
    print("\n" + "=" * 60)
    print("✗ Gemini API test failed")
    print("=" * 60)
    print("\nPossible issues:")
    print("1. Invalid API key")
    print("2. API key quota exceeded")
    print("3. Network connectivity issues")
    print("4. Gemini service unavailable")
    exit(1)
