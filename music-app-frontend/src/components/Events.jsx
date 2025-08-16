import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Card from './Card';
import Breadcrumbs from './Breadcrumbs';

// Slika zaglavlja (u public/images/events.png)
const HEADING_SRC = '/images/events.png';

export default function Events() {
  // Stanja komponente
  const [events, setEvents]   = useState([]);    // lista događaja
  const [loading, setLoading] = useState(true);  // indikator učitavanja
  const [error, setError]     = useState('');    // poruka o grešci
  const [search, setSearch]   = useState('');    // tekst pretrage po naslovu
  const [sortAsc, setSortAsc] = useState(true);  // sortiranje po datumu uzlazno
  const [page, setPage]       = useState(1);     // trenutna stranica
  const pageSize = 4;                            // broj stavki po strani

  // Učitavanje događaja sa servera pri mount‑u
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError('');
      try {
        const token = sessionStorage.getItem('auth_token');
        // proveravamo da li je korisnik ulogovan
        if (!token) {
          setError('You must be logged in to view events');
          setLoading(false);
          return;
        }
        // GET zahtev na API
        const { data } = await axios.get(
          'http://127.0.0.1:8000/api/events',
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          }
        );
        // API može vratiti niz ili objekat sa ključem data
        if (data && (Array.isArray(data) || data.data)) {
          setEvents(Array.isArray(data) ? data : data.data);
        } else {
          console.error('Unexpected response format:', data);
          setError('Server returned invalid data format');
        }
      } catch (err) {
        console.error('Error fetching events:', err);
        if (err.response) {
          // specijalna obrada grešaka po statusu
          if (err.response.status === 401) {
            setError('Unauthorized: session expired, please log in again');
          } else {
            setError(`Failed to load events: ${err.response.data.message || err.message}`);
          }
        } else {
          setError(`Failed to load events: ${err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Filtriranje po naslovu i sortiranje po datumu
  const filtered = events
    .filter(e => e.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const da = new Date(a.starts_at);
      const db = new Date(b.starts_at);
      return sortAsc ? da - db : db - da;
    });

  // Paginacija: izračun broja stranica i podskup za tekuću
  const totalPages = Math.ceil(filtered.length / pageSize);
  const pageData   = filtered.slice(
    (page - 1) * pageSize,
    (page - 1) * pageSize + pageSize
  );

  // Funkcija za prelazak na detalje događaja
  const goToDetails = (id) => {
    // možete koristiti navigate iz react-router-a umesto window.location
    window.location.href = `/events/${id}`;
  };

  // Prikaz loadera ili greške ako je potrebno
  if (loading) return <div className="events-loading">Loading...</div>;
  if (error)   return <div className="events-error">Error: {error}</div>;

  return (
    <div className="events-page">
      {/* Zaglavlje sa slikom */}
      <header className="events-header">
        <img src={HEADING_SRC} alt="Events" />
      </header>

      {/* Breadcrumbs navigacija */}
      <Breadcrumbs />

      {/* Kontrole za pretragu i sortiranje */}
      <div className="events-controls">
        <input
          type="text"
          placeholder="Search by title..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
        <button onClick={() => setSortAsc(!sortAsc)}>
          Sort: {sortAsc ? 'Oldest first' : 'Newest first'}
        </button>
      </div>

      {/* Mreža kartica događaja */}
      <div className="events-grid">
        {pageData.map(ev => (
          <Card
            key={ev.id}
            event={ev}
            onViewDetails={goToDetails}
          />
        ))}
      </div>

      {/* Paginacija */}
      <footer className="events-pagination">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          ← Previous
        </button>
        <span>Page {page} of {totalPages}</span>
        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
        >
          Next →
        </button>
      </footer>
    </div>
  );
}
