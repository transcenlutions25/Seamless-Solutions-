import React from 'react';

export default function Page(): React.JSX.Element {
  return (
    <main style={{ 
      padding: '2rem', 
      fontFamily: 'system-ui, -apple-system, sans-serif', 
      color: '#00A8A8',
      maxWidth: '800px',
      margin: '0 auto',
      lineHeight: '1.6'
    }}>
      <h1 style={{ 
        fontSize: '2.5rem', 
        marginBottom: '1rem',
        fontWeight: '600'
      }}>
        Seamless Solutions
      </h1>
      <p style={{ 
        fontSize: '1.2rem',
        marginBottom: '2rem',
        color: '#666'
      }}>
        Ready for Cursor build.
      </p>
    </main>
  );
}
