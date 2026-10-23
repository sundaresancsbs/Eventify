import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, Ticket, TrendingUp, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function formatDate(date) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));
}

function StatusBadge({ status }) {
  const colors = {
    confirmed: { bg: '#edf9f0', color: '#26733a', label: 'Confirmed' },
    pending: { bg: '#fff8e6', color: '#8a6000', label: 'Pending' },
    cancelled: { bg: '#fff1f0', color: '#a52d27', label: 'Cancelled' },
    expired: { bg: '#f5f5f5', color: '#666', label: 'Expired' }
  };
  const s = colors[status] || colors.expired;
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 99, padding: '3px 10px', fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em' }}>
      {s.label}
    </span>
  );
}

export default function UserDashboardPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/bookings/my-bookings')
      .then(({ data }) => setBookings(data.data.bookings))
      .catch(() => setError('Unable to load your bookings. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const upcoming = bookings.filter(
    (b) => b.status !== 'cancelled' && b.event?.startDate && new Date(b.event.startDate) >= now
  );
  const past = bookings.filter(
    (b) => b.event?.startDate && new Date(b.event.startDate) < now
  );
  const confirmed = bookings.filter((b) => b.status === 'confirmed').length;

  return (
    <section className="content-section user-dashboard">
      {/* Welcome banner */}
      <div className="dashboard-welcome">
        <div>
          <p className="eyebrow">Your Eventify</p>
          <h1>Welcome back, {user?.name?.split(' ')[0]}!</h1>
          <p style={{ color: '#77778b', marginTop: 8 }}>Here's everything happening on your account.</p>
        </div>
        <Link className="button primary" to="/events">
          <CalendarDays size={18} /> Browse events
        </Link>
      </div>

      {/* Quick stats */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <Ticket size={22} className="stat-icon" />
          <span className="stat-number">{bookings.length}</span>
          <span className="stat-label">Total bookings</span>
        </div>
        <div className="stat-card">
          <TrendingUp size={22} className="stat-icon green" />
          <span className="stat-number">{confirmed}</span>
          <span className="stat-label">Confirmed</span>
        </div>
        <div className="stat-card">
          <CalendarDays size={22} className="stat-icon purple" />
          <span className="stat-number">{upcoming.length}</span>
          <span className="stat-label">Upcoming</span>
        </div>
        <div className="stat-card">
          <User size={22} className="stat-icon blue" />
          <span className="stat-number" style={{ fontSize: '1rem', fontWeight: 600 }}>{user?.email}</span>
          <span className="stat-label">Account email</span>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      {/* Upcoming events */}
      <div className="dashboard-section">
        <div className="section-header-row">
          <h2>Upcoming events</h2>
          <Link to="/user/bookings" style={{ color: '#4c3be5', fontWeight: 700, fontSize: '.9rem' }}>View all →</Link>
        </div>
        {loading ? (
          <p className="empty-state">Loading your bookings...</p>
        ) : upcoming.length === 0 ? (
          <div className="empty-state-card">
            <CalendarDays size={40} style={{ color: '#c5c5da', marginBottom: 12 }} />
            <p>No upcoming events booked yet.</p>
            <Link className="button primary" to="/events" style={{ marginTop: 12 }}>Discover events</Link>
          </div>
        ) : (
          <div className="booking-list">
            {upcoming.slice(0, 3).map((booking) => (
              <article className="booking-card" key={booking._id}>
                <div className="booking-card-event-image" style={booking.event?.posterUrl ? { backgroundImage: `url(${booking.event.posterUrl})` } : undefined} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <StatusBadge status={booking.status} />
                    <span style={{ color: '#88889a', fontSize: '.8rem' }}>Ref: {booking.bookingReference}</span>
                  </div>
                  <h2 style={{ margin: '0 0 6px', fontSize: '1.15rem' }}>{booking.event?.title}</h2>
                  <p style={{ color: '#77778b', margin: '4px 0', fontSize: '.88rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CalendarDays size={15} /> {booking.event?.startDate ? formatDate(booking.event.startDate) : '—'}
                  </p>
                  <p style={{ color: '#77778b', margin: '4px 0', fontSize: '.88rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={15} /> {booking.event?.venue}, {booking.event?.city}
                  </p>
                  <strong style={{ fontSize: '.9rem' }}>{booking.quantity} × {booking.ticketType} · ₹{booking.totalAmount.toLocaleString()}</strong>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="dashboard-quick-links">
        <Link className="quick-link-card" to="/user/bookings">
          <Ticket size={24} />
          <strong>My Bookings</strong>
          <span>View all your tickets</span>
        </Link>
        <Link className="quick-link-card" to="/user/profile">
          <User size={24} />
          <strong>My Profile</strong>
          <span>Update your details</span>
        </Link>
        <Link className="quick-link-card" to="/events">
          <CalendarDays size={24} />
          <strong>Browse Events</strong>
          <span>Discover what's on</span>
        </Link>
      </div>
    </section>
  );
}
