import { useState } from "react";

const StatusIcon = ({ status }) => {
  if (status === "pass") return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" fill="#22c55e" fillOpacity="0.2" stroke="#22c55e" strokeWidth="1.5"/>
      <path d="M5 8l2 2 4-4" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  if (status === "warn") return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2L14 13H2L8 2Z" fill="#f59e0b" fillOpacity="0.2" stroke="#f59e0b" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M8 7v3M8 11.5v.5" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" fill="#ef4444" fillOpacity="0.2" stroke="#ef4444" strokeWidth="1.5"/>
      <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
};

const ScoreRing = ({ score, label, color }) => {
  const r = 34;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7"/>
        <circle cx="45" cy="45" r={r} fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 45 45)" style={{ transition: "stroke-dashoffset 1s ease" }}/>
        <text x="45" y="41" textAnchor="middle" fill="white" fontSize="17" fontWeight="700" fontFamily="monospace">{score}</text>
        <text x="45" y="54" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="8" fontFamily="monospace">/100</text>
      </svg>
      <span style={{ fontSize: "9px", fontFamily: "'DM Mono', monospace", color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</span>
    </div>
  );
};

const CHECK_LABELS = {
  title: "Title-tagi", metaDesc: "Meta Description", h1: "H1-otsikko",
  schema: "Schema Markup", ogTags: "Open Graph", faq: "FAQ-osio",
  tldr: "TL;DR-blokki", internalLinks: "Sisäiset linkit",
  images: "Kuva alt-tekstit", cta: "Call-to-Action",
  productSchema: "Product Schema", priceVisible: "Hinnat näkyvillä",
  buyButton: "Ostopainike", reviewSignals: "Asiakasarvostelut",
  contentLength: "Sisällön pituus", questionHeadings: "Kysymysotsikot",
  authorBio: "Kirjoittajan bio", freshness: "Sisällön tuoreus",
};

const CheckRow = ({ id, status, note }) => {
  const colors = { pass: "#22c55e", warn: "#f59e0b", fail: "#ef4444" };
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "9px 12px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", marginBottom: "5px", borderLeft: `2px solid ${colors[status]}30` }}>
      <div style={{ marginTop: "1px", flexShrink: 0 }}><StatusIcon status={status} /></div>
      <div>
        <div style={{ fontSize: "12px", fontFamily: "'DM Mono', monospace", color: "#f0f0f8", marginBottom: "2px" }}>{CHECK_LABELS[id] || id}</div>
        <div style={{ fontSize: "11px", color: "rgba(240,240,248,0.5)", lineHeight: "1.4" }}>{note}</div>
      </div>
    </div>
  );
};

