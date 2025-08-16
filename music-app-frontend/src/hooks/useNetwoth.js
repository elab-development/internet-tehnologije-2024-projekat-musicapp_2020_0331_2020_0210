import { useEffect, useMemo, useState } from "react";

/**
 * Free, no-key Wikidata endpoints:
 * - Search entity by name: action=wbsearchentities
 * - Get entity claims (P2218 = net worth): action=wbgetentities
 * Add `origin=*` for browser CORS. Docs: API Cross-site requests & Wikibase API.
 * Sources: P2218 net worth property; API docs. 
 */

const WD_API = "https://www.wikidata.org/w/api.php";

// Common currency QIDs -> code/symbol (kept tiny; others resolved by label)
const CURRENCY_QID_MAP = {
  Q4917: { code: "USD", symbol: "$" },  // United States dollar
  Q4916: { code: "EUR", symbol: "€" },  // Euro
  Q25224:{ code: "GBP", symbol: "£" },  // Pound sterling
  Q8146: { code: "JPY", symbol: "¥" },  // Yen
};

const MUSICIAN_HINTS = ["singer","musician","rapper","songwriter","record producer","DJ","composer","rock band","pop singer"];

// ---- helpers ---------------------------------------------------------------

const qs = (params) =>
  Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

async function wdFetch(params, { signal } = {}) {
  const url = `${WD_API}?${qs({ format: "json", origin: "*", ...params })}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Wikidata HTTP ${res.status}`);
  return res.json();
}

/** Find the best QID for a name (bias toward musicians). */
async function findQidByName(name, signal) {
  const data = await wdFetch(
    {
      action: "wbsearchentities",
      search: name,
      language: "en",
      type: "item",
      limit: 10,
    },
    { signal }
  );

  if (!data?.search?.length) return null;

  // rank by musician-y descriptions first, then by match score
  const ranked = [...data.search].sort((a, b) => {
    const aHit = MUSICIAN_HINTS.some((k) =>
      (a.description || "").toLowerCase().includes(k)
    );
    const bHit = MUSICIAN_HINTS.some((k) =>
      (b.description || "").toLowerCase().includes(k)
    );
    if (aHit !== bHit) return aHit ? -1 : 1;
    return (b.match?.score || 0) - (a.match?.score || 0);
  });

  return ranked[0]?.id || null;
}

/** Choose best statement: prefer 'preferred' rank then latest P585 (point in time). */
function pickBestNetWorthClaim(claims = []) {
  const rankScore = (r) => (r === "preferred" ? 2 : r === "normal" ? 1 : 0);

  return [...claims]
    .filter((c) => c?.mainsnak?.datavalue?.value?.amount)
    .sort((a, b) => {
      // rank first
      const rs = rankScore(b.rank) - rankScore(a.rank);
      if (rs !== 0) return rs;

      const tA =
        a?.qualifiers?.P585?.[0]?.datavalue?.value?.time ??
        "0000-00-00T00:00:00Z";
      const tB =
        b?.qualifiers?.P585?.[0]?.datavalue?.value?.time ??
        "0000-00-00T00:00:00Z";
      return tB.localeCompare(tA);
    })[0];
}

/** Fetch currency label (and try to extract a 3-letter code from aliases). */
async function getCurrencyMeta(unitQid, signal) {
  if (!unitQid) return { currencyLabel: null, currencyCode: null, symbol: "" };

  if (CURRENCY_QID_MAP[unitQid]) return CURRENCY_QID_MAP[unitQid];

  const j = await wdFetch(
    {
      action: "wbgetentities",
      ids: unitQid,
      props: "labels|aliases",
      languages: "en",
    },
    { signal }
  );

  const ent = j?.entities?.[unitQid];
  const label = ent?.labels?.en?.value || null;

  // First alias that looks like a 3-letter ISO code
  const aliases = ent?.aliases?.en || [];
  const iso = aliases
    .map((a) => a.value)
    .find((s) => /^[A-Z]{3}$/.test(s));
  // Try to get a symbol from aliases like "$" or "£"
  const sym = aliases
    .map((a) => a.value)
    .find((s) => /^[^\w\s]$/.test(s)) || "";

  return { currencyLabel: label, currencyCode: iso || null, symbol: sym || "" };
}

