import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from './components/ui/button.js';

describe('Button', () => {
  it('renders a labeled control', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy();
  });
});
