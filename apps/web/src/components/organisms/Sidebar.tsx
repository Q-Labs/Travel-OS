import { NavLink, useNavigate } from 'react-router-dom';
import { LogoMark, NavItem, Sidebar as CobaltSidebar, UserBlock } from '@q-labs/cobalt';
import { useApp } from '../../app/AppContext';
import { signOut } from '../../lib/db';
import { CATEGORIES } from '../../lib/utils';
import { CatPip } from '../atoms/CatPip';
import { Icon } from '../atoms/Icon';

// Cobalt's NavItem is presentational, so interactive ones get button semantics here.
const asButton = (onClick: () => void) => ({
  role: 'button' as const,
  tabIndex: 0,
  onClick,
  onKeyDown: (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  },
});

/**
 * The signed-in navigation: the Pipeline, Inbox, Calendar and Archive views
 * with their counts, the trip-category filters, the buttons for Integrations
 * and Tweaks, and sign-out.
 */
export function Sidebar() {
  const {
    trips, inbox, categoryFilter, toggleCategoryFilter,
    tweaksOpen, setShowIntegrations, setTweaksOpen,
  } = useApp();
  const navigate = useNavigate();

  const pipelineCount = trips.filter((t) => t.stage !== 'archived').length;
  const archiveCount = trips.filter((t) => t.stage === 'archived').length;

  const view = (to: string, label: string, icon: React.ReactNode, count?: number) => (
    <NavLink to={to} className="nav-link">
      {({ isActive }) => <NavItem label={label} icon={icon} count={count} active={isActive} />}
    </NavLink>
  );

  return (
    <CobaltSidebar
      logo={
        <div className="brand">
          <LogoMark name="quincy-os" size={28} />
          <div className="brand-name">Travel OS</div>
        </div>
      }
      footer={
        <div className="sidebar-footer">
          <UserBlock name="Quincy" status="Cherry Hill, NJ" />
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
      }
    >
      <div className="nav-section">Views</div>
      {view('pipeline', 'Pipeline', <Icon.Pipeline />, pipelineCount)}
      {view('inbox', 'Inbox', <Icon.Notes />, inbox.length)}
      {view('calendar', 'Calendar', <Icon.Calendar />)}
      {view('archive', 'Archive', <Icon.Archive />, archiveCount)}

      <div className="nav-section">Categories</div>
      {CATEGORIES.map((c) => {
        const n = trips.filter((t) => t.categories.includes(c.key) && t.stage !== 'archived').length;
        if (n === 0) return null;
        return (
          <NavItem
            key={c.key}
            label={c.label}
            icon={<CatPip color={c.color} size={10} />}
            count={n}
            active={categoryFilter.includes(c.key)}
            aria-pressed={categoryFilter.includes(c.key)}
            {...asButton(() => toggleCategoryFilter(c.key))}
          />
        );
      })}

      <div className="nav-section">Tools</div>
      <NavItem label="Integrations" icon={<Icon.Sparkle />} {...asButton(() => setShowIntegrations(true))} />
      <NavItem label="Tweaks" icon={<Icon.Sliders />} {...asButton(() => setTweaksOpen(!tweaksOpen))} />
      <NavItem label="Settings" icon={<Icon.Settings />} {...asButton(() => {})} />
    </CobaltSidebar>
  );
}
