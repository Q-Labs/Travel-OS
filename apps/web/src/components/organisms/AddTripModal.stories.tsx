import type { Meta, StoryObj } from '@storybook/react-vite';
import { AddTripModal } from './AddTripModal';

const meta = { component: AddTripModal, parameters: { layout: 'fullscreen' } } satisfies Meta<typeof AddTripModal>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The first step of the wizard. The next steps open from here. */
export const Default: Story = {};
