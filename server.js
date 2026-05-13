import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === "production";
const PORT = process.env.PORT || 3001;

const app = express();
app.use(express.json());

// ─── Helpers ────────────────────────────────────────────────────────────────

async function fetchPage(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "fi-FI,fi;q=0.9,en;q=0.8",
    },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

function extractLinks(html, baseUrl) {
  const base = new URL(baseUrl);
  const links = [];
  const matches = html.matchAll(/<a[^>]+href=["']([^"']+)["']/gi);
  for (const match of matches) {
    try {
      const url = new URL(match[1], baseUrl);
      if (
        url.hostname === base.hostname &&
        url.pathname !== "/" &&
        !url.pathname.includes("#") &&
        !links.includes(url.href)
      ) {
        links.push(url.href);
      }
    } catch {}
  }
  return links.slice(0, 5);
}

function parseHtml(html) {
  const NL = "\n";
  let t = html;
  t = t.replace(/<script[\s\S]*?<\/script>/gi, "");
  t = t.replace(/<style[\s\S]*?<\/style>/gi, "");
  t = t.replace(/<nav[\s\S]*?<\/nav>/gi, "");
  t = t.replace(/<footer[\s\S]*?<\/footer>/gi, "");
  t = t.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, NL + "# $1" + NL);
  t = t.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, NL + "## $1" + NL);
  t = t.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, NL + "### $1" + NL);
  t = t.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, NL + "$1" + NL);
  t = t.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, NL + "- $1");
  t = t.replace(/<[^>]+>/g, "");
  t = t.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
  t = t.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
  t = t.replace(/\n\n\n+/g, "\n\n").trim();
  return t.slice(0, 3000);
}

function extractMeta(html) {
  const title = (html.match(/<title[^>]*>([^<]+)<\/title>/i) || [])[1]?.trim() || "";
  const metaDesc =
    (html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) || [])[1] ||
    (html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i) || [])[1] || "";
  const h1s = (html.match(/<h1[^>]*>[\s\S]*?<\/h1>/gi) || []).map(h => h.replace(/<[^>]+>/g, "").trim());
  const hasSchema = html.includes("application/ld+json");
  const hasOg = html.includes("og:title");
  const hasFaq = /faq|ukk|usein kysytty|frequently asked/i.test(html);
  const hasTldr = /tl;dr|tldr|tiivistelmä|yhteenveto/i.test(html);
  const imgCount = (html.match(/<img[^>]+>/gi) || []).length;
  const imgNoAlt = (html.match(/<img(?![^>]*\balt\s*=)[^>]+>/gi) || []).length;
  const hasReviews = /arvostelu|review|tähtä|stars|rating/i.test(html);
  const hasPrice = /€|\$|hinta|price/i.test(html);
  const hasBuyButton = /osta|lisää koriin|add to cart|buy now/i.test(html);
  return { title, metaDesc, h1s, hasSchema, hasOg, hasFaq, hasTldr, imgCount, imgNoAlt, hasReviews, hasPrice, hasBuyButton };
}

// ─── Site Audit API ──────────────────────────────────────────────────────────

