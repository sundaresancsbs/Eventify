import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function getErrorMessage(error) {
  const response = error.response?.data;
  if (response?.details?.length) return response.details.join(' ');
  if (!error.response) return 'Unable to connect to the server. Make sure the backend is running on port 5000.';
  return response?.message || 'Unable to complete the request. Please try again.';
}

/* ─────────────────────────────────────────────
   Shared password field with show/hide toggle
───────────────────────────────────────────── */
function PasswordField({ id, label, value, onChange, autoComplete = 'current-password', placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <label htmlFor={id}>
      {label}
      <span className="password-field-wrap">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          required
          autoComplete={autoComplete}
          placeholder={placeholder}
        />
        <button
          type="button"
          className="password-toggle"
          aria-label={show ? 'Hide password' : 'Show password'}
          onClick={() => setShow((s) => !s)}
          tabIndex={-1}
        >
          {show ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </span>
    </label>
  );
}

/* ─────────────────────────────────────────────
   Unified Login Page (redirects by DB role)
───────────────────────────────────────────── */
export function LoginPage({ adminOnly = false }) {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;

  const [form, setForm] = useState({ email: '', password: '' });
  const [state, setState] = useState({ loading: false, error: '' });

  const registrationMessage = location.state?.registered
    ? 'Account created successfully. Please log in.'
    : '';

  async function handleSubmit(e) {
    e.preventDefault();
    setState({ loading: true, error: '' });
    try {
      const user = await login(form);
      // Backend role determines where to go
      if (adminOnly && user.role !== 'admin') {
        await logout();
        setState({ loading: false, error: 'This account is not an administrator. Use an administrator account to continue.' });
        return;
      }
      if (user.role === 'admin') {
        navigate(from || '/admin/dashboard', { replace: true });
      } else {
        navigate(from || '/user/dashboard', { replace: true });
      }
    } catch (error) {
      setState({ loading: false, error: getErrorMessage(error) });
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">{adminOnly ? 'Eventify administration' : 'Eventify account'}</p>
        <h1>Welcome back</h1>
        <p className="auth-subtitle">{adminOnly ? 'Sign in with your administrator account to manage Eventify.' : 'Sign in to manage your bookings and discover what’s next.'}</p>

        {registrationMessage && (
          <div className="success-message" role="status">{registrationMessage}</div>
        )}
        {state.error && (
          <div className="form-error" role="alert"><AlertCircle size={18} />{state.error}</div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="login-email">
            Email address
            <input
              id="login-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              autoComplete="email"
            />
          </label>

          <PasswordField
            id="login-password"
            label="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            autoComplete="current-password"
          />

          <button className="button primary auth-submit" disabled={state.loading} id="login-submit">
            {state.loading
              ? <><LoaderCircle className="spin" size={18} /> Please wait...</>
              : <>Log in <ArrowRight size={18} /></>
            }
          </button>
        </form>

        <p className="auth-footer">
          {adminOnly ? <>Need an admin account? Run the admin seed command from the project README.</> : <>New to Eventify? <Link to="/register">Create an account</Link></>}
        </p>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   Public Registration Page (users only)
───────────────────────────────────────────── */
export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [state, setState] = useState({ loading: false, error: '' });

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setState({ loading: false, error: 'Passwords do not match.' });
      return;
    }
    setState({ loading: true, error: '' });
    try {
      await register({ name: form.name, email: form.email, phone: form.phone, password: form.password });
      navigate('/login', { replace: true, state: { registered: true } });
    } catch (error) {
      setState({ loading: false, error: getErrorMessage(error) });
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="eyebrow">Eventify registration</p>
        <h1>Create your account</h1>
        <p className="auth-subtitle">
          Register as an event attendee and start discovering experiences.
        </p>

        {state.error && (
          <div className="form-error" role="alert"><AlertCircle size={18} />{state.error}</div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="reg-name">
            Full name
            <input
              id="reg-name"
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              autoComplete="name"
            />
          </label>

          <label htmlFor="reg-email">
            Email address
            <input
              id="reg-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              autoComplete="email"
            />
          </label>

          <label htmlFor="reg-phone">
            Phone number <span className="optional">(optional)</span>
            <input
              id="reg-phone"
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              autoComplete="tel"
            />
          </label>

          <PasswordField
            id="reg-password"
            label="Password (min 8 characters)"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            autoComplete="new-password"
          />

          <PasswordField
            id="reg-confirm-password"
            label="Confirm password"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            autoComplete="new-password"
          />

          <button className="button primary auth-submit" disabled={state.loading} id="register-submit">
            {state.loading
              ? <><LoaderCircle className="spin" size={18} /> Creating account...</>
              : <>Create account <ArrowRight size={18} /></>
            }
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </section>
  );
}
