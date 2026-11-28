import type { Meta, StoryObj } from '@storybook/react-vite';
import { AuthLayout } from './AuthLayout';

const meta = { component: AuthLayout, parameters: { layout: 'fullscreen' } } satisfies Meta<typeof AuthLayout>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    aside: (
      <div className="login-left-foot">
        <p className="login-tagline">Every trip, in one place.</p>
        <p className="login-tagline-sub">Pipeline, itinerary, bookings, budget.</p>
      </div>
    ),
    children: <h2 className="login-heading">Welcome back</h2>,
  },
};
