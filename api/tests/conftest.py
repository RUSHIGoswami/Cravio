import os

os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://cravio:cravio@localhost:55432/cravio")
os.environ.setdefault("REDIS_URL", "redis://localhost:56379/0")
