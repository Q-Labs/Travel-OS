import { useApp } from '../../app/AppContext';
import { Icon } from '../atoms/Icon';

export function Topbar({ title, subtitle }: { title: string; subtitle: string }) {
  const { search, setSearch, setShowModal } = useApp();
  return (
    <div className="topbar">
      <div>
        <h1>{title}</h1>
        <div className="subtitle">{subtitle}</div>
      </div>
      <div className="spacer" />
      <div className="search">
        <Icon.Search />
        <input
          placeholder="Search destinations…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <button className="btn primary" onClick={() => setShowModal(true)}>
        <Icon.Plus /> New trip
      </button>
    </div>
  );
}
