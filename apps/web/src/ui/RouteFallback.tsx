import { useEffect, useState } from 'react';
import { Saathy } from './Saathy';

export function RouteFallback() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), 200);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div
      aria-busy="true"
      style={{
        minHeight: '100svh',
        display: 'grid',
        placeItems: 'center',
        background: '#041d3d',
        color: '#f9f6ee',
        fontFamily: '"Patrick Hand", cursive',
      }}
    >
      {visible && (
        <div role="status" style={{ padding: '2rem', textAlign: 'center' }}>
          <Saathy mood="sleep" size={92} alt="Saathy" />
          <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>VidhyaSaathy</p>
          <p style={{ margin: '0.5rem 0 0', color: '#b1c4d9' }}>Loading your space…</p>
        </div>
      )}
    </div>
  );
}
