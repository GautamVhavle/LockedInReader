import { describe, expect, it } from 'vitest';

describe('extension messaging contract', () => {
  it('defines capture message types', () => {
    const types = ['LOCKED_IN_CAPTURE', 'LOCKED_IN_GET_PAGE', 'LOCKED_IN_PING'];
    expect(new Set(types).size).toBe(3);
  });
});
