import { useEffect, useState } from 'react';
import { CalendarDays, MapPin, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function formatDate(date) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));
}

function StatusBadge({ status }) {
  const map = {
    confirmed: { bg: '#edf9f0', color: '#26733a', label: 'Confirmed' },
    pending: { bg: '#fff8e6', color: '#8a6000', label: 'Pending payment' },
    cancelled: { bg: '#fff1f0', color: '#a52d27', label: 'Cancelled' },
    expired: { bg: '#f5f5f5', color: '#666', label: 'Expired' }
  };
  const s = map[status] || map.expired;
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 99, padding: '3px 10px', fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>
      {s.label}
    </span>
  );
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    api.get('/bookings/my-bookings')
      .then(({ data }) => setBookings(data.data.bookings))
      .catch(() => setError('Unable to load your bookings. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleCancel(id) {
    if (!confirm('Cancel this booking? This cannot be undone.')) return;
    setCancellingId(id);
    try {
      await api.patch(`/bookings/${id}/cancel`);
      setBookings((prev) => prev.map((b) => b._id === id ? { ...b, status: 'cancelled' } : b));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to cancel booking.');
    } finally {
      setCancellingId(null);
    }
  }

  const now = new Date();
  const upcoming = bookings.filter((b) => b.status !== 'cancelled' && b.event?.startDate && new Date(b.event.startDate) >= now);
  const past = bookings.filter((b) => !upcoming.includes(b));

  function BookingCard({ booking }) {
    const canCancel = ['confirmed', 'pending'].includes(booking.status) && booking.event?.startDate && new Date(booking.event.startDate) > now;
    return (
      <article className="booking-card">
        <div style={{ display: 'flex', gap: 16, flex: 1 }}>
          <div
            className="booking-card-event-image"
            style={booking.event?.posterUrl ? { backgroundImage: `url(${booking.event.posterUrl})` } : undefined}
          />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
              <StatusBadge status={booking.status} />
              <span style={{ color: '#88889a', fontSize: '.78rem' }}>#{booking.bookingReference}</span>
            </div>
            <h2 style={{ margin: '0 0 6px', fontSize: '1.15rem' }}>
              <Link to={`/events/${booking.event?._id}`} style={{ color: 'inherit' }}>
                {booking.event?.title}
              </Link>
            </h2>
            <p style={{ color: '#77778b', margin: '4px 0', fontSize: '.88rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CalendarDays size={14} /> {booking.event?.startDate ? formatDate(booking.event.startDate) : '—'}
            </p>
            <p style={{ color: '#77778b', margin: '4px 0', fontSize: '.88rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={14} /> {booking.event?.venue}, {booking.event?.city}
            </p>
            <p style={{ margin: '8px 0 0', fontWeight: 700, fontSize: '.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Ticket size={14} style={{ color: '#4c3be5' }} />
              {booking.quantity} × {booking.ticketType}
              {booking.totalAmount > 0 ? ` · ₹${booking.totalAmount.toLocaleString()}` : ' · Free'}
            </p>
          </div>
        </div>
        {canCancel && (
          <button
            className="button danger-button"
            onClick={() => handleCancel(booking._id)}
            disabled={cancellingId === booking._id}
            style={{ flexShrink: 0, alignSelf: 'flex-start' }}
          >
            {cancellingId === booking._id ? 'Cancelling...' : 'Cancel'}
          </button>
        )}
      </article>
    );
  }

  return (
    <section className="content-section bookings-page">
      <div className="page-heading">
        <p className="eyebrow">Your Eventify</p>
        <h1>My Bookings</h1>
        <p style={{ color: '#77778b' }}>Keep every confirmed experience in one place.</p>
      </div>

      {error && <div className="form-error">{error}</div>}

      {loading ? (
        <p className="empty-state">Loading your bookings...</p>
      ) : bookings.length === 0 ? (
        <div className="empty-state-card" style={{ margin: '40px 0' }}>
          <Ticket size={40} style={{ color: '#c5c5da', marginBottom: 12 }} />
          <p>You have no bookings yet.</p>
          <Link className="button primary" to="/events" style={{ marginTop: 12 }}>Explore events</Link>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="dashboard-section">
              <h2 style={{ marginBottom: 16 }}>Upcoming ({upcoming.length})</h2>
              <div className="booking-list">
                {upcoming.map((b) => <BookingCard key={b._id} booking={b} />)}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div className="dashboard-section" style={{ marginTop: 40 }}>
              <h2 style={{ marginBottom: 16 }}>Past & cancelled ({past.length})</h2>
              <div className="booking-list">
                {past.map((b) => <BookingCard key={b._id} booking={b} />)}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
