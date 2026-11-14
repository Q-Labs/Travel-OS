import type { ReactNode } from 'react';

// The signed-out frame: a pitch on the left, the form on the right.
export function AuthLayout({ aside, children }: { aside: ReactNode; children: ReactNode }) {
  return (
    <div className="login-shell">
      <div className="login-left">{aside}</div>
      <div className="login-right">
        <div className="login-form-wrap">{children}</div>
      </div>
    </div>
  );
}
