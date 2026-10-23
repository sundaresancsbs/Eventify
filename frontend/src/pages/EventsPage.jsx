import { useEffect, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, Search } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';

function formatDate(date) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));
}

export default function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [state, setState] = useState({ loading: true, error: '' });
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const category = searchParams.get('category') || '';
  const page = Number(searchParams.get('page') || 1);

  useEffect(() => {
    setState({ loading: true, error: '' });
    api.get('/events', { params: { search: searchParams.get('search') || undefined, category: category || undefined, page } })
      .then(({ data }) => { setEvents(data.data.events); setPagination(data.data.pagination); })
      .catch((error) => setState({ loading: false, error: error.response?.data?.message || 'Unable to load events.' }))
      .finally(() => setState((current) => ({ ...current, loading: false })));
  }, [searchParams, category, page]);

  function submitSearch(event) {
    event.preventDefault();
    setSearchParams(search ? { search } : {});
  }

  return <section className="events-page content-section"><div className="page-heading"><div><p className="eyebrow">Explore experiences</p><h1>Find your next event.</h1><p>Browse published events and discover something worth making time for.</p></div></div><form className="events-toolbar" onSubmit={submitSearch}><Search size={19} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by event, category, or city" /><button className="button primary">Search</button></form>{state.error && <div className="form-error">{state.error}</div>}{state.loading ? <p className="empty-state">Loading events...</p> : events.length === 0 ? <p className="empty-state">No upcoming events match your search.</p> : <div className="event-grid">{events.map((event) => <EventCard key={event._id} event={event} />)}</div>}{pagination.pages > 1 && <div className="pagination"><button disabled={page <= 1} onClick={() => setSearchParams({ ...(search ? { search } : {}), page: String(page - 1) })}><ChevronLeft size={18} /> Previous</button><span>Page {page} of {pagination.pages}</span><button disabled={page >= pagination.pages} onClick={() => setSearchParams({ ...(search ? { search } : {}), page: String(page + 1) })}>Next <ChevronRight size={18} /></button></div>}</section>;
}

function EventCard({ event }) {
  const lowestPrice = Math.min(...event.ticketTypes.map((ticket) => ticket.price));
  return <article className="event-card"><div className="event-image" style={event.posterUrl ? { backgroundImage: `url(${event.posterUrl})` } : undefined}><span>{event.category}</span></div><div className="event-card-body"><h2>{event.title}</h2><p><CalendarDays size={16} /> {formatDate(event.startDate)}</p><p><MapPin size={16} /> {event.venue}, {event.city}</p><div className="event-card-footer"><strong>From ₹{lowestPrice.toLocaleString()}</strong><Link className="details-link" to={`/events/${event._id}`}>Details</Link><Link className="card-book-button" to={`/events/${event._id}`}>Book now</Link></div></div></article>;
}
