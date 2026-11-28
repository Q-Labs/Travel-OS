import { Button, Input, Topbar as CobaltTopbar } from '@q-labs/cobalt';
import { useApp } from '../../app/AppContext';
import { Icon } from '../atoms/Icon';

/** The page header: a title with a line under it, the trip search box and the New trip button. */
export function Topbar({ title, subtitle }: { title: string; subtitle: string }) {
  const { search, setSearch, setShowModal } = useApp();
  return (
    <CobaltTopbar
      title={title}
      meta={subtitle}
      titleAs="h1"
      actions={
        <>
          <div className="search">
            <Icon.Search />
            <Input
              placeholder="Search destinations…"
              aria-label="Search trips"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="primary" onClick={() => setShowModal(true)}>
            <Icon.Plus /> New trip
          </Button>
        </>
      }
    />
  );
}