/** Pull P2218 (net worth) for a QID. */
async function fetchNetWorthByQid(qid, signal) {
  const j = await wdFetch(
    { action: "wbgetentities", ids: qid, props: "claims" },
    { signal }
  );

  const claims = j?.entities?.[qid]?.claims?.P2218 || [];
  const best = pickBestNetWorthClaim(claims);
  if (!best) return null;

  const snak = best.mainsnak.datavalue.value; // { amount: "+150000000", unit: "http://www.wikidata.org/entity/Q4917" }
  const rawAmount = parseFloat(String(snak.amount || "0").replace("+", ""));
  const unitUri = snak.unit || "";
  const unitQid = unitUri.split("/").pop(); // "Q4917"

  let asOf = null;
  const t = best?.qualifiers?.P585?.[0]?.datavalue?.value?.time;
  if (t) {
    // Wikidata time like +2019-00-00T00:00:00Z -> keep year only if month/day 00
    const m = /^\+?(\d{4})-(\d{2})-(\d{2})/.exec(t);
    if (m) {
      asOf =
        m[2] === "00" ? m[1] : m[3] === "00" ? `${m[1]}-${m[2]}` : m[0].replace("+", "");
    }
  }

  const cur = await getCurrencyMeta(unitQid, signal);
  return {
    amount: rawAmount,
    currencyCode: cur.code || cur.currencyCode || null,
    currencyLabel: cur.currencyLabel || null,
    symbol: cur.symbol || (cur.code === "USD" ? "$" : ""),
    asOf,
    qid,
    source: "Wikidata",
  };
}

function currencySymbol(code, label) {
  if (code && CURRENCY_QID_MAP) {
    const sym =
      Object.values(CURRENCY_QID_MAP).find((v) => v.code === code)?.symbol ||
      null;
    if (sym) return sym;
  }
  // Basic fallbacks
  if (code === "USD") return "$";
  if (code === "EUR") return "€";
  if (code === "GBP") return "£";
  if (code === "JPY") return "¥";
  // Last resort: nothing
  return code || "";
}

// ---- hook -------------------------------------------------------------------

export default function useNetworth(name) {
  const [state, setState] = useState({ loading: false, data: null, error: null });

  useEffect(() => {
    const query = (name || "").trim();
    if (!query) {
      setState({ loading: false, data: null, error: null });
      return;
    }
    const ctrl = new AbortController();

    (async () => {
      try {
        setState({ loading: true, data: null, error: null });

        const qid = await findQidByName(query, ctrl.signal);
        if (!qid) {
          setState({ loading: false, data: null, error: `No Wikidata item found for "${query}".` });
          return;
        }

        const net = await fetchNetWorthByQid(qid, ctrl.signal);
        if (!net) {
          setState({ loading: false, data: null, error: `No net worth (P2218) found for "${query}".` });
          return;
        }

        setState({ loading: false, data: net, error: null });
      } catch (e) {
        if (e.name !== "AbortError") {
          setState({ loading: false, data: null, error: e.message || "Failed to fetch net worth." });
        }
      }
    })();

    return () => ctrl.abort();
  }, [name]);

  const formatted = useMemo(() => {
    const d = state.data;
    if (!d?.amount) return null;

    const nf = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
    const sym = d.symbol || currencySymbol(d.currencyCode, d.currencyLabel);

    // Prefer symbol; if unknown, fall back to code or label
    const cur = sym || d.currencyCode || d.currencyLabel || "";
    const value = nf.format(d.amount);

    return {
      text: cur ? `${cur}${sym ? "" : " "}${value}` : value,
      amount: d.amount,
      currencyCode: d.currencyCode || null,
      currencyLabel: d.currencyLabel || null,
      asOf: d.asOf || null,
      qid: d.qid,
      source: d.source,
    };
  }, [state.data]);

  return { ...state, formatted };
}
