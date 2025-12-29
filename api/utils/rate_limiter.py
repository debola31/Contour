"""Rate limiting utilities."""

from datetime import datetime, timedelta
from collections import defaultdict
from threading import Lock


class RateLimiter:
    """Simple in-memory rate limiter.

    Note: This is suitable for single-instance deployments.
    For multi-instance deployments, use Redis or similar.
    """

    def __init__(self, max_requests: int, window_seconds: int):
        """Initialize rate limiter.

        Args:
            max_requests: Maximum number of requests allowed in the window
            window_seconds: Time window in seconds
        """
        self.max_requests = max_requests
        self.window = timedelta(seconds=window_seconds)
        self.requests: dict[str, list[datetime]] = defaultdict(list)
        self.lock = Lock()

    def check(self, key: str) -> bool:
        """Check if a request is allowed.

        Args:
            key: Unique identifier for the rate limit bucket (e.g., company_id)

        Returns:
            True if request is allowed, False if rate limited
        """
        now = datetime.utcnow()
        cutoff = now - self.window

        with self.lock:
            # Clean old requests
            self.requests[key] = [t for t in self.requests[key] if t > cutoff]

            # Check if under limit
            if len(self.requests[key]) >= self.max_requests:
                return False

            # Record this request
            self.requests[key].append(now)
            return True

    def get_remaining(self, key: str) -> int:
        """Get remaining requests allowed in the current window.

        Args:
            key: Unique identifier for the rate limit bucket

        Returns:
            Number of requests remaining
        """
        now = datetime.utcnow()
        cutoff = now - self.window

        with self.lock:
            # Clean old requests
            self.requests[key] = [t for t in self.requests[key] if t > cutoff]
            return max(0, self.max_requests - len(self.requests[key]))

    def reset(self, key: str) -> None:
        """Reset the rate limit for a key.

        Args:
            key: Unique identifier for the rate limit bucket
        """
        with self.lock:
            self.requests[key] = []
