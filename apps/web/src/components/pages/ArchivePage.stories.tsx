import type { Meta, StoryObj } from '@storybook/react-vite';
import { TRIPS } from '../../lib/data';
import { ArchivePage } from './ArchivePage';

const meta = { component: ArchivePage, parameters: { layout: 'fullscreen' } } satisfies Meta<typeof ArchivePage>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
/** With only trips still in the pipeline, the archive is empty. */
export const NothingArchived: Story = { parameters: { app: { trips: TRIPS.filter((t) => t.stage !== 'archived') } } };
