import { ArrowRight, CalendarCheck, MapPin, Search, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const categories = ['Technology', 'Music', 'Sports', 'Business', 'Art', 'Workshops'];

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow"><Sparkles size={16} /> Experiences worth remembering</p>
          <h1>Find your next <em>great moment.</em></h1>
          <p className="hero-text">Discover remarkable events, connect with your community, and book your seat in a few simple steps.</p>
          <div className="hero-actions"><Link className="button primary" to="/events">Explore events <ArrowRight size={18} /></Link><Link className="button ghost" to="/register">Join Eventify</Link></div>
        </div>
        <div className="hero-orb" aria-hidden="true" />
      </section>
      <section className="search-panel">
        <Search size={20} />
        <input aria-label="Search events" placeholder="Search events, venues, or cities..." />
        <button className="button primary">Search</button>
      </section>
      <section className="content-section">
        <div className="section-heading"><div><p className="eyebrow">Browse by interest</p><h2>Something for every mood</h2></div><Link to="/events">View all <ArrowRight size={16} /></Link></div>
        <div className="category-grid">{categories.map((category) => <Link className="category-card" to={`/events?category=${category}`} key={category}><CalendarCheck size={21} /><span>{category}</span><ArrowRight size={16} /></Link>)}</div>
      </section>
      <section className="feature-strip"><div><p className="eyebrow">Built for better plans</p><h2>One place for the moments you do not want to miss.</h2></div><div className="feature-list"><p><MapPin size={20} /><span><strong>Discover locally</strong> Find experiences near you.</span></p><p><CalendarCheck size={20} /><span><strong>Book confidently</strong> Clear details and instant confirmation.</span></p></div></section>
    </div>
  );
}
