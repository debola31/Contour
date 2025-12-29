import { describe, it, expect } from 'vitest';

describe('Smoke Test - Test Infrastructure', () => {
  it('should verify vitest globals are available', () => {
    expect(describe).toBeDefined();
    expect(it).toBeDefined();
    expect(expect).toBeDefined();
  });

  it('should verify basic assertions work', () => {
    expect(true).toBe(true);
    expect(1 + 1).toBe(2);
    expect('hello').toContain('ell');
  });

  it('should verify jest-dom matchers are available', () => {
    const div = document.createElement('div');
    div.textContent = 'Hello World';
    document.body.appendChild(div);

    expect(div).toBeInTheDocument();
    expect(div).toHaveTextContent('Hello World');

    // Cleanup
    document.body.removeChild(div);
  });

  it('should verify async operations work', async () => {
    const result = await Promise.resolve('async result');
    expect(result).toBe('async result');
  });
});
