import { useEffect, useState } from 'react';
import { AlertCircle, CalendarDays, MapPin, X } from 'lucide-react';
import api from '../services/api';

function formatDate(date) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(date));
}

function StatusBadge({ status }) {
  const map = {
    confirmed: { bg: '#edf9f0', color: '#26733a' },
    pending: { bg: '#fff8e6', color: '#8a6000' },
    cancelled: { bg: '#fff1f0', color: '#a52d27' },
    expired: { bg: '#f5f5f5', color: '#666' }
  };
  const s = map[status] || map.expired;
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 99, padding: '3px 10px', fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
      {status}
    </span>
  );
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchBookings();
  }, [page, statusFilter]);

  async function fetchBookings() {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/admin/bookings', { params });
      setBookings(data.data.bookings);
      setPagination(data.data.pagination);
    } catch {
      setError('Unable to load bookings.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(id) {
    if (!confirm('Cancel this booking?')) return;
    try {
      await api.patch(`/bookings/${id}/cancel`);
      setBookings((prev) =>
        prev.map((b) => b._id === id ? { ...b, status: 'cancelled', cancelledAt: new Date().toISOString() } : b)
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to cancel booking.');
    }

    async function handleConfirmPayment(id) {
      try {
        await api.patch(`/admin/bookings/${id}/confirm-payment`);
        setBookings((prev) => prev.map((booking) => booking._id === id ? { ...booking, status: 'confirmed', paymentStatus: 'paid' } : booking));
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to confirm payment.');
      }
    }
  }

  return (
    <section className="content-section">
      <div className="dashboard-welcome">
        <div>
          <p className="eyebrow">Admin workspace</p>
          <h1>All Bookings</h1>
          <p style={{ color: '#77778b' }}>View and manage every booking on the platform. Total: {pagination.total}</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, margin: '24px 0', flexWrap: 'wrap' }}>
        {['', 'confirmed', 'pending', 'cancelled', 'expired'].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            style={{
              padding: '8px 16px', borderRadius: 99, border: '1px solid',
              cursor: 'pointer', fontWeight: 600, fontSize: '.85rem',
              background: statusFilter === s ? '#4c3be5' : 'white',
              color: statusFilter === s ? 'white' : '#555',
              borderColor: statusFilter === s ? '#4c3be5' : '#dedff0'
            }}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {error && <div className="form-error"><AlertCircle size={16} />{error}</div>}

      {loading ? (
        <p className="empty-state">Loading bookings...</p>
      ) : bookings.length === 0 ? (
        <p className="empty-state">No bookings found.</p>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {bookings.map((booking) => (
            <div key={booking._id} className="admin-event-row" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <strong style={{ display: 'block', marginBottom: 3 }}>{booking.event?.title}</strong>
                <span style={{ color: '#88889a', fontSize: '.82rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <CalendarDays size={13} /> {booking.event?.startDate ? formatDate(booking.event.startDate) : '—'}
                </span>
                <span style={{ color: '#88889a', fontSize: '.82rem', display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                  <MapPin size={13} /> {booking.event?.venue}, {booking.event?.city}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <strong style={{ display: 'block', fontSize: '.9rem' }}>{booking.user?.name}</strong>
                <span style={{ color: '#88889a', fontSize: '.82rem' }}>{booking.user?.email}</span>
                <span style={{ color: '#88889a', fontSize: '.82rem', display: 'block', marginTop: 2 }}>
                  {booking.quantity} × {booking.ticketType}
                </span>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <StatusBadge status={booking.status} />
                <div style={{ color: '#182033', fontWeight: 700, marginTop: 5 }}>₹{booking.totalAmount.toLocaleString()}</div>
                <div style={{ color: '#88889a', fontSize: '.78rem' }}>{booking.bookingReference}</div>
                {booking.upiTransactionId && <div style={{ color: '#555', fontSize: '.78rem', marginTop: 4 }}>UPI: {booking.upiTransactionId}</div>}
              </div>
              {booking.status === 'pending' && booking.upiTransactionId && (
                <button className="button primary" style={{ padding: '7px 11px' }} onClick={() => handleConfirmPayment(booking._id)}>Confirm payment</button>
              )}
              {['confirmed', 'pending'].includes(booking.status) && (
                <button
                  className="button danger-button"
                  style={{ padding: '7px 11px', alignSelf: 'flex-start' }}
                  onClick={() => handleCancel(booking._id)}
                  title="Cancel booking"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Previous</button>
          <span>Page {page} of {pagination.pages}</span>
          <button disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)}>Next →</button>
        </div>
      )}
    </section>
  );
}
