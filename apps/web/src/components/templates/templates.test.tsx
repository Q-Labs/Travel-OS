import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppShell } from './AppShell';
import { AuthLayout } from './AuthLayout';

describe('templates', () => {
  it('AppShell places sidebar, topbar, content and overlays in their slots', () => {
    const { container } = render(
      <AppShell sidebar={<nav>side</nav>} topbar={<header>top</header>} overlays={<dialog open>modal</dialog>}>
        <p>content</p>
      </AppShell>,
    );
    const app = container.querySelector('.app') as HTMLElement;
    const main = app.querySelector('main.main') as HTMLElement;
    expect(app.firstElementChild).toHaveTextContent('side');
    expect(main).toHaveTextContent('topcontent');
    expect(main).not.toHaveTextContent('modal');
    expect(app.lastElementChild).toHaveTextContent('modal');
  });

  it('AppShell works without a topbar or overlays', () => {
    const { container } = render(<AppShell sidebar={<nav>side</nav>}><p>content</p></AppShell>);
    expect(container.querySelector('main.main')).toHaveTextContent('content');
  });

  it('AuthLayout puts the pitch on the left and the form on the right', () => {
    const { container } = render(<AuthLayout aside={<p>pitch</p>}><form>form</form></AuthLayout>);
    expect(container.querySelector('.login-left')).toHaveTextContent('pitch');
    expect(container.querySelector('.login-right .login-form-wrap')).toHaveTextContent('form');
    expect(screen.getByText('form')).toBeInTheDocument();
  });
});
