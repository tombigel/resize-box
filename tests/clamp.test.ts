import { describe, it, expect } from 'vitest';
import { clamp } from '@/utils'; // Import from source using alias

describe('clamp function', () => {
  it('should return the number if it is within the bounds', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });

  it('should clamp the number to the lower bound', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('should clamp the number to the upper bound', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('should handle bounds in any order', () => {
    expect(clamp(5, 10, 0)).toBe(5);
    expect(clamp(-5, 10, 0)).toBe(0);
    expect(clamp(15, 10, 0)).toBe(10);
  });

  it('should handle cases with only two arguments (using n1 as default for n2)', () => {
    // clamp(n1, n2=n1, n3=n2)
    expect(clamp(5, 0)).toBe(0);   // clamp(5, 0, 0) -> [0, 0, 5] -> min=0, num=0, max=5 -> Math.min(5, Math.max(0, 0)) = 0
    expect(clamp(5, 10)).toBe(10);  // clamp(5, 10, 10) -> [5, 10, 10] -> min=5, num=10, max=10 -> Math.min(10, Math.max(5, 10)) = 10
    expect(clamp(-5, 0)).toBe(0);  // clamp(-5, 0, 0) -> [-5, 0, 0] -> min=-5, num=0, max=0 -> Math.min(0, Math.max(-5, 0)) = 0
  });

   it('should handle cases with only one argument (using n1 as default for n2 and n3)', () => {
    // clamp(n1, n2=n1, n3=n2)
    expect(clamp(5)).toBe(5);     // clamp(5, 5, 5) -> min=5, num=5, max=5 -> max(5, min(5, 5)) = 5
  });

});
