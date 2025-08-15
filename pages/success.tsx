export default function Success() {
  return (
    <main style={{ minHeight:'100vh', background:'#1E152B', color:'#F2C94C', display:'grid', placeItems:'center' }}>
      <div style={{ textAlign:'center', padding:24 }}>
        <h1>Payment successful ✅</h1>
        <p>Your logo will appear on the jersey shortly (usually a few seconds).</p>
        <a href="/" style={{ color:'#F2C94C', textDecoration:'underline' }}>Return to jersey</a>
      </div>
    </main>
  );
}
