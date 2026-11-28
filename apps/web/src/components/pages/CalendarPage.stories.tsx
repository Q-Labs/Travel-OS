import type { Meta, StoryObj } from '@storybook/react-vite';
import { CalendarPage } from './CalendarPage';

const meta = { component: CalendarPage, parameters: { layout: 'fullscreen' } } satisfies Meta<typeof CalendarPage> ;
export default meta;
type Story = StoryObj<typeof meta>;

/** The month grid on the app's fixed "today", with trips on the days they fall. */
export const Default: Story = {};
export const NoTrips: Story = { parameters: { app: { trips: [] } } };