export default function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const analyze = async () => {
    if (!url.trim()) { setError("Syötä sivuston URL."); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/site-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setResult(data);
    } catch {
      setError("Analyysi epäonnistui. Tarkista URL ja yritä uudelleen.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#111111", color: "white", fontFamily: "Georgia, serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; background: #111111; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        input::placeholder { color: rgba(255,255,255,0.2) !important; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>

      {/* ── Hero ── */}
      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "clamp(48px,8vw,96px) 24px clamp(40px,6vw,64px)" }}>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "28px" }}>
          <div style={{ width: "26px", height: "26px", borderRadius: "7px", background: "linear-gradient(135deg,#6366f1,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="13" height="13" fill="none" viewBox="0 0 16 16"><path d="M2 4h12M2 8h8M2 12h10" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </div>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: "9px", letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>DevKarhu</span>
        </div>

        <h1 style={{ fontSize: "clamp(28px,6vw,50px)", fontWeight: "400", lineHeight: "1.1", letterSpacing: "-0.02em", marginBottom: "18px" }}>
          Analysoi sivustosi<br/>
          <span style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>SEO & AI-hakuvalmius</span>
        </h1>

        <p style={{ fontSize: "clamp(14px,2vw,16px)", color: "rgba(255,255,255,0.48)", lineHeight: "1.75", marginBottom: "36px", maxWidth: "500px" }}>
          Saat kattavan raportin sivustosi hakukonenäkyvyydestä ja valmiudesta tekoälyhakukoneille kuten ChatGPT ja Google AI Overview. Toimii sekä verkkokaupoille että blogisivustoille.
        </p>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "36px" }}>
          {[["🔍","Tekninen SEO"],["🤖","GEO-analyysi"],["⚡","Pikavoitot"],["🛒","E-commerce"],["✍","Blogi"]].map(([icon, label]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "20px", fontSize: "11px", fontFamily: "'DM Mono',monospace", color: "rgba(255,255,255,0.5)" }}>
              <span>{icon}</span><span>{label}</span>
            </div>
          ))}
        </div>

        {/* Input card */}
        <div style={{ background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "20px" }}>
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === "Enter" && analyze()}
              placeholder="https://sinunsivu.fi"
              style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", padding: "12px 16px", color: "white", fontSize: "14px", fontFamily: "'DM Mono',monospace", outline: "none" }}
            />
            <button onClick={analyze} disabled={loading} style={{
              padding: "12px 22px", background: loading ? "rgba(99,102,241,0.3)" : "linear-gradient(135deg,#6366f1,#a855f7)",
              border: "none", borderRadius: "10px", color: "white", fontSize: "13px",
              fontFamily: "'DM Mono',monospace", fontWeight: "600", cursor: loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap"
            }}>
              {loading
                ? <><svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ animation: "spin 1s linear infinite" }}><circle cx="8" cy="8" r="6" stroke="white" strokeWidth="2" strokeOpacity="0.3"/><path d="M8 2a6 6 0 0 1 6 6" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>Analysoidaan...</>
                : "Analysoi →"}
            </button>
          </div>

          {loading && (
            <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#6366f1", animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}/>
              ))}
              <span style={{ fontSize: "11px", fontFamily: "'DM Mono',monospace", color: "rgba(255,255,255,0.35)" }}>Crawlataan sivustoa ja analysoidaan sisältöä...</span>
            </div>
          )}

          {error && (
            <div style={{ marginTop: "10px", padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "8px", fontSize: "13px", color: "#fca5a5" }}>{error}</div>
          )}
        </div>
      </div>

      {/* ── Results ── */}
      {result && (
        <div style={{ maxWidth: "680px", margin: "0 auto", padding: "0 24px 80px", animation: "fadeIn 0.5s ease" }}>

          {/* Score overview */}
          <div style={{ background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "24px", marginBottom: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <div style={{ fontSize: "9px", fontFamily: "'DM Mono',monospace", color: "rgba(255,255,255,0.3)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "6px" }}>
                  {result.siteType === "ecommerce" ? "🛒 Verkkokauppa" : "✍ Blogi / Sisältösivusto"}
                </div>
                <div style={{ fontSize: "20px", fontWeight: "400", color: "white", marginBottom: "8px" }}>{result.siteName}</div>
                <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", lineHeight: "1.6", maxWidth: "420px" }}>{result.summary}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "24px", justifyContent: "center", flexWrap: "wrap" }}>
              <ScoreRing score={result.overallScore} label="Kokonais" color="#a855f7" />
              <ScoreRing score={result.seoScore} label="SEO" color="#6366f1" />
              <ScoreRing score={result.geoScore} label="GEO" color="#06b6d4" />
            </div>
          </div>

          {/* Top issues */}
          <div style={{ background: "#1c1c1c", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "16px", padding: "20px", marginBottom: "14px" }}>
            <div style={{ fontSize: "9px", fontFamily: "'DM Mono',monospace", color: "#ef4444", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "14px" }}>Tärkeimmät ongelmat</div>
            {result.topIssues?.map((issue, i) => (
              <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "8px" }}>
                <span style={{ color: "#ef4444", fontFamily: "'DM Mono',monospace", fontSize: "10px", marginTop: "2px", flexShrink: 0 }}>{String(i+1).padStart(2,"0")}</span>
                <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", lineHeight: "1.5" }}>{issue}</span>
              </div>
            ))}
          </div>

          {/* Quick wins */}
          <div style={{ background: "#1c1c1c", border: "1px solid rgba(168,85,247,0.2)", borderRadius: "16px", padding: "20px", marginBottom: "14px" }}>
            <div style={{ fontSize: "9px", fontFamily: "'DM Mono',monospace", color: "#a855f7", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "14px" }}>⚡ Pikavoitot</div>
            {result.quickWins?.map((win, i) => (
              <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "10px 12px", marginBottom: "6px", background: "rgba(168,85,247,0.07)", border: "1px solid rgba(168,85,247,0.15)", borderRadius: "8px" }}>
                <div style={{ width: "20px", height: "20px", borderRadius: "50%", flexShrink: 0, background: "rgba(168,85,247,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono',monospace", fontSize: "9px", color: "#a855f7", fontWeight: "700" }}>{i+1}</div>
                <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.75)", lineHeight: "1.5" }}>{win}</span>
              </div>
            ))}
          </div>

          {/* All checks */}
          <div style={{ background: "#1c1c1c", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "20px", marginBottom: "14px" }}>
            <div style={{ fontSize: "9px", fontFamily: "'DM Mono',monospace", color: "rgba(255,255,255,0.3)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "14px" }}>SEO & GEO — Kaikki tarkistukset</div>
            {result.checks && Object.entries(result.checks).map(([key, val]) => (
              <CheckRow key={key} id={key} status={val.status} note={val.note} />
            ))}

            {(result.ecommerceSpecific || result.blogSpecific) && (
              <>
                <div style={{ fontSize: "9px", fontFamily: "'DM Mono',monospace", color: result.siteType === "ecommerce" ? "#f59e0b" : "#06b6d4", letterSpacing: "0.15em", textTransform: "uppercase", margin: "18px 0 10px" }}>
                  {result.siteType === "ecommerce" ? "🛒 Verkkokauppa-tarkistukset" : "✍ Blogi-tarkistukset"}
                </div>
                {Object.entries(result.ecommerceSpecific || result.blogSpecific || {}).map(([key, val]) => (
                  <CheckRow key={key} id={key} status={val.status} note={val.note} />
                ))}
              </>
            )}
          </div>

          {/* CTA */}
          <div style={{ background: "linear-gradient(135deg,rgba(99,102,241,0.12),rgba(168,85,247,0.12))", border: "1px solid rgba(99,102,241,0.25)", borderRadius: "16px", padding: "28px", textAlign: "center" }}>
            <div style={{ fontSize: "clamp(16px,3vw,20px)", marginBottom: "10px", lineHeight: "1.4" }}>Haluatko korjata nämä ongelmat?</div>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", lineHeight: "1.7", marginBottom: "22px", maxWidth: "420px", margin: "0 auto 22px" }}>
              Optimoi blogitekstisi ja tuotesivusi yksitellen — tarkka analyysi, parannettu teksti ja PDF-raportti ennen/jälkeen vertailulla.
            </p>
            <a href="https://server.devkarhu.com" target="_blank" rel="noreferrer" style={{ display: "inline-block", padding: "12px 28px", background: "linear-gradient(135deg,#6366f1,#a855f7)", borderRadius: "10px", color: "white", textDecoration: "none", fontSize: "13px", fontFamily: "'DM Mono',monospace", fontWeight: "600" }}>
              Avaa tekstianalyysi →
            </a>
          </div>

          <div style={{ marginTop: "40px", textAlign: "center" }}>
            <span style={{ fontSize: "9px", fontFamily: "'DM Mono',monospace", color: "rgba(255,255,255,0.12)", letterSpacing: "0.1em" }}>DEVKARHU · SIVUSTOANALYYSI</span>
          </div>
        </div>
      )}
    </div>
  );
}