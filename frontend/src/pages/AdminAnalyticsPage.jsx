import { useEffect, useState } from 'react';
import { AlertCircle, TrendingUp } from 'lucide-react';
import api from '../services/api';

function SimpleBarChart({ data, valueKey, labelKey, title, color = '#4c3be5', format = (v) => v }) {
  if (!data || data.length === 0) return <p className="empty-state" style={{ padding: '20px 0' }}>No data available.</p>;
  const max = Math.max(...data.map((d) => d[valueKey]));
  return (
    <div style={{ background: 'white', border: '1px solid #ececf4', borderRadius: 14, padding: '22px' }}>
      <h3 style={{ margin: '0 0 18px', fontSize: '1rem', color: '#182033' }}>{title}</h3>
      <div style={{ display: 'grid', gap: 8 }}>
        {data.map((item, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 3fr auto', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: '.8rem', color: '#88889a', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item[labelKey]}
            </span>
            <div style={{ background: '#f0f0f8', borderRadius: 99, height: 8, overflow: 'hidden' }}>
              <div style={{
                width: max > 0 ? `${(item[valueKey] / max) * 100}%` : '0%',
                height: '100%', background: color, borderRadius: 99,
                transition: 'width 0.6s ease'
              }} />
            </div>
            <span style={{ fontSize: '.85rem', fontWeight: 700, color: '#182033', minWidth: 40 }}>
              {format(item[valueKey])}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub }) {
  return (
    <div className="stat-card">
      <span className="stat-number" style={{ fontSize: '1.6rem' }}>{value}</span>
      <span className="stat-label">{label}</span>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/analytics')
      .then(({ data: res }) => setData(res.data))
      .catch(() => setError('Unable to load analytics data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <section className="content-section"><p className="empty-state">Loading analytics...</p></section>;
  if (error) return <section className="content-section"><div className="form-error"><AlertCircle size={16} />{error}</div></section>;

  const { bookingsByDay, bookingsByStatus, topEvents, revenueByEvent, registrationsByDay, categoryBreakdown } = data;

  const totalBookings30d = bookingsByDay.reduce((sum, d) => sum + d.count, 0);
  const totalRevenue30d = bookingsByDay.reduce((sum, d) => sum + (d.revenue || 0), 0);
  const newUsers30d = registrationsByDay.reduce((sum, d) => sum + d.count, 0);
  const confirmedCount = bookingsByStatus.find((s) => s._id === 'confirmed')?.count || 0;

  return (
    <section className="content-section">
      <div className="dashboard-welcome">
        <div>
          <p className="eyebrow">Admin workspace</p>
          <h1>Analytics</h1>
          <p style={{ color: '#77778b' }}>Platform insights from the last 30 days.</p>
        </div>
        <TrendingUp size={40} style={{ color: '#4c3be5', opacity: 0.3 }} />
      </div>

      {/* Summary cards */}
      <div className="dashboard-stats" style={{ marginBottom: 36 }}>
        <MetricCard label="Bookings (30d)" value={totalBookings30d} />
        <MetricCard label="Revenue (30d)" value={`₹${totalRevenue30d.toLocaleString()}`} />
        <MetricCard label="New users (30d)" value={newUsers30d} />
        <MetricCard label="Confirmed bookings" value={confirmedCount} />
      </div>

      {/* Charts grid */}
      <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', marginBottom: 20 }}>
        <SimpleBarChart
          title="Top events by tickets sold"
          data={topEvents}
          labelKey="eventTitle"
          valueKey="ticketsSold"
          color="#4c3be5"
        />
        <SimpleBarChart
          title="Events by category"
          data={categoryBreakdown}
          labelKey="_id"
          valueKey="count"
          color="#7165e9"
        />
      </div>

      <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', marginBottom: 20 }}>
        <SimpleBarChart
          title="Revenue by event (paid bookings)"
          data={revenueByEvent}
          labelKey="eventTitle"
          valueKey="revenue"
          color="#ffbd8f"
          format={(v) => `₹${v.toLocaleString()}`}
        />
        <SimpleBarChart
          title="Booking status breakdown"
          data={bookingsByStatus}
          labelKey="_id"
          valueKey="count"
          color="#26733a"
        />
      </div>

      {/* Bookings over time as simple table */}
      {bookingsByDay.length > 0 && (
        <div style={{ background: 'white', border: '1px solid #ececf4', borderRadius: 14, padding: '22px', overflowX: 'auto' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1rem' }}>Daily bookings (last 30 days)</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #ececf4' }}>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: '#88889a', fontWeight: 600 }}>Date</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', color: '#88889a', fontWeight: 600 }}>Bookings</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', color: '#88889a', fontWeight: 600 }}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {bookingsByDay.map((d) => (
                <tr key={d._id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <td style={{ padding: '8px 12px', color: '#182033' }}>{d._id}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right' }}>{d.count}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>₹{(d.revenue || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
