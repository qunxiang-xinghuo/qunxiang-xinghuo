import sqlite3
conn = sqlite3.connect('dev.db')
cursor = conn.cursor()

cursor.execute("SELECT username, password, isAdmin, createdAt FROM User WHERE username = 'xingxing'")
user = cursor.fetchone()
print('Admin user xingxing:', user)

cursor.execute("SELECT username, isAdmin, CASE WHEN password IS NULL THEN 'NULL' WHEN password = '' THEN 'EMPTY' ELSE 'HAS_PASSWORD' END as pwd_status FROM User")
all_users = cursor.fetchall()
print('All users:')
for u in all_users:
    print(' ', u)

conn.close()
