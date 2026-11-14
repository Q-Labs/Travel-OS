import type { ReactNode } from 'react';

// The signed-in frame: navigation on the left, page content on the right,
// and a slot for anything that floats above both (modals, panels).
export function AppShell({
  sidebar,
  topbar,
  overlays,
  children,
}: {
  sidebar: ReactNode;
  topbar?: ReactNode;
  overlays?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="app">
      {sidebar}
      <main className="main">
        {topbar}
        {children}
      </main>
      {overlays}
    </div>
  );
}
