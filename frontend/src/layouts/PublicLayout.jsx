import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { CalendarDays, LogIn, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function PublicLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  async function handleLogout() {
    closeMenu();
    await logout();
    navigate('/login');
  }

  return (
    <>
      <header className="site-header">
        <Link className="brand" to="/" onClick={closeMenu}>
          <CalendarDays size={24} /> Eventify
        </Link>

        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <nav className={menuOpen ? 'is-open' : ''} aria-label="Main navigation">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMenu}>Home</NavLink>
          <NavLink to="/events" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMenu}>Browse Events</NavLink>

          {/* Not logged in */}
          {!user && (
            <>
              <NavLink to="/login" className="nav-login" onClick={closeMenu}>
                <LogIn size={16} /> Log in
              </NavLink>
              <NavLink className="nav-register" to="/register" onClick={closeMenu}>Register</NavLink>
            </>
          )}

          {/* Logged in as regular user */}
          {user && user.role !== 'admin' && (
            <>
              <NavLink to="/user/dashboard" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMenu}>Dashboard</NavLink>
              <NavLink to="/user/bookings" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMenu}>My Bookings</NavLink>
              <NavLink to="/user/profile" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMenu}>My Profile</NavLink>
              <button className="link-button" onClick={handleLogout}>
                <LogOut size={15} style={{ marginRight: 5 }} /> Log out
              </button>
            </>
          )}

          {/* Logged in as admin */}
          {user && user.role === 'admin' && (
            <>
              <NavLink to="/admin/dashboard" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMenu}>Dashboard</NavLink>
              <NavLink to="/admin/events" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMenu}>Events</NavLink>
              <NavLink to="/admin/bookings" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMenu}>Bookings</NavLink>
              <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMenu}>Users</NavLink>
              <NavLink to="/admin/analytics" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMenu}>Analytics</NavLink>
              <NavLink to="/user/profile" className={({ isActive }) => isActive ? 'active' : ''} onClick={closeMenu}>Profile</NavLink>
              <button className="link-button" onClick={handleLogout}>
                <LogOut size={15} style={{ marginRight: 5 }} /> Log out
              </button>
            </>
          )}
        </nav>
      </header>

      <main><Outlet /></main>

      <footer className="site-footer">
        © {new Date().getFullYear()} Eventify. Make time for what matters.
      </footer>
    </>
  );
}
