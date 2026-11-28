import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, mocked, userEvent } from 'storybook/test';
import { signInWithMagicLink, signInWithPassword } from '../../lib/db';
import { LoginPage } from './LoginPage';

const meta = { component: LoginPage, parameters: { layout: 'fullscreen' } } satisfies Meta<typeof LoginPage>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The sign-in form, on a magic link. The submit button waits for an email address. */
export const MagicLinkForm: Story = {};

export const PasswordForm: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Password' }));
    await expect(canvas.getByLabelText('Password', { selector: 'input' })).toBeVisible();
  },
};

/** After the link is sent, the page says to check the email. */
export const LinkSent: Story = {
  beforeEach: () => {
    mocked(signInWithMagicLink).mockResolvedValue({ error: null });
  },
  play: async ({ canvas }) => {
    await userEvent.type(canvas.getByLabelText('Email address'), 'quincy@example.com');
    await userEvent.click(canvas.getByRole('button', { name: 'Send magic link' }));
    await expect(await canvas.findByText('Check your email')).toBeVisible();
  },
};

/** A failed sign-in shows its message in an alert and leaves the form usable. */
export const SignInFailed: Story = {
  beforeEach: () => {
    mocked(signInWithPassword).mockResolvedValue({ error: new Error('Invalid login credentials') });
  },
  play: async ({ canvas }) => {
    await userEvent.type(canvas.getByLabelText('Email address'), 'quincy@example.com');
    await userEvent.click(canvas.getByRole('button', { name: 'Password' }));
    await userEvent.type(canvas.getByLabelText('Password', { selector: 'input' }), 'wrong-password');
    await userEvent.click(canvas.getByRole('button', { name: 'Sign in' }));
    await expect(await canvas.findByRole('alert')).toHaveTextContent('Invalid login credentials');
  },
};
