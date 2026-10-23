import { useEffect, useState } from 'react';
import { AlertCircle, Search, ShieldOff, User } from 'lucide-react';
import api from '../services/api';

function formatDate(date) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => { fetchUsers(); }, [page, search, roleFilter]);

  async function fetchUsers() {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const { data } = await api.get('/admin/users', { params });
      setUsers(data.data.users);
      setPagination(data.data.pagination);
    } catch {
      setError('Unable to load users.');
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus(id, currentStatus) {
    try {
      const { data } = await api.patch(`/admin/users/${id}/status`, { isActive: !currentStatus });
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, isActive: data.data.user.isActive } : u));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update user status.');
    }
  }

  function submitSearch(e) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  return (
    <section className="content-section">
      <div className="dashboard-welcome">
        <div>
          <p className="eyebrow">Admin workspace</p>
          <h1>Manage Users</h1>
          <p style={{ color: '#77778b' }}>View registered accounts and manage their access. Total: {pagination.total}</p>
        </div>
      </div>

      {/* Search + filter */}
      <div style={{ display: 'flex', gap: 12, margin: '24px 0', flexWrap: 'wrap' }}>
        <form onSubmit={submitSearch} style={{ display: 'flex', gap: 8 }}>
          <span className="events-toolbar" style={{ margin: 0, padding: '8px 14px', flex: 'none' }}>
            <Search size={16} />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name or email"
              style={{ border: 0, outline: 0, background: 'transparent', minWidth: 200 }}
            />
          </span>
          <button className="button primary" style={{ padding: '8px 14px' }}>Search</button>
        </form>
        {['', 'user', 'admin'].map((r) => (
          <button
            key={r || 'all'}
            onClick={() => { setRoleFilter(r); setPage(1); }}
            style={{
              padding: '8px 16px', borderRadius: 99, border: '1px solid',
              cursor: 'pointer', fontWeight: 600, fontSize: '.85rem',
              background: roleFilter === r ? '#4c3be5' : 'white',
              color: roleFilter === r ? 'white' : '#555',
              borderColor: roleFilter === r ? '#4c3be5' : '#dedff0'
            }}
          >
            {r || 'All roles'}
          </button>
        ))}
      </div>

      {error && <div className="form-error"><AlertCircle size={16} />{error}</div>}

      {loading ? (
        <p className="empty-state">Loading users...</p>
      ) : users.length === 0 ? (
        <p className="empty-state">No users found.</p>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {users.map((user) => (
            <div key={user._id} className="admin-event-row" style={{ alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 200 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: user.role === 'admin' ? '#eeedff' : '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User size={20} style={{ color: user.role === 'admin' ? '#4c3be5' : '#6883c4' }} />
                </div>
                <div>
                  <strong style={{ display: 'block' }}>{user.name}</strong>
                  <span style={{ color: '#88889a', fontSize: '.82rem' }}>{user.email}</span>
                  {user.phone && <span style={{ color: '#88889a', fontSize: '.82rem', display: 'block' }}>{user.phone}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 120 }}>
                <span className={`profile-role-badge role-${user.role}`} style={{ width: 'fit-content' }}>
                  {user.role === 'admin' ? 'Administrator' : 'User'}
                </span>
                <span style={{ color: '#88889a', fontSize: '.78rem' }}>Joined {formatDate(user.createdAt)}</span>
                <span style={{ color: '#88889a', fontSize: '.78rem' }}>{user.bookingCount} booking{user.bookingCount !== 1 ? 's' : ''}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  padding: '3px 10px', borderRadius: 99, fontSize: '.75rem', fontWeight: 700,
                  background: user.isActive ? '#edf9f0' : '#fff1f0',
                  color: user.isActive ? '#26733a' : '#a52d27'
                }}>
                  {user.isActive ? 'Active' : 'Suspended'}
                </span>
                {user.role !== 'admin' && (
                  <button
                    className="button"
                    style={{
                      padding: '7px 12px', fontSize: '.82rem',
                      background: user.isActive ? '#fff1f0' : '#edf9f0',
                      color: user.isActive ? '#a52d27' : '#26733a',
                      border: 'none'
                    }}
                    onClick={() => toggleStatus(user._id, user.isActive)}
                    title={user.isActive ? 'Suspend user' : 'Reactivate user'}
                  >
                    <ShieldOff size={14} style={{ marginRight: 4 }} />
                    {user.isActive ? 'Suspend' : 'Reactivate'}
                  </button>
                )}
              </div>
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
