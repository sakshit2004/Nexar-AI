import sqlite3

conn = sqlite3.connect('grantmatch.db')
cursor = conn.cursor()

# Get table info
cursor.execute("PRAGMA table_info(user_profiles)")
columns = cursor.fetchall()

print("UserProfile columns:")
for col in columns:
    print(f"  - {col[1]} ({col[2]})")

conn.close()

