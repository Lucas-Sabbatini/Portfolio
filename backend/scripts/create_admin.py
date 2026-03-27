#!/usr/bin/env python3
"""Standalone script to create the first admin user."""
import asyncio
import os
import sys

import asyncpg
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def main() -> None:
    email = os.environ.get("ADMIN_EMAIL")
    password = os.environ.get("ADMIN_PASSWORD")
    database_url = os.environ.get("DATABASE_URL")

    if not email or not password or not database_url:
        print("ERROR: ADMIN_EMAIL, ADMIN_PASSWORD, and DATABASE_URL must be set")
        sys.exit(1)

    password_hash = pwd_context.hash(password)

    conn = await asyncpg.connect(dsn=database_url)
    try:
        existing = await conn.fetchrow("SELECT id FROM admin_users WHERE email = $1", email)
        if existing:
            print("Already exists")
            return
        await conn.execute(
            "INSERT INTO admin_users (email, password_hash) VALUES ($1, $2)",
            email,
            password_hash,
        )
        print(f"Admin created: {email}")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
