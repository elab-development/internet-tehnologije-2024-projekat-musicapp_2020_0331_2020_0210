import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Breadcrumbs from './Breadcrumbs';

// slika zaglavlja iz public/images/my-reservations.png
const HEADING_SRC = '/images/my-reservations.png';

export default function MyReservations() {
  // hook za programatsku navigaciju
  const navigate = useNavigate();
  // stanja komponente: lista rezervacija, loading indikator, poruka o grešci
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // efekt koji pri mount-u učitava korisnikove rezervacije
  useEffect(() => {
    const fetchReservations = async () => {
      setLoading(true);     // uključujemo loader
      setError('');         // resetujemo prethodne greške
      try {
        const token = sessionStorage.getItem('auth_token');
        // ako nema tokena, preusmeri na stranicu za prijavu
        if (!token) {
          navigate('/auth');
          return;
        }

        // GET zahtev za korisnikove rezervacije
        const { data } = await axios.get(
          'http://127.0.0.1:8000/api/reservations/my',
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // API može vratiti niz ili objekat sa ključem data
        setReservations(data.data || data);
      } catch (err) {
        console.error('Error fetching reservations:', err);
        setError('Could not load reservations. Please try again later.');
      } finally {
        setLoading(false);  // isključujemo loader
      }
    };

    fetchReservations();
  }, [navigate]);

  // funkcija koja vraća odgovarajući CSS klasu za status
  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'status-confirmed';
      case 'pending':   return 'status-pending';
      case 'cancelled': return 'status-cancelled';
      default:          return '';
    }
  };

  // navigacija na stranicu događaja
  const viewEvent = (eventId) => {
    navigate(`/events/${eventId}`);
  };

  // prikaz loadera ili greške ako je potrebno
  if (loading) return <div className="reservations-loading">Loading…</div>;
  if (error)   return <div className="reservations-error">Error: {error}</div>;

  return (
    <div className="my-reservations-page">
      {/* zaglavlje sa slikom */}
      <header className="reservations-header">
        <img src={HEADING_SRC} alt="My Reservations" />
      </header>

      {/* navigacioni breadcrumbs */}
      <Breadcrumbs />

      {/* ako nema rezervacija, prikaži obaveštenje i dugme */}
      {reservations.length === 0 ? (
        <div className="no-reservations">
          <p>You don't have any reservations yet.</p>
          <button onClick={() => navigate('/events')}>Browse Events</button>
        </div>
      ) : (
        // prikaz tabele rezervacija
        <div className="reservations-table-container">
          <table className="reservations-table">
            <thead>
              <tr>
                <th>Event Title</th>
                <th>Date</th>
                <th>Venue</th>
                <th>Seats</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map(reservation => (
                <tr key={reservation.id}>
                  {/* naslov događaja */}
                  <td>{reservation.event.title}</td>
                  {/* datum i vreme početka */}
                  <td>
                    {new Date(reservation.event.starts_at).toLocaleDateString()}
                    <div className="time-detail">
                      {new Date(reservation.event.starts_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </td>
                  {/* ime prostora održavanja */}
                  <td>{reservation.event.venue?.name || 'N/A'}</td>
                  {/* broj i pozicije sedišta */}
                  <td>
                    <div className="seats-container">
                      <span className="seat-count">{reservation.number_of_seats}</span>
                      {reservation.seats && (
                        <div className="seat-details">
                          {reservation.seats.map(s => s.position).join(', ')}
                        </div>
                      )}
                    </div>
                  </td>
                  {/* status rezervacije */}
                  <td>
                    <span className={`reservation-status ${getStatusClass(reservation.status)}`}>
                      {reservation.status}
                    </span>
                  </td>
                  {/* dugme za prikaz događaja */}
                  <td>
                    <button
                      className="view-event-btn"
                      onClick={() => viewEvent(reservation.event.id)}
                    >
                      View Event
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
