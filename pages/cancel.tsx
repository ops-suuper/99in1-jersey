export default function Cancel() {
  return (
    <main style={{ minHeight:'100vh', background:'#1E152B', color:'#F2C94C', display:'grid', placeItems:'center' }}>
      <div style={{ textAlign:'center', padding:24 }}>
        <h1>Payment cancelled</h1>
        <a href="/" style={{ color:'#F2C94C', textDecoration:'underline' }}>Back to jersey</a>
      </div>
    </main>
  );
}
