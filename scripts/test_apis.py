"""
API Validation Script for GrantMatch Advisor
Tests all configured API keys to ensure they're working

Run with: python test_apis.py
"""

import sys
import requests
from config import config


def test_openai():
    """Test OpenAI API connection"""
    print("\n🧪 Testing OpenAI API...")
    
    if not config.OPENAI_API_KEY:
        print("   ⚠️  OPENAI_API_KEY not configured")
        return None
    
    try:
        import openai
        client = openai.OpenAI(api_key=config.OPENAI_API_KEY)
        
        # Simple test completion
        response = client.chat.completions.create(
            model=config.OPENAI_MODEL,
            messages=[{"role": "user", "content": "Say 'API test successful' in 3 words"}],
            max_tokens=10
        )
        
        result = response.choices[0].message.content
        print(f"   ✅ OpenAI API working! Response: {result}")
        print(f"   Model: {config.OPENAI_MODEL}")
        return True
        
    except Exception as e:
        print(f"   ❌ OpenAI API failed: {str(e)}")
        return False


def test_anthropic():
    """Test Anthropic API connection"""
    print("\n🧪 Testing Anthropic (Claude) API...")
    
    if not config.ANTHROPIC_API_KEY:
        print("   ⚠️  ANTHROPIC_API_KEY not configured")
        return None
    
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)
        
        # Simple test completion
        response = client.messages.create(
            model=config.ANTHROPIC_MODEL,
            max_tokens=10,
            messages=[{"role": "user", "content": "Say 'API test successful' in 3 words"}]
        )
        
        result = response.content[0].text
        print(f"   ✅ Anthropic API working! Response: {result}")
        print(f"   Model: {config.ANTHROPIC_MODEL}")
        return True
        
    except Exception as e:
        print(f"   ❌ Anthropic API failed: {str(e)}")
        return False


