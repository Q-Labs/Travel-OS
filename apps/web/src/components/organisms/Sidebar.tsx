import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../../app/AppContext';
import { signOut } from '../../lib/db';
import { CATEGORIES } from '../../lib/utils';
import { CatPip } from '../atoms/CatPip';
import { Icon } from '../atoms/Icon';

export function Sidebar() {
  const {
    trips, inbox, categoryFilter, toggleCategoryFilter,
    tweaksOpen, setShowIntegrations, setTweaksOpen,
  } = useApp();
  const navigate = useNavigate();

  const pipelineCount = trips.filter((t) => t.stage !== 'archived').length;
  const archiveCount = trips.filter((t) => t.stage === 'archived').length;

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">T</div>
        <div className="brand-name">Travel OS</div>
      </div>

      <div className="nav-section">Views</div>
      <NavLink className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} to="pipeline">
        <Icon.Pipeline /> Pipeline <span className="count">{pipelineCount}</span>
      </NavLink>
      <NavLink className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} to="inbox">
        <Icon.Notes /> Inbox <span className="count">{inbox.length}</span>
      </NavLink>
      <NavLink className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} to="calendar">
        <Icon.Calendar /> Calendar
      </NavLink>
      <NavLink className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} to="archive">
        <Icon.Archive /> Archive <span className="count">{archiveCount}</span>
      </NavLink>

      <div className="nav-section">Categories</div>
      {CATEGORIES.map((c) => {
        const n = trips.filter((t) => t.categories.includes(c.key) && t.stage !== 'archived').length;
        if (n === 0) return null;
        const active = categoryFilter.includes(c.key);
        return (
          <button
            key={c.key}
            className="nav-item"
            onClick={() => toggleCategoryFilter(c.key)}
            style={active ? { background: 'var(--divider)' } : undefined}
          >
            <CatPip color={c.color} size={10} />
            {c.label} <span className="count">{n}</span>
          </button>
        );
      })}

      <div className="nav-section">Tools</div>
      <button className="nav-item" onClick={() => setShowIntegrations(true)}>
        <Icon.Sparkle /> Integrations
      </button>
      <button className="nav-item" onClick={() => setTweaksOpen(!tweaksOpen)}>
        <Icon.Sliders /> Tweaks
      </button>
      <button className="nav-item">
        <Icon.Settings /> Settings
      </button>

      <div className="sidebar-footer">
        <div className="avatar">Q</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 500, fontSize: 12.5 }}>Quincy</div>
          <div style={{ fontSize: 11 }}>Cherry Hill, NJ</div>
        </div>
        <button
          className="icon-btn"
          title="Sign out"
          aria-label="Sign out"
          onClick={() => { void signOut().then(() => navigate('/login')); }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M5.5 2H2.5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3M9.5 10l3-3-3-3M12.5 7h-7" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </aside>
  );
}
