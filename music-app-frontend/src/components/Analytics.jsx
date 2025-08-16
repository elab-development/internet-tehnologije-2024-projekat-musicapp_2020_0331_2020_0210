import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell
} from "recharts";
import useNetworth from "../hooks/useNetwoth";

const HEADING_SRC = "/images/Analytics.png";

const API_BASE = import.meta?.env?.VITE_API_URL || "http://127.0.0.1:8000/api";
const api = axios.create({ baseURL: API_BASE });
api.interceptors.request.use((cfg) => {
  const t = sessionStorage.getItem("auth_token");
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

// Small card that uses the hook for a single artist
function NetworthCard({ name }) {
  const { loading, error, formatted } = useNetworth(name);

  return (
    <div className="nw-card" title={formatted?.asOf ? `as of ${formatted.asOf}` : ""}>
      <div className="nw-name">{name}</div>

      {loading && <div className="nw-status">Loading…</div>}
      {!loading && error && <div className="nw-error">{error}</div>}
      {!loading && !error && formatted && (
        <>
          <div className="nw-value">{formatted.text}</div>
          <div className="nw-meta">
            {formatted.asOf ? `as of ${formatted.asOf}` : "as of —"}
            <span className="nw-source"> • Source: Wikidata</span>
          </div>
        </>
      )}
      {!loading && !error && !formatted && <div className="nw-status">No data</div>}
    </div>
  );
}

export default function Analytics() {
  const [perDay, setPerDay] = useState([]);
  const [byStatus, setByStatus] = useState([]);
  const [loading, setLoading] = useState(true);

  // Net worth UI state
  const [artistsInput, setArtistsInput] = useState("Taylor Swift, Drake, Beyoncé");
  const [artists, setArtists] = useState(["Taylor Swift", "Drake", "Beyoncé"]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get("/reservations/analytics");
        const data = res.data || {};
        if (!mounted) return;
        setPerDay(Array.isArray(data.per_day) ? data.per_day : []);
        setByStatus(Array.isArray(data.by_status) ? data.by_status : []);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const totals = useMemo(() => ({
    totalDays: perDay.length,
    totalReservations: perDay.reduce((a, b) => a + (Number(b.count) || 0), 0),
    statuses: byStatus.length,
  }), [perDay, byStatus]);

  const statusFill = (status) => {
    const s = String(status || "").toLowerCase();
    if (s.includes("confirm")) return "var(--status-confirmed)";
    if (s.includes("pend"))    return "var(--status-pending)";
    if (s.includes("cancel"))  return "var(--status-cancelled)";
    return "var(--primary)";
  };

  const submitArtists = (e) => {
    e.preventDefault();
    const list = artistsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    setArtists(list);
  };

  return (
    <div className="analytics-page">
      <header className="events-header">
        <img src={HEADING_SRC} alt="Analytics" />
      </header>

      <div className="analytics-header">
        <div>
          <h1 className="analytics-title">Reservations Analytics</h1>
          <div className="analytics-sub">Trends and distribution for reservations</div>
          <div className="analytics-chips">
            <span className="analytics-chip">Days: {totals.totalDays}</span>
            <span className="analytics-chip">Reservations: {totals.totalReservations}</span>
            <span className="analytics-chip">Statuses: {totals.statuses}</span>
          </div>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="analytics-card">
          <div className="analytics-card-title">Reservations per Day</div>
          <div className="analytics-chart">
            <ResponsiveContainer>
              <LineChart data={perDay}>
                <CartesianGrid stroke="var(--grid)" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: "var(--subtle)" }} />
                <YAxis allowDecimals={false} tick={{ fill: "var(--subtle)" }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="var(--primary-dark)"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card-title">Reservations by Status</div>
          <div className="analytics-chart">
            <ResponsiveContainer>
              <BarChart data={byStatus}>
                <CartesianGrid stroke="var(--grid)" strokeDasharray="3 3" />
                <XAxis dataKey="status" tick={{ fill: "var(--subtle)" }} />
                <YAxis allowDecimals={false} tick={{ fill: "var(--subtle)" }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Count" radius={[6,6,0,0]}>
                  {byStatus.map((row, i) => (
                    <Cell key={i} fill={statusFill(row.status)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Net worth section */}
      <section className="nw-section">
        <h2 className="nw-title">Artist Net Worth (free Wikidata)</h2>

        <form className="nw-form" onSubmit={submitArtists}>
          <input
            className="nw-input"
            type="text"
            value={artistsInput}
            onChange={(e) => setArtistsInput(e.target.value)}
            placeholder="Type artist names, separated by commas…"
          />
          <button className="nw-button" type="submit">Fetch</button>
        </form>

        <div className="nw-grid">
          {artists.map((name) => (
            <NetworthCard key={name} name={name} />
          ))}
        </div>
      </section>

      {loading && <div className="analytics-loading">Loading…</div>}
    </div>
  );
}
