import type { PropsWithChildren } from 'react';

export const Panel = ({ children }: PropsWithChildren) => (
  <section style={{ borderRadius: 20, border: '1px solid rgba(148, 163, 184, 0.2)', padding: 20, background: '#0f172a' }}>
    {children}
  </section>
);
