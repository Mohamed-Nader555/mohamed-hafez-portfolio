import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requestTurnstileToken: vi.fn(),
  submitChatTurn: vi.fn(),
}));

vi.mock('@/components/ai/turnstile-client', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/components/ai/turnstile-client')
  >()),
  requestTurnstileToken: mocks.requestTurnstileToken,
}));
vi.mock('@/components/ai/chat-client', () => ({
  submitChatTurn: mocks.submitChatTurn,
}));
import { PortfolioAssistant } from '@/components/ai/PortfolioAssistant';

beforeEach(() => {
  sessionStorage.clear();
  mocks.requestTurnstileToken.mockResolvedValue('verified-token');
  mocks.submitChatTurn.mockReset();
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

it('opens an accessible assistant dialog and closes it with Escape', () => {
  render(
    <PortfolioAssistant
      activeRole="aiml"
      initialSuggestions={['How was Northstar built?']}
    />,
  );
  fireEvent.click(
    screen.getByRole('button', {
      name: /open Mohamed AI portfolio assistant/i,
    }),
  );
  expect(
    screen.getByRole('dialog', { name: /Mohamed AI portfolio assistant/i }),
  ).toBeVisible();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).toBeNull();
});

it('presents a grounded AI console with role context and usable prompts', () => {
  render(
    <PortfolioAssistant
      activeRole="aiml"
      initialSuggestions={['How was Northstar built?']}
    />,
  );

  fireEvent.click(
    screen.getByRole('button', {
      name: /open Mohamed AI portfolio assistant/i,
    }),
  );

  const dialog = screen.getByRole('dialog', {
    name: /Mohamed AI portfolio assistant/i,
  });
  expect(
    within(dialog).getByRole('heading', {
      name: /grounded portfolio intelligence/i,
    }),
  ).toBeVisible();
  expect(within(dialog).getByText(/AI & ML context/i)).toBeVisible();
  expect(
    within(dialog).getByText(/verified portfolio evidence/i),
  ).toBeVisible();

  fireEvent.click(
    within(dialog).getByRole('button', { name: 'How was Northstar built?' }),
  );
  expect(
    within(dialog).getByRole('textbox', { name: /your question/i }),
  ).toHaveValue('How was Northstar built?');
});

it('clears the composer as soon as a question is submitted', async () => {
  mocks.submitChatTurn.mockReturnValue(new Promise(() => {}));
  render(
    <PortfolioAssistant
      activeRole="aiml"
      initialSuggestions={['How was Northstar built?']}
    />,
  );
  fireEvent.click(
    screen.getByRole('button', {
      name: /open Mohamed AI portfolio assistant/i,
    }),
  );
  const textbox = screen.getByRole('textbox', { name: /your question/i });
  fireEvent.change(textbox, {
    target: { value: 'What technologies did Mohamed use in Dostava?' },
  });
  fireEvent.click(screen.getByRole('button', { name: /send question/i }));

  await waitFor(() => expect(textbox).toHaveValue(''));
});
