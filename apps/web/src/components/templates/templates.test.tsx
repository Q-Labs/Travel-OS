import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AuthLayout } from './AuthLayout';

describe('templates', () => {
  it('AuthLayout puts the pitch on the left and the form on the right', () => {
    const { container } = render(<AuthLayout aside={<p>pitch</p>}><form>form</form></AuthLayout>);
    expect(container.querySelector('.login-left')).toHaveTextContent('pitch');
    expect(container.querySelector('.login-right .login-form-wrap')).toHaveTextContent('form');
    expect(screen.getByText('form')).toBeInTheDocument();
  });
});
