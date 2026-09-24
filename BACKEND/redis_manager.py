# BACKEND/redis_manager.py

import os
import json

import redis

from dotenv import load_dotenv


# CONFIGURATION

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL")

if not REDIS_URL:
    raise ValueError(
        "REDIS_URL is missing from .env"
    )


# REDIS CLIENT
redis_client = redis.from_url(
    REDIS_URL,
    decode_responses=True
)


# CONNECTION TEST
def test_redis_connection():
    """
    Test Redis connection.
    """

    try:

        return redis_client.ping()

    except Exception:

        return False

# SET JSON DATA
def set_json(key, data, expiry_seconds=None):
    """
    Store Python dictionary/list as JSON in Redis.
    """

    value = json.dumps(
        data,
        default=str
    )

    if expiry_seconds:

        redis_client.setex(
            key,
            expiry_seconds,
            value
        )

    else:

        redis_client.set(
            key,
            value
        )

    return True


# GET JSON DATA
def get_json(key):
    """
    Retrieve JSON data from Redis.
    """

    value = redis_client.get(key)

    if value is None:
        return None

    return json.loads(value)


# DELETE KEY
def delete_key(key):
    """
    Delete Redis key.
    """

    return redis_client.delete(key)


# BASIC TEST

if __name__ == "__main__":

    print("=" * 60)
    print("GATIDRISHTI - REDIS MANAGER")
    print("=" * 60)

    if test_redis_connection():

        print("Redis connection successful.")

    else:

        print("Redis connection failed.")

    print("=" * 60)