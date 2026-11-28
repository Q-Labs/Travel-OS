import type { Meta, StoryObj } from '@storybook/react-vite';
import { BOOKING_ICONS, Icon } from './Icon';

const meta = {} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const grid = { display: 'flex', flexWrap: 'wrap', gap: 24, color: 'var(--ink)' } as const;
const cell = { display: 'grid', justifyItems: 'center', gap: 6, fontSize: 12, width: 84 } as const;

/** Every icon in the set, by the name used to pick it, such as `Icon.Plus`. */
export const AllIcons: Story = {
  render: () => (
    <div style={grid}>
      {Object.entries(Icon).map(([name, Glyph]) => (
        <div key={name} style={cell}>
          <Glyph style={{ width: 28, height: 28 }} />
          {name}
        </div>
      ))}
    </div>
  ),
};

/** The icon each booking category uses. */
export const BookingIcons: Story = {
  render: () => (
    <div style={grid}>
      {Object.entries(BOOKING_ICONS).map(([category, Glyph]) => (
        <div key={category} style={cell}>
          <Glyph style={{ width: 28, height: 28 }} />
          {category}
        </div>
      ))}
    </div>
  ),
};
