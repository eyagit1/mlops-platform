import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/inference', label: 'Inference ML' },
  { to: '/documents', label: 'AI Documents' },
  { to: '/observabilite', label: 'Observability' },
  { to: '/admin', label: 'Admin / Deployment' },
];

export default function TopNav() {
  return (
    <header className="topnav">
      <div className="topnav-left">
        <div className="logo-mark topnav-logo">IT</div>
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
        <button type="button" className="cmd-btn" title="Command palette">⌘</button>
      </div>
    </header>
  );
}
