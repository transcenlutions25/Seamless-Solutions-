export default function Page() {
  return (
    <main style={{ padding: 40, fontFamily: 'sans-serif', color: '#00A8A8' }}>
      <h1>Seamless Solutions</h1>
      <p>Production-ready application.</p>
      <div style={{ marginTop: 20 }}>
        <h2>System Status</h2>
        <p>Environment: {process.env.NODE_ENV || 'development'}</p>
        <p>API URL: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}</p>
      </div>
    </main>
  );
}
