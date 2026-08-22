import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { PortfolioAssistant } from '@/components/ai/PortfolioAssistant';

afterEach(cleanup);

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
