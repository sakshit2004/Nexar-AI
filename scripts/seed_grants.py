"""
Seed database with sample grants for testing
"""
import sys
import os
from datetime import datetime, timedelta

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.models.database import SessionLocal
from backend.models.grant import Grant

def seed_grants():
    """Add sample grants to database"""
    db = SessionLocal()
    
    # Check if grants already exist
    existing = db.query(Grant).count()
    if existing > 0:
        print(f"✓ Database already has {existing} grants")
        return
    
    sample_grants = [
        {
            "id": "HRSA-25-001",
            "title": "Rural Health Care Services Outreach Program",
            "agency": "Health Resources and Services Administration",
            "opportunity_category": "health",
            "description": "Funding to support rural communities in developing and sustaining healthcare services outreach programs. Focus on expanding access to quality care in underserved areas.",
            "award_ceiling": 500000,
            "close_date": (datetime.now() + timedelta(days=45)).date(),
            "open_date": (datetime.now() - timedelta(days=10)).date(),
            "eligibility": "Eligible applicants include non-profit organizations, community health centers, and local government entities serving rural populations.",
            "source": "manual_seed"
        },
        {
            "id": "ED-25-042",
            "title": "STEM Education Innovation Grants",
            "agency": "Department of Education",
            "opportunity_category": "education",
            "description": "Competitive grants to K-12 schools and educational organizations to implement innovative STEM curricula and programs that increase student engagement in science, technology, engineering, and mathematics.",
            "award_ceiling": 300000,
            "close_date": (datetime.now() + timedelta(days=60)).date(),
            "open_date": (datetime.now() - timedelta(days=5)).date(),
            "eligibility": "Public and private K-12 schools, school districts, and non-profit educational organizations.",
            "source": "manual_seed"
        },
        {
            "id": "EPA-25-018",
            "title": "Environmental Justice Community Grants",
            "agency": "Environmental Protection Agency",
            "opportunity_category": "environment",
            "description": "Grants to support community-led projects addressing environmental and public health issues in underserved communities. Priority for air quality, water access, and climate resilience projects.",
            "award_ceiling": 200000,
            "close_date": (datetime.now() + timedelta(days=30)).date(),
            "open_date": (datetime.now() - timedelta(days=15)).date(),
            "eligibility": "Community-based non-profit organizations, tribal governments, and local governments.",
            "source": "manual_seed"
        },
        {
            "id": "NSF-25-089",
            "title": "Research Infrastructure for Emerging Technologies",
            "agency": "National Science Foundation",
            "opportunity_category": "technology",
            "description": "Multi-year funding for universities and research institutions to develop infrastructure supporting AI, quantum computing, and advanced materials research.",
            "award_ceiling": 2000000,
            "close_date": (datetime.now() + timedelta(days=90)).date(),
            "open_date": (datetime.now() - timedelta(days=20)).date(),
            "eligibility": "Institutions of higher education, research institutions, and non-profit research organizations.",
            "source": "manual_seed"
        },
        {
            "id": "NEA-25-012",
            "title": "Arts Access and Equity Initiative",
            "agency": "National Endowment for the Arts",
            "opportunity_category": "arts",
            "description": "Grants to increase access to high-quality arts programming in underserved communities. Supports partnerships between arts organizations and community groups.",
            "award_ceiling": 150000,
            "close_date": (datetime.now() + timedelta(days=75)).date(),
            "open_date": (datetime.now() - timedelta(days=8)).date(),
            "eligibility": "Non-profit arts organizations, community organizations, and local arts agencies.",
            "source": "manual_seed"
        },
        {
            "id": "SBA-25-034",
            "title": "Small Business Innovation Research (SBIR)",
            "agency": "Small Business Administration",
            "opportunity_category": "technology",
            "description": "Phase II funding for small businesses developing innovative technologies with commercial potential. Focus on healthcare, clean energy, and advanced manufacturing.",
            "award_ceiling": 750000,
            "close_date": (datetime.now() + timedelta(days=120)).date(),
            "open_date": (datetime.now() - timedelta(days=30)).date(),
            "eligibility": "Small businesses with fewer than 500 employees that have completed SBIR Phase I.",
            "source": "manual_seed"
        },
        {
            "id": "DOE-25-056",
            "title": "Clean Energy Manufacturing Innovation",
            "agency": "Department of Energy",
            "opportunity_category": "environment",
            "description": "Funding for projects advancing clean energy manufacturing technologies, including solar, wind, battery storage, and energy efficiency innovations.",
            "award_ceiling": 1000000,
            "close_date": (datetime.now() + timedelta(days=50)).date(),
            "open_date": (datetime.now() - timedelta(days=12)).date(),
            "eligibility": "Private companies, universities, national laboratories, and state/local governments.",
            "source": "manual_seed"
        },
        {
            "id": "HUD-25-023",
            "title": "Community Development Block Grants",
            "agency": "Housing and Urban Development",
            "opportunity_category": "health",
            "description": "Flexible grants for community development activities including affordable housing, infrastructure improvements, and economic development programs.",
            "award_ceiling": 5000000,
            "close_date": (datetime.now() + timedelta(days=35)).date(),
            "open_date": (datetime.now() - timedelta(days=18)).date(),
            "eligibility": "States, metropolitan cities, urban counties, and federally recognized tribes.",
            "source": "manual_seed"
        },
    ]
    
    for grant_data in sample_grants:
        grant = Grant(**grant_data)
        db.add(grant)
    
    db.commit()
    print(f"✅ Added {len(sample_grants)} sample grants to database")
    db.close()


if __name__ == "__main__":
    print("Seeding database with sample grants...")
    seed_grants()
    print("Done!")

