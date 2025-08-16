// src/components/Users.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Breadcrumbs from './Breadcrumbs';
import fetchJsonp from '../utils/fetchJsonpHelper';

const HEADING_SRC = '/images/users.png';

function usePopularMusicians() {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    const callback = 'dzcb_' + Math.random().toString(36).slice(2);
    const url = 'https://api.deezer.com/chart/0/artists?limit=5';
    fetchJsonp(url, callback)
      .then((resp) => {
        setArtists(resp.data || []);                    // postavi listu umetnika
      })
      .catch((e) => {
        console.error('Deezer JSONP error', e);
        setError('Could not load popular artists.');    // obradi grešku pri učitavanju
      })
      .finally(() => setLoading(false));               // isključi indikator učitavanja
  }, []);

  return { artists, loading, error };
}

export default function Users() {
  const navigate = useNavigate();
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const {
    artists: popularArtists,
    loading: loadingArtists,
    error:   errorArtists
  } = usePopularMusicians();                           // hook za popularne umetnike

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);                                // prikaži loader
      setError('');                                    // resetuj poruku o grešci
      try {
        const token = sessionStorage.getItem('auth_token');
        if (!token) {                                  // ako nema tokena
          navigate('/auth');                           // preusmeri na login
          return;
        }

        const currentUser = JSON.parse(sessionStorage.getItem('auth_user') || 'null');
        if (currentUser?.role !== 'administrator') {  // ako nije admin
          navigate('/home');                           // preusmeri na home
          return;
        }

        const { data } = await axios.get(
          'http://127.0.0.1:8000/api/buyers',
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setUsers(data.data || data);                   // postavi listu korisnika
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Could not load users. Please try again later.');  // obradi grešku
      } finally {
        setLoading(false);                             // isključi loader
      }
    };

    fetchUsers();
  }, [navigate]);

  if (loading) {
    return (
      <div className="page-container loading-container">
        <div className="loading-content">
          <div className="loader"></div>
          <p>Loading users data…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container error-container">
        <div className="error-content">
          <div className="error-icon">⚠️</div>
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container users-page">
      <div className="content-wrapper">
        <header className="page-header users-header">
          <img src={HEADING_SRC} alt="Users" className="header-image-small" />
        </header>

        <Breadcrumbs />

        <div className="users-content">
          {users.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <h2>No Users Found</h2>
              <p>There are no users registered in the system.</p>
            </div>
          ) : (
            <div className="table-container users-table-container">
              <div className="table-responsive">
                <table className="data-table users-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Registration Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id}>
                        <td>{user.id}</td>
                        <td>
                          <div className="user-name-cell">
                            <span className="user-avatar-small">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                            <span>{user.name}</span>
                          </div>
                        </td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`role-badge role-${user.role}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>
                          {new Date(user.created_at).toLocaleDateString(undefined,{
                            year: 'numeric', month: 'short', day: 'numeric'
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Popular Artists Section */}
        <section className="popular-artists">
          <h2>Top 5 Popular Artists</h2>
          {loadingArtists ? (
            <p>Loading popular artists…</p>
          ) : errorArtists ? (
            <p className="error-text">{errorArtists}</p>
          ) : (
            <div className="table-responsive">
              <table className="data-table artists-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Artist</th>
                  </tr>
                </thead>
                <tbody>
                  {popularArtists.map((a, i) => (
                    <tr key={a.id}>
                      <td>{i + 1}</td>
                      <td className="artist-name-cell">
                        <img
                          src={a.picture_small}
                          alt={a.name}
                          className="artist-avatar"
                        />
                        {a.name}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
