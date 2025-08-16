import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Breadcrumbs from './Breadcrumbs';

// slika zaglavlja (u public/images/my-events.png)
const HEADING_SRC = '/images/my-events.png';

// komponenta kartice za event menadžera (bez dugmeta za detalje)
const ManagerEventCard = ({ event, onDelete }) => {
  const {
    image_url,
    title,
    venue,
    author,
    starts_at,
    ends_at,
  } = event;

  // formatiramo ISO datum za prikaz
  const formatDate = (iso) =>
    new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

  return (
    <div className="card">
      <div className="card-image">
        <img src={image_url} alt={title} />
      </div>
      <div className="card-body">
        <h3 className="card-title">{title}</h3>
        <p className="card-venue">
          {venue.address}, {venue.city}, {venue.country}
        </p>
        <p className="card-author">
          {author.name}, {author.music_genre}
        </p>
        <p className="card-dates">
          {formatDate(starts_at)} – {formatDate(ends_at)}
        </p>
        <div className="card-actions">
          <button
            className="card-button delete-button full-width"
            onClick={() => onDelete(event.id)}
          >
            Delete Event
          </button>
        </div>
      </div>
    </div>
  );
};

// modal za kreiranje novog događaja
const CreateEventModal = ({
  isOpen,
  onClose,
  onCreate,
  venues,
  authors,
  isLoadingOptions
}) => {
  // stanja forme
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    starts_at: '',
    ends_at: '',
    venue_id: '',
    author_id: '',
    tickets_capacity: 50
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // ako modal nije otvoren, ništa ne renderujemo
  if (!isOpen) return null;

  // handler za promenu input polja
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // validacija i slanje forme
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');

    if (!formData.tickets_capacity || formData.tickets_capacity < 1) {
      setFormError('Tickets capacity is required and must be at least 1');
      setIsSubmitting(false);
      return;
    }

    try {
      await onCreate(formData);
      // resetujemo formu i zatvaramo modal
      setFormData({
        title: '',
        description: '',
        image_url: '',
        starts_at: '',
        ends_at: '',
        venue_id: '',
        author_id: '',
        tickets_capacity: 50
      });
      onClose();
    } catch (err) {
      console.error('Error creating event:', err);
      setFormError('Failed to create event. Please check your inputs and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // formatiramo datum za input type="datetime-local"
  const formatDateForInput = (date) =>
    date ? new Date(date).toISOString().slice(0, 16) : '';

  // zatvaramo modal klikom van sadržaja
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Create New Event</h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        {formError && <div className="form-error">{formError}</div>}

        <form onSubmit={handleSubmit} className="create-event-form">
          {/* polja za title, description, image_url */}
          <div className="form-group">
            <label htmlFor="title">
              Event Title <span className="required-field">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Enter event title"
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">
              Description <span className="required-field">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              required
              placeholder="Describe your event"
            />
          </div>
          <div className="form-group">
            <label htmlFor="image_url">
              Image URL <span className="required-field">*</span>
            </label>
            <input
              id="image_url"
              name="image_url"
              type="url"
              value={formData.image_url}
              onChange={handleChange}
              required
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {/* polja za start/end datetime */}
          <div className="form-row">
            <div className="form-group half">
              <label htmlFor="starts_at">
                Start Date/Time <span className="required-field">*</span>
              </label>
              <input
                id="starts_at"
                name="starts_at"
                type="datetime-local"
                value={formatDateForInput(formData.starts_at)}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group half">
              <label htmlFor="ends_at">
                End Date/Time <span className="required-field">*</span>
              </label>
              <input
                id="ends_at"
                name="ends_at"
                type="datetime-local"
                value={formatDateForInput(formData.ends_at)}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* select za venue i author */}
          <div className="form-group">
            <label htmlFor="venue_id">
              Venue <span className="required-field">*</span>
            </label>
            <select
              id="venue_id"
              name="venue_id"
              value={formData.venue_id}
              onChange={handleChange}
              required
              disabled={isLoadingOptions}
            >
              {isLoadingOptions ? (
                <option>Loading venues...</option>
              ) : (
                <>
                  <option value="">Select a venue</option>
                  {venues.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name} - {v.address}, {v.city}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="author_id">
              Artist/Author <span className="required-field">*</span>
            </label>
            <select
              id="author_id"
              name="author_id"
              value={formData.author_id}
              onChange={handleChange}
              required
              disabled={isLoadingOptions}
            >
              {isLoadingOptions ? (
                <option>Loading artists...</option>
              ) : (
                <>
                  <option value="">Select an artist</option>
                  {authors.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} - {a.music_genre}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          {/* polje za tickets capacity */}
          <div className="form-group">
            <label htmlFor="tickets_capacity">
              Tickets Capacity <span className="required-field">*</span>
            </label>
            <input
              id="tickets_capacity"
              name="tickets_capacity"
              type="number"
              min="1"
              max="1000"
              value={formData.tickets_capacity}
              onChange={handleChange}
              required
            />
            <small className="field-hint">
              Required - Enter the total number of tickets available for this event
            </small>
          </div>

          {/* dugmad za cancel i submit */}
          <div className="form-actions">
            <button
              type="button"
              className="cancel-form-btn"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-form-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function MyEvents() {
  // hook za navigaciju
  const navigate = useNavigate();
  // stanja komponente
  const [events, setEvents]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [venues, setVenues]     = useState([]);
  const [authors, setAuthors]   = useState([]);
  const [fetchingOptions, setFetchingOptions] = useState(false);

  // učitavanje događaja menadžera
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const token = sessionStorage.getItem('auth_token');
      if (!token) {
        navigate('/auth');
        return;
      }
      const user = JSON.parse(sessionStorage.getItem('auth_user') || 'null');
      if (user?.role !== 'event_manager') {
        navigate('/home');
        return;
      }

      const { data } = await axios.get(
        'http://127.0.0.1:8000/api/events/my',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEvents(data.data || data);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Could not load your events. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // efekt za inicijalno učitavanje
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // učitavanje opcija za modal (venues i authors)
  const fetchOptionsForModal = async () => {
    setFetchingOptions(true);
    try {
      const token = sessionStorage.getItem('auth_token');

      const venuesRes = await axios.get(
        'http://127.0.0.1:8000/api/venues',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setVenues(venuesRes.data.data || venuesRes.data);

      const authorsRes = await axios.get(
        'http://127.0.0.1:8000/api/authors',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAuthors(authorsRes.data.data || authorsRes.data);
    } catch (err) {
      console.error('Error fetching modal options:', err);
      alert(`Could not load venues and artists. Error: ${err.message}`);
      setIsModalOpen(false);
    } finally {
      setFetchingOptions(false);
    }
  };

  // otvaranje modala i učitavanje opcija
  const handleCreateEvent = () => {
    setIsModalOpen(true);
    fetchOptionsForModal();
  };

  // zatvaranje modala
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // kreiranje događaja i sedišta
  const handleCreateEventSubmit = async (formData) => {
    const token = sessionStorage.getItem('auth_token');
    try {
      // kreiramo event
      const response = await axios.post(
        'http://127.0.0.1:8000/api/events',
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const eventId = response.data.data.id;

      // generišemo niz sedišta prema kapacitetu
      const seats = [];
      const total = formData.tickets_capacity;
      let count = 0;
      const row1 = ['S','S1','S2','S3','S4','S5','S6','S7','S8','S9','S10','S11','S12','S13','S14','S15','S16','S17','S18'];
      for (let i=0; i<Math.min(19,total); i++) {
        seats.push({ position: row1[i], is_reserved: false });
        count++;
      }
      for (let i=19; i<Math.min(38,total); i++) {
        seats.push({ position: `S${i}`, is_reserved: false });
        count++;
      }
      for (let i=39; i<Math.min(58,total); i++) {
        seats.push({ position: `S${i}`, is_reserved: false });
        count++;
      }
      let next = 58;
      while (count < total) {
        seats.push({ position: `S${next}`, is_reserved: false });
        next++; count++;
      }

      // šaljemo zahtev za kreiranje sedišta
      await axios.post(
        `http://127.0.0.1:8000/api/events/${eventId}/seats`,
        { seats },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // osvežavamo listu događaja
      fetchEvents();
    } catch (err) {
      console.error('Error creating event or seats:', err);
      alert('Failed to create event or seats. Please try again.');
    }
  };

  // brisanje događaja
  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      const token = sessionStorage.getItem('auth_token');
      await axios.delete(
        `http://127.0.0.1:8000/api/events/${eventId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEvents(events.filter(e => e.id !== eventId));
    } catch (err) {
      console.error('Error deleting event:', err);
      alert('Failed to delete the event. Please try again.');
    }
  };

  // prikaz loadera ili greške
  if (loading) return <div className="events-loading">Loading…</div>;
  if (error)   return <div className="events-error">{error}</div>;

  return (
    <div className="events-page my-events-page">
      {/* zaglavlje sa slikom */}
      <header className="events-header">
        <img src={HEADING_SRC} alt="My Events" />
      </header>

      {/* navigacioni breadcrumbs */}
      <Breadcrumbs />

      {/* dugme za otvaranje modala */}
      <div className="events-controls">
        <button className="create-event-btn" onClick={handleCreateEvent}>
          Create New Event
        </button>
      </div>

      {/* prikaz poruke ako nema događaja */}
      {events.length === 0 ? (
        <div className="no-events">
          <p>You haven't created any events yet.</p>
          <button onClick={handleCreateEvent}>Create Your First Event</button>
        </div>
      ) : (
        <div className="events-grid">
          {events.map(event => (
            <ManagerEventCard
              key={event.id}
              event={event}
              onDelete={handleDeleteEvent}
            />
          ))}
        </div>
      )}

      {/* modal za kreiranje događaja */}
      <CreateEventModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onCreate={handleCreateEventSubmit}
        venues={venues}
        authors={authors}
        isLoadingOptions={fetchingOptions}
      />
    </div>
  );
}
