import { useState } from 'react';
import { AlertCircle, CheckCircle, Eye, EyeOff, LoaderCircle, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function PasswordField({ id, label, value, onChange, autoComplete }) {
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
        />
        <button type="button" className="password-toggle" onClick={() => setShow((s) => !s)} tabIndex={-1}>
          {show ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </span>
    </label>
  );
}

export default function UserProfilePage() {
  const { user, updateProfile, changePassword } = useAuth();

  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [profileState, setProfileState] = useState({ loading: false, error: '', success: '' });

  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
  const [passState, setPassState] = useState({ loading: false, error: '', success: '' });

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setProfileState({ loading: true, error: '', success: '' });
    try {
      await updateProfile(profileForm);
      setProfileState({ loading: false, error: '', success: 'Profile updated successfully.' });
    } catch (error) {
      const msg = error.response?.data?.details?.join(' ') || error.response?.data?.message || 'Unable to update profile.';
      setProfileState({ loading: false, error: msg, success: '' });
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmNewPassword) {
      setPassState({ loading: false, error: 'New passwords do not match.', success: '' });
      return;
    }
    setPassState({ loading: true, error: '', success: '' });
    try {
      await changePassword({ currentPassword: passForm.currentPassword, newPassword: passForm.newPassword });
      setPassForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      setPassState({ loading: false, error: '', success: 'Password changed successfully.' });
    } catch (error) {
      const msg = error.response?.data?.message || 'Unable to change password.';
      setPassState({ loading: false, error: msg, success: '' });
    }
  }

  return (
    <section className="content-section">
      <div className="page-heading" style={{ marginBottom: 40 }}>
        <p className="eyebrow">Account settings</p>
        <h1>My Profile</h1>
        <p style={{ color: '#77778b' }}>Manage your personal information and security settings.</p>
      </div>

      <div className="profile-grid">
        {/* Profile info */}
        <div className="admin-form profile-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 4 }}>
            <div className="profile-avatar">
              <User size={28} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.3rem' }}>{user?.name}</h2>
              <p style={{ margin: 0, color: '#88889a', fontSize: '.9rem' }}>{user?.email}</p>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #ececf4', paddingTop: 20, marginTop: 8 }}>
            <span className="profile-role-badge">{user?.role === 'admin' ? 'Administrator' : 'User'}</span>
          </div>

          <h3 style={{ margin: '20px 0 0', fontSize: '1rem' }}>Edit profile</h3>

          {profileState.success && (
            <div className="success-message" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <CheckCircle size={16} /> {profileState.success}
            </div>
          )}
          {profileState.error && (
            <div className="form-error"><AlertCircle size={16} /> {profileState.error}</div>
          )}

          <form onSubmit={handleProfileSubmit} className="auth-form" style={{ marginTop: 0 }}>
            <label htmlFor="profile-name">
              Full name
              <input
                id="profile-name"
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                required
              />
            </label>
            <label htmlFor="profile-email">
              Email address
              <input id="profile-email" type="email" value={user?.email || ''} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
            </label>
            <label htmlFor="profile-phone">
              Phone number <span className="optional">(optional)</span>
              <input
                id="profile-phone"
                type="text"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              />
            </label>
            <button className="button primary" disabled={profileState.loading} id="save-profile">
              {profileState.loading ? <><LoaderCircle className="spin" size={16} /> Saving...</> : 'Save changes'}
            </button>
          </form>
        </div>

        {/* Change password */}
        <div className="admin-form profile-card">
          <h2 style={{ margin: '0 0 20px', fontSize: '1.3rem' }}>Change password</h2>

          {passState.success && (
            <div className="success-message" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <CheckCircle size={16} /> {passState.success}
            </div>
          )}
          {passState.error && (
            <div className="form-error"><AlertCircle size={16} /> {passState.error}</div>
          )}

          <form onSubmit={handlePasswordSubmit} className="auth-form">
            <PasswordField
              id="current-password"
              label="Current password"
              value={passForm.currentPassword}
              onChange={(e) => setPassForm({ ...passForm, currentPassword: e.target.value })}
              autoComplete="current-password"
            />
            <PasswordField
              id="new-password"
              label="New password (min 8 characters)"
              value={passForm.newPassword}
              onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
              autoComplete="new-password"
            />
            <PasswordField
              id="confirm-new-password"
              label="Confirm new password"
              value={passForm.confirmNewPassword}
              onChange={(e) => setPassForm({ ...passForm, confirmNewPassword: e.target.value })}
              autoComplete="new-password"
            />
            <button className="button primary" disabled={passState.loading} id="change-password">
              {passState.loading ? <><LoaderCircle className="spin" size={16} /> Updating...</> : 'Change password'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
