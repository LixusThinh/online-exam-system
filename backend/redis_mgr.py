import redis
import logging
from config import settings
from datetime import timedelta

logger = logging.getLogger(__name__)


class RedisManager:
    def __init__(self):
        self.redis_client = None
        self.use_fallback = False
        self.fallback_cache = {}

    def connect(self):
        try:
            self.redis_client = redis.from_url(
                settings.REDIS_URL, decode_responses=True
            )
            self.redis_client.ping()
            logger.info("Successfully connected to Redis!")
        except Exception as e:
            logger.warning(
                f"Could not connect to Redis: {e}. Falling back to in-memory cache."
            )
            self.use_fallback = True

    def blacklist_access_token(self, jti: str, expires_in: timedelta):
        key = f"blacklist:access:{jti}"
        if self.use_fallback:
            self.fallback_cache[key] = "blacklisted"
        else:
            try:
                self.redis_client.setex(key, int(expires_in.total_seconds()), "true")
            except Exception as e:
                logger.error(f"Redis error when blacklisting access token: {e}")

    def is_access_token_blacklisted(self, jti: str) -> bool:
        key = f"blacklist:access:{jti}"
        if self.use_fallback:
            return key in self.fallback_cache
        else:
            try:
                return self.redis_client.exists(key) > 0
            except Exception as e:
                logger.error(f"Redis error checking access token blacklist: {e}")
                return False

    def blacklist_refresh_token(self, token: str, expires_in: timedelta):
        key = f"blacklist:refresh:{token}"
        if self.use_fallback:
            self.fallback_cache[key] = "blacklisted"
        else:
            try:
                self.redis_client.setex(key, int(expires_in.total_seconds()), "true")
            except Exception as e:
                logger.error(f"Redis error when blacklisting refresh token: {e}")

    def is_refresh_token_blacklisted(self, token: str) -> bool:
        key = f"blacklist:refresh:{token}"
        if self.use_fallback:
            return key in self.fallback_cache
        else:
            try:
                return self.redis_client.exists(key) > 0
            except Exception as e:
                logger.error(f"Redis error checking refresh token blacklist: {e}")
                return False

    def blacklist_user_tokens(self, user_id: int, expires_in: timedelta):
        prefix = f"blacklist:user:{user_id}"
        if self.use_fallback:
            self.fallback_cache[prefix] = "logout_all"
        else:
            try:
                self.redis_client.setex(
                    prefix, int(expires_in.total_seconds()), "logout_all"
                )
            except Exception as e:
                logger.error(f"Redis error when blacklisting user tokens: {e}")

    def is_user_tokens_blacklisted(self, user_id: int) -> bool:
        prefix = f"blacklist:user:{user_id}"
        if self.use_fallback:
            return prefix in self.fallback_cache
        else:
            try:
                return self.redis_client.exists(prefix) > 0
            except Exception as e:
                logger.error(f"Redis error checking user token blacklist: {e}")
                return False


redis_mgr = RedisManager()
redis_mgr.connect()