def test_grants_gov():
    """Test Grants.gov API (public endpoint)"""
    print("\n🧪 Testing Grants.gov API...")
    
    try:
        url = f"{config.GRANTS_GOV_BASE_URL}/search/"
        params = {"rows": 5}
        
        # Add API key if available
        headers = {}
        if config.GRANTS_GOV_API_KEY:
            headers["Authorization"] = f"Bearer {config.GRANTS_GOV_API_KEY}"
        
        response = requests.get(url, params=params, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            count = len(data.get("opportunityHits", []))
            print(f"   ✅ Grants.gov API working! Retrieved {count} grants")
            return True
        else:
            print(f"   ❌ Grants.gov API returned status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"   ❌ Grants.gov API failed: {str(e)}")
        return False


def test_simpler_grants():
    """Test Simpler.Grants.gov API"""
    print("\n🧪 Testing Simpler.Grants.gov API...")
    
    if not config.SIMPLER_GRANTS_API_KEY:
        print("   ⚠️  SIMPLER_GRANTS_API_KEY not configured (optional)")
        return None
    
    try:
        url = f"{config.SIMPLER_GRANTS_BASE_URL}/opportunities"
        headers = {"X-Api-Key": config.SIMPLER_GRANTS_API_KEY}
        params = {"limit": 5}
        
        response = requests.get(url, headers=headers, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            count = len(data.get("data", []))
            print(f"   ✅ Simpler.Grants.gov API working! Retrieved {count} grants")
            return True
        else:
            print(f"   ❌ Simpler.Grants.gov API returned status {response.status_code}")
            print(f"   Response: {response.text[:200]}")
            return False
            
    except Exception as e:
        print(f"   ❌ Simpler.Grants.gov API failed: {str(e)}")
        return False


def test_sendgrid():
    """Test SendGrid API"""
    print("\n🧪 Testing SendGrid API...")
    
    if not config.SENDGRID_API_KEY:
        print("   ⚠️  SENDGRID_API_KEY not configured (needed for email alerts)")
        return None
    
    try:
        # Just test API key validity, don't send actual email
        url = "https://api.sendgrid.com/v3/user/profile"
        headers = {"Authorization": f"Bearer {config.SENDGRID_API_KEY}"}
        
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ SendGrid API working! Account: {data.get('username', 'Unknown')}")
            return True
        else:
            print(f"   ❌ SendGrid API returned status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"   ❌ SendGrid API failed: {str(e)}")
        return False


def test_stripe():
    """Test Stripe API"""
    print("\n🧪 Testing Stripe API...")
    
    if not config.STRIPE_SECRET_KEY:
        print("   ⚠️  STRIPE_SECRET_KEY not configured (needed for payments)")
        return None
    
    try:
        import stripe
        stripe.api_key = config.STRIPE_SECRET_KEY
        
        # Test by retrieving account info
        account = stripe.Account.retrieve()
        
        mode = "TEST" if "test" in config.STRIPE_SECRET_KEY else "LIVE"
        print(f"   ✅ Stripe API working! Mode: {mode}")
        print(f"   Account ID: {account.id}")
        return True
        
    except Exception as e:
        print(f"   ❌ Stripe API failed: {str(e)}")
        return False


def test_usaspending():
    """Test USASpending.gov API (no key required)"""
    print("\n🧪 Testing USASpending.gov API...")
    
    try:
        url = f"{config.USASPENDING_BASE_URL}/references/agency/"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            count = len(data.get("results", []))
            print(f"   ✅ USASpending.gov API working! Found {count} agencies")
            return True
        else:
            print(f"   ❌ USASpending.gov API returned status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"   ❌ USASpending.gov API failed: {str(e)}")
        return False


def main():
    """Run all API tests"""
    print("="*60)
    print("  GrantMatch Advisor - API Validation")
    print("="*60)
    
    results = {
        "OpenAI": test_openai(),
        "Anthropic (Claude)": test_anthropic(),
        "Grants.gov": test_grants_gov(),
        "Simpler.Grants.gov": test_simpler_grants(),
        "SendGrid": test_sendgrid(),
        "Stripe": test_stripe(),
        "USASpending.gov": test_usaspending(),
    }
    
    # Summary
    print("\n" + "="*60)
    print("  Test Summary")
    print("="*60)
    
    passed = 0
    failed = 0
    skipped = 0
    
    for name, result in results.items():
        if result is True:
            status = "✅ PASS"
            passed += 1
        elif result is False:
            status = "❌ FAIL"
            failed += 1
        else:
            status = "⚠️  SKIP"
            skipped += 1
        
        print(f"{name:.<40} {status}")
    
    print("="*60)
    print(f"Passed: {passed} | Failed: {failed} | Skipped: {skipped}")
    print("="*60)
    
    # Exit with error if critical APIs failed
    openai_ok = results["OpenAI"] == True
    anthropic_ok = results["Anthropic (Claude)"] == True
    
    if not openai_ok and not anthropic_ok:
        print("\n❌ CRITICAL: At least one LLM API required (OpenAI or Anthropic)")
        print("   Configure OPENAI_API_KEY or ANTHROPIC_API_KEY")
        sys.exit(1)
    
    if openai_ok and anthropic_ok:
        print("\n✅ EXCELLENT: Both LLM providers configured (automatic fallback enabled)")
    elif openai_ok:
        print("\n✅ OpenAI configured. Consider adding ANTHROPIC_API_KEY as fallback.")
    elif anthropic_ok:
        print("\n✅ Anthropic configured. Consider adding OPENAI_API_KEY as fallback.")
    
    if not results["Grants.gov"] and results["Simpler.Grants.gov"] != True:
        print("\n⚠️  WARNING: No working grants API found. At least one is needed.")
        print("   Configure SIMPLER_GRANTS_API_KEY or use Grants.gov public endpoints")
    
    if failed > 1:  # Allow 1 failure for optional APIs
        print(f"\n⚠️  {failed} API(s) failed. Fix optional APIs when needed.")
    
    if passed >= 2:  # At least OpenAI + one grants API
        print("\n✅ Core APIs working! You're ready to start building.")
    
    print()


if __name__ == "__main__":
    main()

