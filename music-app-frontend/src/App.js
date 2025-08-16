import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation
} from 'react-router-dom';
import Auth    from './components/Auth';
import Home    from './components/Home';
import Menu    from './components/Menu';
import Loading from './components/Loading';
import Footer  from './components/Footer';
import Events  from './components/Events';
import Event   from './components/EventDetails';
import MyReservations from './components/MyReservations';
import MyEvents        from './components/MyEvents';
import ReservationsForMyEvents from './components/ReservationsForMyEvents';
import Users   from './components/Users';
import Analytics from "./components/Analytics";
import './App.css';

function App() {
  // omotavanje cele aplikacije u Router kako bismo mogli koristiti rute
  return (
    <Router>
      <AppWithLoading />
    </Router>
  );
}

function AppWithLoading() {
  // stanje za prikaz/loading overlay
  const [loading, setLoading] = useState(false);
  // hook za praćenje promene puta (lokacije)
  const location = useLocation();

  // provera da li je korisnik ulogovan na svako renderovanje
  const isLoggedIn      = Boolean(sessionStorage.getItem('auth_token'));
  const user            = JSON.parse(sessionStorage.getItem('auth_user') || 'null');
  const isEventManager  = user?.role === 'event_manager';
  const isAdministrator = user?.role === 'administrator';

  // efekat koji pali loading overlay pri svakoj promeni rute
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(timer);
  }, [location]);

  // dok je loading=true, prikazujemo komponentu Loading
  if (loading) {
    return <Loading />;
  }

  return (
    <>
      {/* prikaz menija samo ako je korisnik ulogovan */}
      {isLoggedIn && <Menu />}

      <Routes>
        {/* preusmeravanje korena na /auth */}
        <Route path="/" element={<Navigate to="/auth" replace />} />

        {/* stranica za prijavu/registraciju */}
        <Route path="/auth" element={<Auth />} />

        {/* /home ruta, dostupna samo ako je korisnik ulogovan */}
        <Route
          path="/home"
          element={
            isLoggedIn
              ? <Home />
              : <Navigate to="/auth" replace />
          }
        />

        {/* javne rute za pregled svih događaja */}
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<Event />} />

        {/* rezervacije krajnjeg korisnika */}
        <Route
          path="/my-reservations"
          element={
            isLoggedIn
              ? <MyReservations />
              : <Navigate to="/auth" replace />
          }
        />

        {/* administratorske rute */}
        <Route
          path="/users"
          element={
            isLoggedIn && isAdministrator
              ? <Users />
              : <Navigate to="/auth" replace />
          }
        />

        {/* menadžerske rute */}
        <Route
          path="/my-events"
          element={
            isLoggedIn && isEventManager
              ? <MyEvents />
              : <Navigate to="/auth" replace />
          }
        />
        <Route
          path="/reservations-for-my-events"
          element={
            isLoggedIn && isEventManager
              ? <ReservationsForMyEvents />
              : <Navigate to="/auth" replace />
          }
        />

        <Route path="/analytics" element={   isLoggedIn && isAdministrator
              ? <Analytics /> : <Navigate to="/auth" replace />} />
      </Routes>

      {/* footer se prikazuje samo ako je korisnik ulogovan */}
      {isLoggedIn && <Footer />}
    </>
  );
}

export default App;
