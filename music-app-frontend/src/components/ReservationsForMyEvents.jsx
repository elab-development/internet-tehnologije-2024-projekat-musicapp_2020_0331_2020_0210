import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Breadcrumbs from './Breadcrumbs';

// slika zaglavlja iz public/images/reservations-for-my-events.png
const HEADING_SRC = '/images/reservations-for-my-events.png';

export default function ReservationsForMyEvents() {
  // hook za navigaciju između ruta
  const navigate = useNavigate();
  // stanja komponente
  const [reservations, setReservations] = useState([]); // lista rezervacija za događaje koje menadžer upravlja
  const [loading, setLoading] = useState(true);         // indikator učitavanja podataka
  const [error, setError] = useState('');               // poruka o grešci pri učitavanju
  const [updateLoading, setUpdateLoading] = useState(false); // indikator izmene statusa rezervacije

  // efekt koji pri mount-u i promeni navigate poziva API
  useEffect(() => {
    const fetchReservations = async () => {
      setLoading(true);
      setError('');

      try {
        const token = sessionStorage.getItem('auth_token');
        // ako nema tokena, vrati na stranicu za prijavu
        if (!token) {
          navigate('/auth');
          return;
        }

        // proveravamo da li je uloga event_manager
        const user = JSON.parse(sessionStorage.getItem('auth_user') || 'null');
        if (user?.role !== 'event_manager') {
          navigate('/home');
          return;
        }

        // GET zahtev za rezervacije na događajima koje menadžer upravlja
        const { data } = await axios.get(
          'http://127.0.0.1:8000/api/reservations/events',
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // postavljamo povratne podatke u state
        setReservations(data.data || data);
      } catch (err) {
        console.error('Error fetching reservations:', err);
        setError('Could not load reservations. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, [navigate]);

  // helper koji određuje CSS klasu u zavisnosti od statusa rezervacije
  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'status-confirmed';
      case 'pending':   return 'status-pending';
      case 'cancelled': return 'status-cancelled';
      default:          return '';
    }
  };

  // funkcija za ažuriranje statusa rezervacije na serveru i u lokalnom stanju
  const updateReservationStatus = async (reservationId, newStatus) => {
    setUpdateLoading(true);

    try {
      const token = sessionStorage.getItem('auth_token');
      await axios.patch(
        `http://127.0.0.1:8000/api/reservations/${reservationId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // ažuriramo lokalno stanje sa novim statusom
      setReservations(reservations.map(reservation =>
        reservation.id === reservationId
          ? { ...reservation, status: newStatus }
          : reservation
      ));
    } catch (err) {
      console.error('Error updating reservation status:', err);
      alert('Failed to update reservation status. Please try again.');
    } finally {
      setUpdateLoading(false);
    }
  };

  // prikaz loader-a dok se čeka
  if (loading) return <div className="reservations-loading">Loading…</div>;
  // prikaz greške ako postoji
  if (error)   return <div className="reservations-error">{error}</div>;

  return (
    <div className="my-reservations-page">
      {/* zaglavlje sa slikom */}
      <header className="reservations-header">
        <img src={HEADING_SRC} alt="Reservations For My Events" />
      </header>

      {/* breadcrumbs navigacija */}
      <Breadcrumbs />

      {/* ako nema rezervacija, prikaži poruku i dugme za nazad */}
      {reservations.length === 0 ? (
        <div className="no-reservations">
          <p>There are no reservations for your events yet.</p>
          <button onClick={() => navigate('/my-events')}>
            Manage My Events
          </button>
        </div>
      ) : (
        // prikaz tabele rezervacija
        <div className="reservations-table-container">
          <table className="reservations-table">
            <thead>
              <tr>
                <th>Event Title</th>
                <th>User</th>
                <th>Date</th>
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
                  {/* korisnik koji je rezervisao */}
                  <td>{reservation.user.name}</td>
                  {/* broj i pozicije sedišta */}
                  <td>
                    <div className="seats-container">
                      <span className="seat-count">{reservation.number_of_seats}</span>
                      {reservation.seats && (
                        <div className="seat-details">
                          {reservation.seats.map(seat => seat.position).join(', ')}
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
                  {/* akcije: potvrda ili otkazivanje */}
                  <td>
                    <div className="reservation-actions-container">
                      {reservation.status === 'pending' && (
                        <>
                          <button
                            className="status-btn confirm-btn"
                            onClick={() => updateReservationStatus(reservation.id, 'confirmed')}
                            disabled={updateLoading}
                          >
                            Confirm
                          </button>
                          <button
                            className="status-btn cancel-btn"
                            onClick={() => updateReservationStatus(reservation.id, 'cancelled')}
                            disabled={updateLoading}
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {reservation.status === 'confirmed' && (
                        <button
                          className="status-btn cancel-btn"
                          onClick={() => updateReservationStatus(reservation.id, 'cancelled')}
                          disabled={updateLoading}
                        >
                          Cancel
                        </button>
                      )}
                      {reservation.status === 'cancelled' && (
                        <button
                          className="status-btn confirm-btn"
                          onClick={() => updateReservationStatus(reservation.id, 'confirmed')}
                          disabled={updateLoading}
                        >
                          Reconfirm
                        </button>
                      )}
                    </div>
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