const AUDIT_PROMPT = `You are an expert SEO and GEO analyst specializing in ecommerce and blog content sites. Analyze the crawled website and return a detailed audit.

Return ONLY valid JSON:
{
  "siteType": "ecommerce",
  "siteName": "Site name",
  "overallScore": 62,
  "seoScore": 58,
  "geoScore": 55,
  "summary": "One sentence summary of the site and its main SEO/GEO situation.",
  "topIssues": [
    "Meta description puuttuu etusivulta",
    "Ei FAQ-osiota — tekoälyhaut eivät löydä sivustoa",
    "Schema markup puuttuu tuotesivuilta"
  ],
  "quickWins": [
    "Lisää meta description etusivulle (150-160 merkkiä)",
    "Lisää FAQ-osio blogin artikkeleihin",
    "Lisää Product schema verkkokaupan tuotesivuille"
  ],
  "checks": {
    "title": {"status": "pass", "note": "Etusivulla on selkeä title-tagi."},
    "metaDesc": {"status": "fail", "note": "Meta description puuttuu etusivulta."},
    "h1": {"status": "pass", "note": "H1-otsikko löytyy."},
    "schema": {"status": "fail", "note": "Ei JSON-LD schema markuppia."},
    "ogTags": {"status": "warn", "note": "Open Graph tagit puuttuvat osittain."},
    "faq": {"status": "fail", "note": "Ei FAQ-osiota — heikentää GEO-näkyvyyttä."},
    "tldr": {"status": "fail", "note": "Ei TL;DR-blokkeja — tekoäly ei poimi sisältöä."},
    "internalLinks": {"status": "warn", "note": "Sisäisiä linkkejä on vähän."},
    "images": {"status": "warn", "note": "Osalta kuvia puuttuu alt-teksti."},
    "cta": {"status": "warn", "note": "CTA löytyy mutta ostopolku voisi olla selkeämpi."}
  },
  "ecommerceSpecific": {
    "productSchema": {"status": "fail", "note": "Tuotesivuilla ei Product schemaa."},
    "priceVisible": {"status": "pass", "note": "Hinnat näkyvillä selkeästi."},
    "buyButton": {"status": "pass", "note": "Ostopainike löytyy."},
    "reviewSignals": {"status": "fail", "note": "Ei asiakasarvosteluita näkyvillä."}
  },
  "blogSpecific": null
}

For blog sites set ecommerceSpecific to null and fill blogSpecific:
{
  "blogSpecific": {
    "contentLength": {"status": "warn", "note": "Artikkelit melko lyhyitä."},
    "questionHeadings": {"status": "fail", "note": "Ei kysymysmuotoisia otsikoita."},
    "authorBio": {"status": "fail", "note": "Kirjoittajan tiedot puuttuvat."},
    "freshness": {"status": "pass", "note": "Tuoretta sisältöä säännöllisesti."}
  }
}

Analyze the actual crawled content. Be specific and reference real content. Status must be exactly "pass", "warn", or "fail".`;

app.post("/api/site-audit", async (req, res) => {
  let { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL required" });
  if (!url.startsWith("http")) url = "https://" + url;

  try {
    const baseUrl = new URL(url).origin;

    // Fetch homepage
    const homeHtml = await fetchPage(baseUrl);
    const homeMeta = extractMeta(homeHtml);
    const homeText = parseHtml(homeHtml);
    const links = extractLinks(homeHtml, baseUrl);

    // Fetch up to 3 subpages
    const subpages = [];
    for (const link of links.slice(0, 3)) {
      try {
        const html = await fetchPage(link);
        subpages.push({
          url: link,
          text: parseHtml(html).slice(0, 800),
          meta: extractMeta(html),
        });
      } catch {}
    }

    const context = `Website URL: ${baseUrl}

=== ETUSIVU ===
Title: ${homeMeta.title || "PUUTTUU"}
Meta description: ${homeMeta.metaDesc || "PUUTTUU"}
H1: ${homeMeta.h1s.join(", ") || "PUUTTUU"}
Schema markup: ${homeMeta.hasSchema ? "KYLLÄ" : "EI"}
Open Graph: ${homeMeta.hasOg ? "KYLLÄ" : "EI"}
FAQ-osio: ${homeMeta.hasFaq ? "KYLLÄ" : "EI"}
TL;DR: ${homeMeta.hasTldr ? "KYLLÄ" : "EI"}
Kuvat: ${homeMeta.imgCount} yhteensä, ${homeMeta.imgNoAlt} ilman alt-tekstiä
Arvostelut: ${homeMeta.hasReviews ? "KYLLÄ" : "EI"}
Hinnat näkyvillä: ${homeMeta.hasPrice ? "KYLLÄ" : "EI"}
Ostopainike: ${homeMeta.hasBuyButton ? "KYLLÄ" : "EI"}

Sisältö:
${homeText}

=== ALASIVUT (${subpages.length} kpl) ===
${subpages.map(p => `URL: ${p.url}
Title: ${p.meta.title}
H1: ${p.meta.h1s.join(", ") || "PUUTTUU"}
Sisältö: ${p.text}`).join("\n---\n")}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        system: AUDIT_PROMPT,
        messages: [{ role: "user", content: context }],
      }),
    });

    const data = await response.json();
    const raw = data.content?.map(b => b.text || "").join("") || "";
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    res.json(parsed);
  } catch (err) {
    console.error("Site audit error:", err.message);
    res.status(500).json({ error: "Analyysi epäonnistui: " + err.message });
  }
});

// ─── Serve frontend ──────────────────────────────────────────────────────────

if (isProd) {
  app.use(express.static(path.join(__dirname, "dist")));
  app.get("/{*splat}", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`SEO Audit server running on port ${PORT}`);
});