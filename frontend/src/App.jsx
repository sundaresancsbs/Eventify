import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import PublicLayout from './layouts/PublicLayout';

// Pages — public
import HomePage from './pages/HomePage';
import EventsPage from './pages/EventsPage';
import EventDetailsPage from './pages/EventDetailsPage';
import PlaceholderPage from './pages/PlaceholderPage';
import { LoginPage, RegisterPage } from './pages/AuthPage';

// Pages — user
import UserDashboardPage from './pages/UserDashboardPage';
import BookingsPage from './pages/BookingsPage';
import UserProfilePage from './pages/UserProfilePage';

// Pages — admin
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminEventsPage from './pages/AdminEventsPage';
import AdminBookingsPage from './pages/AdminBookingsPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';

import './styles/global.css';

/* ─────────────────────────────────────────────────────────────────
   Route guards — frontend UX only.
   Real security lives in backend middleware (requireAuth/requireRole).
───────────────────────────────────────────────────────────────── */

/** Redirect to /login while not authenticated; preserve intended URL. */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PlaceholderPage title="Loading" description="Checking your session..." />;
  if (!user) return <Navigate to="/login" replace state={{ from: window.location.pathname }} />;
  return children;
}

/** Admin-only pages: redirect non-admins to their dashboard. */
function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PlaceholderPage title="Loading" description="Checking your administrator session..." />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/user/dashboard" replace />;
  return children;
}

/** Redirect already-authenticated visitors away from /login and /register. */
function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PlaceholderPage title="Loading" description="Checking your session..." />;
  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard'} replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<PublicLayout />}>

            {/* ── Public routes ── */}
            <Route path="/" element={<HomePage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:id" element={<EventDetailsPage />} />
            <Route path="/about" element={<PlaceholderPage title="About Eventify" description="We make it easier to make time for the experiences that matter." />} />

            {/* ── Auth routes (redirect away if already logged in) ── */}
            <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
            <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />

            {/* ── User routes ── */}
            <Route path="/user/dashboard" element={<ProtectedRoute><UserDashboardPage /></ProtectedRoute>} />
            <Route path="/user/bookings" element={<ProtectedRoute><BookingsPage /></ProtectedRoute>} />
            <Route path="/user/profile" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />

            {/* ── Admin routes ── */}
            <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
            <Route path="/admin/events" element={<AdminRoute><AdminEventsPage /></AdminRoute>} />
            <Route path="/admin/events/create" element={<AdminRoute><AdminEventsPage /></AdminRoute>} />
            <Route path="/admin/bookings" element={<AdminRoute><AdminBookingsPage /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
            <Route path="/admin/analytics" element={<AdminRoute><AdminAnalyticsPage /></AdminRoute>} />

            {/* ── Legacy / convenience redirects ── */}
            <Route path="/dashboard" element={<Navigate to="/user/dashboard" replace />} />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            {/* Admin login must remain accessible to a currently signed-in user so they can switch accounts. */}
            <Route path="/admin/login" element={<LoginPage adminOnly />} />
            <Route path="/admin/register" element={<Navigate to="/register" replace />} />

            {/* ── 404 ── */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
