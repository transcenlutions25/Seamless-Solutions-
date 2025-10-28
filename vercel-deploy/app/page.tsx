export default function Page() {
  return (
    <main style={{ 
      padding: '2rem', 
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '800px',
      margin: '0 auto',
      lineHeight: '1.6'
    }}>
      <h1 style={{ 
        color: '#00A8A8', 
        fontSize: '2.5rem',
        marginBottom: '1rem',
        fontWeight: '700'
      }}>
        Seamless Solutions
      </h1>
      <p style={{ 
        fontSize: '1.2rem',
        color: '#333',
        marginBottom: '2rem'
      }}>
        Your modern web application is now ready for deployment on Vercel.
      </p>
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '1.5rem',
        borderRadius: '8px',
        border: '1px solid #e9ecef'
      }}>
        <h2 style={{ color: '#00A8A8', marginBottom: '1rem' }}>🚀 Deployment Ready</h2>
        <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
          <li>Next.js 15 with App Router</li>
          <li>TypeScript configuration</li>
          <li>Vercel-optimized build</li>
          <li>API routes included</li>
        </ul>
      </div>
    </main>
  );
}
