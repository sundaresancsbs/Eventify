import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, Plus, Ticket, TrendingUp, Users } from 'lucide-react';
import api from '../services/api';

function formatDate(date) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));
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

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/stats')
      .then(({ data: res }) => setData(res.data))
      .catch(() => setError('Unable to load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <section className="content-section"><p className="empty-state">Loading dashboard...</p></section>;
  if (error) return <section className="content-section"><div className="form-error">{error}</div></section>;

  const { stats, recentBookings, upcomingEvents } = data;

  return (
    <section className="content-section admin-dashboard">
      <div className="dashboard-welcome">
        <div>
          <p className="eyebrow">Admin workspace</p>
          <h1>Dashboard</h1>
          <p style={{ color: '#77778b', marginTop: 8 }}>Real-time overview of your Eventify platform.</p>
        </div>
        <Link className="button primary" to="/admin/events/create">
          <Plus size={18} /> Create event
        </Link>
      </div>

      {/* Stats grid */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <CalendarDays size={22} className="stat-icon purple" />
          <span className="stat-number">{stats.totalEvents}</span>
          <span className="stat-label">Total events</span>
          <span className="stat-sub">{stats.publishedEvents} published · {stats.draftEvents} draft</span>
        </div>
        <div className="stat-card">
          <Users size={22} className="stat-icon blue" />
          <span className="stat-number">{stats.totalUsers}</span>
          <span className="stat-label">Registered users</span>
        </div>
        <div className="stat-card">
          <Ticket size={22} className="stat-icon" />
          <span className="stat-number">{stats.totalBookings}</span>
          <span className="stat-label">Total bookings</span>
          <span className="stat-sub">{stats.confirmedBookings} confirmed</span>
        </div>
        <div className="stat-card">
          <TrendingUp size={22} className="stat-icon green" />
          <span className="stat-number">₹{(stats.totalRevenue || 0).toLocaleString()}</span>
          <span className="stat-label">Total revenue</span>
        </div>
      </div>

      <div className="admin-two-col">
        {/* Upcoming events */}
        <div>
          <div className="section-header-row" style={{ marginBottom: 16 }}>
            <h2>Upcoming events</h2>
            <Link to="/admin/events" style={{ color: '#4c3be5', fontWeight: 700, fontSize: '.9rem' }}>Manage →</Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="empty-state">No upcoming events.</p>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {upcomingEvents.map((event) => (
                <div className="admin-event-row" key={event._id}>
                  <div>
                    <strong>{event.title}</strong>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#88889a', fontSize: '.82rem', marginTop: 3 }}>
                      <CalendarDays size={13} /> {formatDate(event.startDate)}
                      <MapPin size={13} style={{ marginLeft: 6 }} /> {event.city}
                    </span>
                  </div>
                  <span className={`event-status-badge status-${event.status}`}>{event.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent bookings */}
        <div>
          <div className="section-header-row" style={{ marginBottom: 16 }}>
            <h2>Recent bookings</h2>
            <Link to="/admin/bookings" style={{ color: '#4c3be5', fontWeight: 700, fontSize: '.9rem' }}>View all →</Link>
          </div>
          {recentBookings.length === 0 ? (
            <p className="empty-state">No bookings yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {recentBookings.map((booking) => (
                <div className="admin-event-row" key={booking._id} style={{ flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {booking.event?.title}
                    </strong>
                    <span style={{ color: '#88889a', fontSize: '.82rem' }}>
                      {booking.user?.name} · {booking.quantity} × {booking.ticketType}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <StatusBadge status={booking.status} />
                    <div style={{ color: '#88889a', fontSize: '.8rem', marginTop: 3 }}>₹{booking.totalAmount.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="dashboard-quick-links" style={{ marginTop: 40 }}>
        <Link className="quick-link-card" to="/admin/events">
          <CalendarDays size={24} />
          <strong>Manage Events</strong>
          <span>Create, edit, publish</span>
        </Link>
        <Link className="quick-link-card" to="/admin/bookings">
          <Ticket size={24} />
          <strong>All Bookings</strong>
          <span>View & cancel bookings</span>
        </Link>
        <Link className="quick-link-card" to="/admin/users">
          <Users size={24} />
          <strong>Users</strong>
          <span>Manage accounts</span>
        </Link>
        <Link className="quick-link-card" to="/admin/analytics">
          <TrendingUp size={24} />
          <strong>Analytics</strong>
          <span>Platform insights</span>
        </Link>
      </div>
    </section>
  );
}
