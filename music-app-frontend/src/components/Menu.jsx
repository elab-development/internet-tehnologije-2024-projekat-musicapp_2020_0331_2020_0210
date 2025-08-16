import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiPower } from 'react-icons/fi';

export default function Menu() {
  // hook za programatsku navigaciju
  const navigate = useNavigate();
  // uzimamo token iz sessionStorage
  const token = sessionStorage.getItem('auth_token');
  // parsiramo info o korisniku iz sessionStorage
  const user  = JSON.parse(sessionStorage.getItem('auth_user') || 'null');
  // flagovi za uloge
  const isEventManager  = user?.role === 'event_manager';
  const isAdministrator = user?.role === 'administrator';

  // logout handler: poziva endpoint, briše session i redirect
  const handleLogout = async () => {
    try {
      await axios.post(
        'http://127.0.0.1:8000/api/logout',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error('Logout failed', err);
    } finally {
      sessionStorage.clear();
      navigate('/auth');
    }
  };

  return (
    <div className="menu-container">
      {/* levi panel: nav linkovi koji se pojavljuju na hover */}
      <div className="menu-left">
        <NavLink to="/home" className="menu-link" style={{ marginLeft: '35px' }}>
          Home
        </NavLink>

        {/* prikaz linkova u zavisnosti od uloge */}
        {isAdministrator ? (
           <>
              <NavLink to="/users" className="menu-link">
                Users
              </NavLink>
              <NavLink to="/analytics" className="menu-link">
                Analytics
              </NavLink>
           </>
        ) : isEventManager ? (
          <>
            <NavLink to="/my-events" className="menu-link">
              My Events
            </NavLink>
            <NavLink to="/reservations-for-my-events" className="menu-link">
              Reservations
            </NavLink>
          </>
        ) : (
          <>
            <NavLink to="/events" className="menu-link">
              Events
            </NavLink>
            <NavLink to="/my-reservations" className="menu-link">
              My Reservations
            </NavLink>
          </>
        )}
      </div>

      {/* centralna ikonica: rotira se na hover */}
      <div className="menu-center">
        <img
          src="/images/musify-icon.png"
          alt="Musify"
          className="center-icon"
        />
      </div>

      {/* desni panel: informacije o korisniku i dugme za logout */}
      <div className="menu-right">
        {user && (
          <div className="user-info">
            <img
              src={user.imageUrl || '/images/default-avatar.png'}
              alt={user.name}
              className="user-avatar"
            />
            <div className="user-details">
              <span className="user-name">{user.name}</span>
              <br />
              <span className="user-role">{user.role}</span>
            </div>
          </div>
        )}
        <button className="logout-btn" onClick={handleLogout}>
          <FiPower size={20} className="logout-icon" />
        </button>
      </div>
    </div>
  );
}
