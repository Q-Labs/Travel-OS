export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--ink-3)' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'normal', fontSize: 26, color: 'var(--ink-2)' }}>
        {title}
      </div>
      <div style={{ marginTop: 6, fontSize: 13 }}>{body}</div>
    </div>
  );
}
