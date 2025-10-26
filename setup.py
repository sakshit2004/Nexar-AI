#!/usr/bin/env python3
"""
Quick Setup Script for GrantMatch Advisor
Helps you get started with environment configuration
"""

import os
import shutil
from pathlib import Path


def print_header(text):
    """Print a formatted header"""
    print("\n" + "="*60)
    print(f"  {text}")
    print("="*60)


def check_python_version():
    """Check if Python version is 3.11+"""
    import sys
    version = sys.version_info
    
    print(f"\nPython Version: {version.major}.{version.minor}.{version.micro}")
    
    if version.major < 3 or (version.major == 3 and version.minor < 11):
        print("❌ Python 3.11 or higher is required!")
        print("   Download from: https://www.python.org/downloads/")
        return False
    else:
        print("✅ Python version OK")
        return True


def setup_env_file():
    """Copy env.example to .env if it doesn't exist"""
    print_header("Environment Configuration")
    
    env_file = Path(".env")
    env_example = Path("env.example")
    
    if env_file.exists():
        print("\n✅ .env file already exists")
        response = input("   Overwrite with fresh template? (y/N): ").strip().lower()
        if response != 'y':
            print("   Keeping existing .env file")
            return True
    
    if not env_example.exists():
        print("\n❌ env.example file not found!")
        print("   Make sure you're in the project root directory")
        return False
    
    try:
        shutil.copy(env_example, env_file)
        print("\n✅ Created .env file from template")
        return True
    except Exception as e:
        print(f"\n❌ Failed to create .env file: {e}")
        return False


def check_virtualenv():
    """Check if we're in a virtual environment"""
    print_header("Virtual Environment")
    
    in_venv = hasattr(os.sys, 'real_prefix') or (
        hasattr(os.sys, 'base_prefix') and os.sys.base_prefix != os.sys.prefix
    )
    
    if in_venv:
        print("\n✅ Virtual environment is active")
        return True
    else:
        print("\n⚠️  No virtual environment detected")
        print("\nRecommended: Create and activate a virtual environment:")
        print("   python -m venv venv")
        print("   source venv/bin/activate  # On Windows: venv\\Scripts\\activate")
        print("\nContinue anyway? (y/N): ", end="")
        response = input().strip().lower()
        return response == 'y'


def install_dependencies():
    """Install Python dependencies"""
    print_header("Installing Dependencies")
    
    requirements_file = Path("requirements.txt")
    
    if not requirements_file.exists():
        print("\n❌ requirements.txt not found!")
        return False
    
    print("\nThis will install packages from requirements.txt")
    response = input("Continue? (Y/n): ").strip().lower()
    
    if response == 'n':
        print("⚠️  Skipped dependency installation")
        return True
    
    try:
        import subprocess
        print("\n📦 Installing packages (this may take a minute)...")
        result = subprocess.run(
            ["pip", "install", "-r", "requirements.txt"],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print("✅ Dependencies installed successfully")
            return True
        else:
            print(f"❌ Installation failed:\n{result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False


def show_next_steps():
    """Display next steps for the user"""
    print_header("Next Steps")
    
    print("""
1. 🔑 Get API Keys:
   
   REQUIRED (for MVP):
   - OpenAI: https://platform.openai.com/api-keys
     → Add to .env as OPENAI_API_KEY
   
   OPTIONAL (for full features):
   - SendGrid: https://app.sendgrid.com/signup
   - Stripe: https://dashboard.stripe.com/register
   - Simpler.Grants.gov: https://simpler.grants.gov/developer

2. ✏️  Edit .env file:
   
   Open .env in your text editor and add your API keys:
   
   OPENAI_API_KEY=sk-proj-your-actual-key-here
   SIMPLER_GRANTS_API_KEY=your-key-here
   
   See API_SETUP_GUIDE.md for detailed instructions.

3. 🧪 Test API Connections:
   
   python test_apis.py
   
   This will verify all your API keys are working.

4. 📊 Check Configuration:
   
   python config.py
   
   Shows which APIs are configured and ready.

5. 🚀 Run the App:
   
   streamlit run app.py
   
   (Note: app.py will be created in the next development phase)

For detailed guidance, see:
- API_SETUP_GUIDE.md - Step-by-step API key instructions
- BUSINESS_PLAN.md - Complete project roadmap
- README.md - Project overview and documentation
""")


def main():
    """Run the setup wizard"""
    print_header("GrantMatch Advisor - Setup Wizard")
    
    print("\nThis script will help you set up GrantMatch Advisor")
    print("It will take about 5 minutes")
    
    # Step 1: Check Python version
    if not check_python_version():
        return
    
    # Step 2: Check virtual environment
    if not check_virtualenv():
        print("\n⚠️  Setup cancelled. Create a virtual environment first.")
        return
    
    # Step 3: Create .env file
    if not setup_env_file():
        print("\n⚠️  Setup incomplete. Fix the error and try again.")
        return
    
    # Step 4: Install dependencies
    if not install_dependencies():
        print("\n⚠️  Dependencies not installed. You can install manually:")
        print("   pip install -r requirements.txt")
    
    # Step 5: Show next steps
    show_next_steps()
    
    print_header("Setup Complete!")
    
    print("\n🎉 You're ready to configure your API keys!")
    print("\nQuick Start:")
    print("  1. Edit .env and add your OPENAI_API_KEY")
    print("  2. Run: python test_apis.py")
    print("  3. See: API_SETUP_GUIDE.md for detailed help")
    print()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Setup cancelled by user")
    except Exception as e:
        print(f"\n\n❌ Setup failed: {e}")
        print("Please report this error if it persists")

