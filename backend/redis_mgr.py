import redis
import logging
from config import settings
from datetime import timedelta

logger = logging.getLogger(__name__)

class RedisManager:
    def __init__(self):
        self.redis_client = None
        self.use_fallback = False
        self.fallback_cache = {}  # In-memory dictionary fallback

    def connect(self):
        try:
            # Attempt to connect to Redis
            self.redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
            self.redis_client.ping()
            logger.info("Successfully connected to Redis!")
        except Exception as e:
            logger.warning(f"Could not connect to Redis: {e}. Falling back to in-memory cache.")
            self.use_fallback = True

    def blacklist_token(self, jti: str, expires_in: timedelta):
        if self.use_fallback:
            self.fallback_cache[jti] = "blacklisted"
            # Memory leak warning: In a real fallback we'd need a background task to clear expired tokens
        else:
            try:
                self.redis_client.setex(f"blacklist:{jti}", expires_in, "true")
            except Exception as e:
                logger.error(f"Redis error when blacklisting token: {e}")

    def is_token_blacklisted(self, jti: str) -> bool:
        if self.use_fallback:
            return jti in self.fallback_cache
        else:
            try:
                return self.redis_client.exists(f"blacklist:{jti}") > 0
            except Exception as e:
                logger.error(f"Redis error checking blacklist: {e}")
                return False

redis_mgr = RedisManager()
redis_mgr.connect()
