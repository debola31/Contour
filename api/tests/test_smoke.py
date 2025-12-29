"""
Smoke tests to verify pytest infrastructure is working.
"""
import pytest


class TestSmokeTests:
    """Basic tests to verify the test setup works."""

    def test_basic_assertion(self):
        """Test that basic assertions work."""
        assert True
        assert 1 + 1 == 2
        assert "hello" in "hello world"

    def test_pytest_marks_work(self):
        """Test that pytest can execute tests."""
        result = sum([1, 2, 3, 4, 5])
        assert result == 15

    @pytest.mark.unit
    def test_unit_marker_works(self):
        """Test that the unit marker can be applied."""
        assert True

    async def test_async_support(self):
        """Test that async tests work with pytest-asyncio."""
        import asyncio
        await asyncio.sleep(0.001)
        assert True

    def test_exception_handling(self):
        """Test that pytest can catch exceptions."""
        with pytest.raises(ValueError):
            raise ValueError("Test exception")
