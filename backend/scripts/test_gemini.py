"""
Test script to verify Gemini API connectivity and basic functionality.
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.services.gemini_service import generate_text

def test_gemini():
    """Test basic Gemini API functionality."""
    print("Testing Gemini API connectivity...")
    print("=" * 50)
    
    try:
        # Simple test prompt
        test_prompt = "Respond with 'Hello World' in JSON format: {\"response\": \"Hello World\"}"
        print(f"Sending test prompt: {test_prompt}")
        
        response = generate_text(test_prompt)
        print(f"✓ Gemini API response: {response}")
        print("✓ Gemini API is working correctly")
        return True
        
    except Exception as e:
        print(f"✗ Gemini API test failed: {e}")
        return False

if __name__ == "__main__":
    success = test_gemini()
    sys.exit(0 if success else 1)
