import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CalendarDays, CheckCircle, LoaderCircle, Plus, Trash2 } from 'lucide-react';
import api from '../services/api';

const CATEGORIES = ['Technology', 'Music', 'Sports', 'Business', 'Education', 'Art', 'Workshops', 'Other'];

const emptyForm = {
  title: '', description: '', category: 'Technology', venue: '', address: '', city: '',
  posterUrl: '', startDate: '', endDate: '', salesStartDate: '', salesEndDate: '',
  totalCapacity: 100, status: 'published',
  ticketTypes: [{ name: 'General Admission', price: 0, quantity: 100, perUserLimit: 4 }]
};

function formatDate(date) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));
}

/* ─── Event Form (create or edit) ─── */
function EventForm({ initial, onSave, onCancel, title }) {
  const [form, setForm] = useState(initial);
  const [state, setState] = useState({ loading: false, error: '', success: '' });

  function setTicket(field, value) {
    setForm((f) => ({ ...f, ticketTypes: [{ ...f.ticketTypes[0], [field]: value }] }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setState({ loading: true, error: '', success: '' });
    try {
      await onSave({
        ...form,
        totalCapacity: Number(form.totalCapacity),
        ticketTypes: [{ ...form.ticketTypes[0], price: Number(form.ticketTypes[0].price), quantity: Number(form.ticketTypes[0].quantity), perUserLimit: Number(form.ticketTypes[0].perUserLimit) }]
      });
      setState({ loading: false, error: '', success: 'Event saved successfully.' });
    } catch (error) {
      const msg = error.response?.data?.details?.join(' ') || error.response?.data?.message || 'Unable to save event.';
      setState({ loading: false, error: msg, success: '' });
    }
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <h2 style={{ margin: 0 }}>{title}</h2>
      {state.success && <div className="success-message" style={{ display: 'flex', gap: 8 }}><CheckCircle size={16} />{state.success}</div>}
      {state.error && <div className="form-error"><AlertCircle size={16} />{state.error}</div>}

      <label>Event title<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
      <label>Description<textarea required minLength="20" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>

      <div className="form-two-columns">
        <label>Category
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label>Status
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="cancelled">Cancelled</option>
            <option value="archived">Archived</option>
          </select>
        </label>
      </div>

      <div className="form-two-columns">
        <label>Venue<input required value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} /></label>
        <label>City<input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></label>
      </div>
      <label>Address <span className="optional">(optional)</span><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>
      <label>Poster URL <span className="optional">(optional)</span><input type="url" value={form.posterUrl} onChange={(e) => setForm({ ...form, posterUrl: e.target.value })} /></label>

      <div className="form-two-columns">
        <label>Event start<input required type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></label>
        <label>Event end<input required type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></label>
        <label>Sales start<input required type="datetime-local" value={form.salesStartDate} onChange={(e) => setForm({ ...form, salesStartDate: e.target.value })} /></label>
        <label>Sales end<input required type="datetime-local" value={form.salesEndDate} onChange={(e) => setForm({ ...form, salesEndDate: e.target.value })} /></label>
      </div>

      <label>Total capacity<input required type="number" min="1" value={form.totalCapacity} onChange={(e) => setForm({ ...form, totalCapacity: e.target.value })} /></label>

      <div className="ticket-editor">
        <h3>Ticket type</h3>
        <div className="form-two-columns">
          <label>Name<input required value={form.ticketTypes[0].name} onChange={(e) => setTicket('name', e.target.value)} /></label>
          <label>Price (₹) — 0 for free<input required type="number" min="0" value={form.ticketTypes[0].price} onChange={(e) => setTicket('price', e.target.value)} /></label>
          <label>Quantity<input required type="number" min="1" value={form.ticketTypes[0].quantity} onChange={(e) => setTicket('quantity', e.target.value)} /></label>
          <label>Per-user limit<input required type="number" min="1" value={form.ticketTypes[0].perUserLimit} onChange={(e) => setTicket('perUserLimit', e.target.value)} /></label>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button className="button primary" disabled={state.loading}>
          {state.loading ? <><LoaderCircle className="spin" size={16} /> Saving...</> : 'Save event'}
        </button>
        {onCancel && <button type="button" className="button ghost" style={{ border: '1px solid #dedff0', color: '#555' }} onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}

/* ─── Event list row ─── */
function EventRow({ event, onStatusChange, onDelete, onEdit }) {
  return (
    <div className="admin-event-row" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
      <div style={{ flex: 1, minWidth: 180 }}>
        <strong style={{ display: 'block' }}>{event.title}</strong>
        <span style={{ color: '#88889a', fontSize: '.82rem' }}>
          {event.category} · {formatDate(event.startDate)} · {event.city}
        </span>
        <span style={{ color: '#88889a', fontSize: '.82rem', display: 'block' }}>
          Capacity: {event.confirmedTickets ?? 0}/{event.totalCapacity}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <select
          value={event.status}
          onChange={(e) => onStatusChange(event._id, e.target.value)}
          style={{ background: 'white', border: '1px solid #dedff0', borderRadius: 8, padding: '7px 10px', fontSize: '.85rem' }}
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="cancelled">Cancelled</option>
          <option value="archived">Archived</option>
        </select>
        <button className="button" style={{ background: '#eeedff', color: '#4c3be5', padding: '8px 12px' }} onClick={() => onEdit(event)}>Edit</button>
        <button className="button danger-button" style={{ padding: '8px 12px' }} onClick={() => onDelete(event._id)}>
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

/* ─── Main page ─── */
export default function AdminEventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('list'); // 'list' | 'create' | 'edit'
  const [editTarget, setEditTarget] = useState(null);

  useEffect(() => { fetchEvents(); }, []);

  async function fetchEvents() {
    setLoading(true);
    try {
      const { data } = await api.get('/events/manage');
      setEvents(data.data.events);
    } catch {
      setError('Unable to load events.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(payload) {
    const { data } = await api.post('/events', payload);
    setEvents((prev) => [data.data.event, ...prev]);
    setView('list');
  }

  async function handleUpdate(payload) {
    const { data } = await api.put(`/events/${editTarget._id}`, payload);
    setEvents((prev) => prev.map((e) => e._id === editTarget._id ? data.data.event : e));
    setView('list');
    setEditTarget(null);
  }

  async function handleStatusChange(id, status) {
    try {
      const { data } = await api.patch(`/events/${id}/status`, { status });
      setEvents((prev) => prev.map((e) => e._id === id ? data.data.event : e));
    } catch {
      setError('Unable to update event status.');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this event? This cannot be undone.')) return;
    try {
      await api.delete(`/events/${id}`);
      setEvents((prev) => prev.filter((e) => e._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete event.');
    }
  }

  function startEdit(event) {
    // Format dates for datetime-local inputs
    function toLocal(iso) {
      if (!iso) return '';
      const d = new Date(iso);
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    }
    setEditTarget({
      ...event,
      startDate: toLocal(event.startDate),
      endDate: toLocal(event.endDate),
      salesStartDate: toLocal(event.salesStartDate),
      salesEndDate: toLocal(event.salesEndDate)
    });
    setView('edit');
  }

  return (
    <section className="content-section admin-events-page">
      {view === 'list' && (
        <>
          <div className="dashboard-welcome">
            <div>
              <p className="eyebrow">Admin workspace</p>
              <h1>Manage Events</h1>
              <p style={{ color: '#77778b' }}>Create, edit, and publish events on Eventify.</p>
            </div>
            <button className="button primary" onClick={() => setView('create')}>
              <Plus size={18} /> Create event
            </button>
          </div>

          {error && <div className="form-error"><AlertCircle size={16} />{error}</div>}

          {loading ? (
            <p className="empty-state">Loading events...</p>
          ) : events.length === 0 ? (
            <p className="empty-state">No events yet. Create your first event above.</p>
          ) : (
            <div style={{ display: 'grid', gap: 10, marginTop: 24 }}>
              {events.map((event) => (
                <EventRow
                  key={event._id}
                  event={event}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDelete}
                  onEdit={startEdit}
                />
              ))}
            </div>
          )}
        </>
      )}

      {view === 'create' && (
        <>
          <button className="button" style={{ background: 'none', color: '#4c3be5', fontWeight: 700, border: 0, padding: 0, marginBottom: 28, display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => setView('list')}>
            <ArrowLeft size={17} /> Back to events
          </button>
          <EventForm title="Create new event" initial={emptyForm} onSave={handleCreate} onCancel={() => setView('list')} />
        </>
      )}

      {view === 'edit' && editTarget && (
        <>
          <button className="button" style={{ background: 'none', color: '#4c3be5', fontWeight: 700, border: 0, padding: 0, marginBottom: 28, display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => setView('list')}>
            <ArrowLeft size={17} /> Back to events
          </button>
          <EventForm title={`Edit: ${editTarget.title}`} initial={editTarget} onSave={handleUpdate} onCancel={() => setView('list')} />
        </>
      )}
    </section>
  );
}
