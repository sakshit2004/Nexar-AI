from backend.models.database import SessionLocal
from backend.models.user import User, UserProfile

db = SessionLocal()
users = db.query(User).all()
print(f"Users in DB: {len(users)}")
for u in users:
    print(f"  - {u.email} (ID: {u.id})")

profiles = db.query(UserProfile).all()
print(f"Profiles in DB: {len(profiles)}")
for p in profiles:
    print(f"  - User {p.user_id}: {p.organization_name or 'No org'}")

