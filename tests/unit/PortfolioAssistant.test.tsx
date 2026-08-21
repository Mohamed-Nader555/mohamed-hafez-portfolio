import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { PortfolioAssistant } from '@/components/ai/PortfolioAssistant';

it('opens an accessible assistant dialog and closes it with Escape', () => {
  render(
    <PortfolioAssistant
      activeRole="aiml"
      initialSuggestions={['How was Northstar built?']}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: /ask about my work/i }));
  expect(
    screen.getByRole('dialog', { name: /portfolio assistant/i }),
  ).toBeVisible();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).toBeNull();
});
