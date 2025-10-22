export default function HomePage() {
  return (
    <main style={{ 
      padding: '40px', 
      fontFamily: 'system-ui, -apple-system, sans-serif', 
      color: '#00A8A8',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Seamless Solutions</h1>
      <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>Ready for Cursor build.</p>
      <div style={{ 
        padding: '1rem 2rem', 
        backgroundColor: '#00A8A8', 
        color: 'white', 
        borderRadius: '8px',
        fontSize: '1rem'
      }}>
        🚀 Successfully deployed on Vercel!
      </div>
    </main>
  );
}
