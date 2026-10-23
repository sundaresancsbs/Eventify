import { useEffect, useState } from 'react';
import { CalendarDays, Clock3, MapPin, Ticket } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function EventDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [ticketTypeId, setTicketTypeId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [bookingError, setBookingError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);

  useEffect(() => {
    api.get(`/events/${id}`).then(({ data: response }) => setData(response.data)).catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load this event.'));
  }, [id]);

  if (error) return <section className="placeholder"><p className="eyebrow">Eventify</p><h1>Event unavailable</h1><p>{error}</p><Link className="button primary" to="/events">Back to events</Link></section>;
  if (!data) return <section className="placeholder"><p>Loading event details...</p></section>;

  const { event, availability } = data;
  const salesOpen = availability.salesOpen;
  const selectedTicket = event.ticketTypes.find((ticket) => ticket._id === ticketTypeId) || event.ticketTypes[0];
  async function bookTickets() {
    if (!salesOpen) return;
    if (!user) return navigate('/login', { state: { from: `/events/${id}` } });
    setBookingLoading(true); setBookingError('');
    try {
      const { data: response } = await api.post('/bookings', { eventId: id, ticketTypeId: selectedTicket._id, quantity: Number(quantity) });
      setBookingError('');
      setPaymentDetails({ bookingId: response.data.booking._id, ...response.data.payment });
    } catch (requestError) {
      setBookingError(requestError.response?.data?.message || requestError.message || 'Unable to complete this booking.');
    } finally { setBookingLoading(false); }
  }
  return <section className="event-details content-section"><Link className="back-link" to="/events">← Back to events</Link><div className="details-layout"><div className="details-image" style={event.posterUrl ? { backgroundImage: `url(${event.posterUrl})` } : undefined}><span>{event.category}</span></div><div className="details-copy"><p className="eyebrow">{event.category}</p><h1>{event.title}</h1><p className="details-description">{event.description}</p><div className="details-meta"><p><CalendarDays size={19} />{new Date(event.startDate).toLocaleDateString(undefined, { dateStyle: 'full' })}</p><p><Clock3 size={19} />{new Date(event.startDate).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</p><p><MapPin size={19} />{event.venue}, {event.city}</p></div><div className="availability-box"><div><strong>{availability.availableTickets}</strong><span>tickets available</span></div><div><strong>₹{Math.min(...event.ticketTypes.map((ticket) => ticket.price)).toLocaleString()}</strong><span>starting price</span></div></div><div className="booking-box">{bookingError && <div className="form-error">{bookingError}</div>}{!salesOpen && <div className="form-error">Ticket sales are currently closed. Please check back during the sales window.</div>}{paymentDetails ? <UpiPayment payment={paymentDetails} onSubmitted={() => navigate('/user/bookings')} /> : <><label>Ticket type<select disabled={!salesOpen} value={ticketTypeId || selectedTicket._id} onChange={(change) => { setTicketTypeId(change.target.value); setQuantity(1); }}>{event.ticketTypes.map((ticket) => <option key={ticket._id} value={ticket._id}>{ticket.name} — ₹{ticket.price.toLocaleString()}</option>)}</select></label><label>Quantity<input disabled={!salesOpen} type="number" min="1" max={Math.min(selectedTicket.perUserLimit, availability.availableTickets)} value={quantity} onChange={(change) => setQuantity(change.target.value)} /></label><button className="button primary" disabled={!salesOpen || availability.availableTickets === 0 || bookingLoading} onClick={bookTickets}><Ticket size={18} /> {bookingLoading ? 'Preparing payment...' : `Pay ₹${(selectedTicket.price * quantity).toLocaleString()}`}</button></>}</div></div></div><div className="ticket-types"><h2>Ticket types</h2><div className="ticket-list">{event.ticketTypes.map((ticket) => <div className="ticket-row" key={ticket._id}><span>{ticket.name}</span><strong>₹{ticket.price.toLocaleString()}</strong><small>Up to {ticket.perUserLimit} per person</small></div>)}</div></div></section>;
}

function UpiPayment({ payment, onSubmitted }) {
  const [transactionId, setTransactionId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post('/bookings/payments/upi', { bookingId: payment.bookingId, upiTransactionId: transactionId });
      onSubmitted();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to submit payment reference.');
    } finally { setLoading(false); }
  }
  const qrCodeUrl = payment.qrCodeUrl || (payment.upiId ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(`upi://pay?pa=${payment.upiId}&pn=Eventify&am=${payment.amount}&cu=INR`)}` : '');
  return <form onSubmit={submit} className="upi-payment"><h3>Pay with GPay / UPI</h3>{qrCodeUrl ? <img src={qrCodeUrl} alt="Organization UPI QR code" style={{ display: 'block', margin: '12px auto', maxWidth: 220 }} /> : <p className="form-error">Organization UPI ID is not configured.</p>}<p>Scan the organization QR code and pay <strong>₹{payment.amount.toLocaleString()}</strong>.</p>{payment.upiId && <p>UPI ID: <strong>{payment.upiId}</strong></p>}<label>UPI transaction ID<input required minLength="6" value={transactionId} onChange={(event) => setTransactionId(event.target.value)} placeholder="Enter the ID from your payment receipt" /></label>{error && <div className="form-error">{error}</div>}<button className="button primary" disabled={loading}>{loading ? 'Submitting...' : 'Submit payment reference'}</button><small>Your booking remains pending until the organization verifies the payment.</small></form>;
}
