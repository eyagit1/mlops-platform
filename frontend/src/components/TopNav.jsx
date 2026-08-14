import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import itgateLogo from '../assets/itgate-logo.png';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/inference', label: 'Inference ML' },
  { to: '/documents', label: 'AI Documents' },
  { to: '/observabilite', label: 'Observability' },
  { to: '/admin', label: 'Admin / Deployment' },
];

function LogoutIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export default function TopNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="topnav">
      <div className="topnav-left">
        <img
          src={itgateLogo}
          alt="ITGate Logo"
          className="topnav-brand-logo"
        />
        <div className="brand-block">
          <div className="brand-title-small">ITGATE</div>
          <div className="brand-sub">MLOps Platform</div>
        </div>
      </div>

      <nav className="topnav-nav" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `topnav-item${isActive ? ' topnav-item-active' : ''}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="topnav-right">
        {user && (
          <div className="user-profile-badge" title={`Signed in as ${user.email}`}>
            <span className="user-avatar-small">{user.initials || 'A'}</span>
            <span className="user-email-text">{user.email}</span>
          </div>
        )}
        <button
          type="button"
          className="logout-nav-btn"
          onClick={handleLogout}
          title="Sign out of MLOps Platform"
        >
          <LogoutIcon />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
