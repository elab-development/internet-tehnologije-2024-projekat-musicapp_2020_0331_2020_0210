import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Breadcrumbs from './Breadcrumbs';

export default function EventDetails() {
  // Izvlačimo ID događaja iz URL-a
  const { id } = useParams();
  // Hook za programatsku navigaciju
  const navigate = useNavigate();
  // Uzimamo token iz sessionStorage
  const token = sessionStorage.getItem('auth_token');

  // Stanja komponente
  const [event, setEvent]         = useState(null);   // podaci o događaju
  const [seats, setSeats]         = useState([]);     // lista sedišta
  const [selected, setSelected]   = useState([]);     // izabrana sedišta
  const [loading, setLoading]     = useState(true);   // indikator učitavanja
  const [reserving, setReserving] = useState(false);  // indikator rezervacije
  const [error, setError]         = useState(null);   // poruka o grešci

  // Funkcija za učitavanje podataka o događaju iz API-ja
  const fetchEventData = useCallback(() => {
    setLoading(true);
    setError('');

    axios
      .get(`http://127.0.0.1:8000/api/events/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        // API vraća podatke ponekad pod data ključem
        const eventData = res.data.data || res.data;
        setEvent(eventData);

        // Ako nema sedišta, fallback na prazan niz
        const eventSeats = Array.isArray(eventData.seats)
          ? eventData.seats
          : [];

        // Osiguravamo da je is_reserved boolean
        const processedSeats = eventSeats.map(seat => ({
          ...seat,
          is_reserved: !!seat.is_reserved,
        }));

        setSeats(processedSeats);
      })
      .catch(err => {
        console.error('Error fetching event data:', err);
        setError(err.message || 'Failed to load event details');
      })
      .finally(() => setLoading(false));
  }, [id, token]);

  // Pozivamo fetch pri mount-u i promeni ID-a
  useEffect(() => {
    fetchEventData();
  }, [fetchEventData]);

  // Prikaz loadera dok čekamo odgovor
  if (loading) {
    return <div className="event-details-loading">Loading…</div>;
  }

  // Prikaz greške ako je došlo do problema
  if (error) {
    return <div className="event-details-error">Error: {error}</div>;
  }

  // Ako nema podataka o događaju, obaveštenje
  if (!event) {
    return <div className="event-details-loading">Event not found.</div>;
  }

  // Grupisanje sedišta po redovima na osnovu pozicije
  const groupedSeats = {};
  seats.forEach(seat => {
    if (!seat.position) return;

    try {
      let rowKey = '';
      let index  = 0;

      // Poseban slučaj za "S"
      if (seat.position === 'S') {
        rowKey = 'Row1';
        index  = 0;
      }
      // Obrada pozicija poput "S1", "S2"...
      else if (seat.position.startsWith('S')) {
        const match = seat.position.match(/\d+/);
        if (!match) return;
        const num = parseInt(match[0], 10);
        if (num <= 18) {
          rowKey = 'Row1';
          index  = num;
        }
        else if (num <= 38) {
          rowKey = 'Row2';
          index  = num - 19;
        }
        else if (num <= 57) {
          rowKey = 'Row3';
          index  = num - 39;
        }
        else {
          const rIdx = Math.floor((num - 1) / 19) + 1;
          rowKey = `Row${rIdx}`;
          index  = (num - 1) % 19;
        }
      } else {
        console.error(`Unrecognized seat position format: ${seat.position}`);
        return;
      }

      // Inicijalizujemo red ako ne postoji
      if (!groupedSeats[rowKey]) {
        groupedSeats[rowKey] = {};
      }
      // Dodajemo sedište u odgovarajuću kolonu
      groupedSeats[rowKey][index] = seat;
    } catch (e) {
      console.error(`Error parsing seat position: ${seat.position}`, e);
    }
  });

  // Sortiranje ključeva redova po broju
  const sortedRows = Object.keys(groupedSeats).sort((a, b) => {
    const aNum = parseInt(a.replace('Row', ''), 10);
    const bNum = parseInt(b.replace('Row', ''), 10);
    return aNum - bNum;
  });

  // Toggle selekcije sedišta
  const toggleSeat = (seatId, isReserved) => {
    if (isReserved) return;
    setSelected(prev =>
      prev.includes(seatId)
        ? prev.filter(x => x !== seatId)
        : [...prev, seatId]
    );
  };

  // Slanje rezervacije na server
  const makeReservation = () => {
    if (!selected.length) return;
    setReserving(true);

    axios
      .post(
        'http://127.0.0.1:8000/api/reservations',
        { event_id: id, seats: selected },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => {
        // Ažuriramo broj rezervisanih karata lokalno
        setEvent(evt => ({
          ...evt,
          tickets_reserved: evt.tickets_reserved + selected.length
        }));
        // Označavamo izabrana sedišta kao rezervisana
        setSeats(all =>
          all.map(s =>
            selected.includes(s.id) ? { ...s, is_reserved: true } : s
          )
        );
        // Resetujemo selekciju
        setSelected([]);
        alert('Reservation created successfully!');
        // Ponovo učitavamo podatke sa servera
        fetchEventData();
      })
      .catch(err => {
        console.error('Reservation error:', err);
        alert('Could not complete reservation. Please try again.');
      })
      .finally(() => setReserving(false));
  };

  return (
    <div className="event-details-container">
      {/* Wrapper za glavni sadržaj */}
      <div className="event-details-content">
        {/* Header sa naslovnom slikom događaja */}
        <div className="event-details-header">
          <img
            src="/images/event.png"
            alt="Event"
            className="event-details-header-img"
          />
        </div>

        {/* Navigacioni breadcrumbs */}
        <Breadcrumbs />

        {/* Grid raspored sekcija */}
        <div className="event-details-grid">
          {/* Sekcija osnovnih informacija */}
          <div className="grid-item event-info-section">
            <h2 className="grid-section-title">Event Title</h2>
            <h3 className="event-title">{event.title || 'No title available'}</h3>

            <h2 className="grid-section-title">Description</h2>
            <p className="event-description">{event.description || 'No description available'}</p>

            <div className="event-meta">
              <div className="event-date-time">
                <h2 className="grid-section-title">Starts at – Ends at</h2>
                <div className="event-time-value">
                  {event.starts_at && event.ends_at
                    ? `${new Date(event.starts_at).toLocaleString()} – ${new Date(event.ends_at).toLocaleString()}`
                    : 'Date information not available'}
                </div>
              </div>

              <div className="event-tickets-info">
                <h2 className="grid-section-title">Reserved / Capacity</h2>
                <div className="tickets-count">
                  {typeof event.tickets_reserved !== 'undefined' &&
                  typeof event.tickets_capacity  !== 'undefined'
                    ? `${event.tickets_reserved} / ${event.tickets_capacity}`
                    : 'Ticket information not available'}
                </div>
              </div>
            </div>
          </div>

          {/* Sekcija autora */}
          <div className="grid-item author-section">
            {event.author ? (
              <>
                <div className="author-image-container">
                  {event.author.image_url ? (
                    <img
                      src={event.author.image_url}
                      alt={event.author.name}
                      className="author-image"
                    />
                  ) : (
                    <div className="author-image-placeholder">Author image not available</div>
                  )}
                </div>
                <h2 className="author-name">{event.author.name || 'Unknown Author'}</h2>
                <div className="author-genre">{event.author.music_genre || 'Genre not specified'}</div>
              </>
            ) : (
              <div className="missing-data">Author information not available</div>
            )}
          </div>

          {/* Sekcija mesta održavanja */}
          <div className="grid-item venue-section">
            {event.venue ? (
              <>
                <div className="venue-image-container">
                  {event.venue.image_url ? (
                    <img
                      src={event.venue.image_url}
                      alt={event.venue.name}
                      className="venue-image"
                    />
                  ) : (
                    <div className="venue-image-placeholder">Venue image not available</div>
                  )}
                </div>
                <div className="venue-details">
                  <h2 className="venue-name">{event.venue.name || 'Unknown Venue'}</h2>
                  <div className="venue-address">
                    {event.venue.address && event.venue.city && event.venue.country
                      ? `${event.venue.address}, ${event.venue.city}, ${event.venue.country}`
                      : 'Address information not available'}
                  </div>
                  <div className="venue-capacity">Capacity: {event.venue.capacity_people || 'Not specified'}</div>
                </div>
              </>
            ) : (
              <div className="missing-data">Venue information not available</div>
            )}
          </div>

          {/* Sekcija menadžera */}
          <div className="grid-item manager-section">
            {event.manager ? (
              <>
                <div className="manager-image-container">
                  {event.manager.image_url ? (
                    <img
                      src={event.manager.image_url}
                      alt={event.manager.name}
                      className="manager-image"
                    />
                  ) : (
                    <div className="manager-image-placeholder">Manager image not available</div>
                  )}
                </div>
                <h2 className="manager-name">{event.manager.name || 'Unknown Manager'}</h2>
                <div className="manager-email">{event.manager.email || 'Email not available'}</div>
                <div className="manager-address">{event.manager.address || 'Address not available'}</div>
                <div className="manager-phone">{event.manager.phone || 'Phone not available'}</div>
              </>
            ) : (
              <div className="missing-data">Manager information not available</div>
            )}
          </div>

          {/* Sekcija izbora sedišta */}
          <div className="grid-item seat-selection-section">
            <h2 className="section-title">Select a Seat</h2>

            {/* Legenda za boje sedišta */}
            <div className="seat-legend">
              <div className="legend-item">
                <span className="seat-box reserved"></span>
                <span>reserved ({seats.filter(s => s.is_reserved).length})</span>
              </div>
              <div className="legend-item">
                <span className="seat-box free"></span>
                <span>free ({seats.filter(s => !s.is_reserved).length})</span>
              </div>
              <div className="legend-item">
                <span className="seat-box selected"></span>
                <span>selected ({selected.length})</span>
              </div>
            </div>

            {/* Prikaz broja izabranih */}
            <div className="selected-count">
              Selected seats: {selected.length}
            </div>

            {/* Raspored sedišta u sali */}
            <div className="theater-container">
              {seats.length > 0 ? (
                <div className="theater-layout">
                  {sortedRows.map(rowKey => (
                    <div key={rowKey} className={`theater-row ${rowKey}`}>
                      {/* Oznaka reda */}
                      <div className="row-label">{rowKey.replace('Row','Row ')}</div>
                      {Object.entries(groupedSeats[rowKey])
                        .sort((a,b)=>parseInt(a[0])-parseInt(b[0]))
                        .map(([col,seat])=>{
                          const status = seat.is_reserved
                            ? 'reserved'
                            : selected.includes(seat.id)
                            ? 'selected'
                            : 'free';
                          return (
                            <div
                              key={seat.id}
                              className={`theater-seat ${status}`}
                              title={`Seat ${seat.position}${seat.is_reserved?' (Reserved)':''}`}
                              onClick={()=>toggleSeat(seat.id,seat.is_reserved)}
                            >
                              <span className="seat-label">{seat.position}</span>
                            </div>
                          );
                        })}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-seats-message">No seats available for this event</div>
              )}
              {/* Scena */}
              <div className="stage">Stage</div>
            </div>

            {/* Dugmad za rezervaciju i otkazivanje */}
            <div className="reservation-actions">
              <button
                className="reserve-button"
                onClick={makeReservation}
                disabled={!selected.length || reserving}
              >
                {reserving
                  ? 'Reserving…'
                  : `Reserve ${selected.length} seat${selected.length!==1?'s':''}`}
              </button>
              <button className="cancel-button" onClick={()=>navigate(-1)}>
                Cancel
              </button>
            </div>

            {/* Fiksni button za mobilni prikaz */}
            <div className="mobile-reservation-action">
              <button
                className="make-reservation-button"
                onClick={makeReservation}
                disabled={!selected.length || reserving}
              >
                {`Reserve (${selected.length})`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
