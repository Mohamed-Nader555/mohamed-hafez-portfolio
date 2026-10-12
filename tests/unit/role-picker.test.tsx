import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { roleBriefs } from '@/data/claims/role-briefs';

const mocks = vi.hoisted(() => ({ requestTurnstileToken: vi.fn() }));
vi.mock('@/components/ai/turnstile-client', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/components/ai/turnstile-client')
  >()),
  requestTurnstileToken: mocks.requestTurnstileToken,
}));
import { PortfolioAssistant } from '@/components/ai/PortfolioAssistant';

const fetchMock = vi.fn();

function openPanel() {
  render(<PortfolioAssistant activeRole="aiml" initialSuggestions={['Hi?']} />);
  fireEvent.click(
    screen.getByRole('button', {
      name: /open Mohamed AI portfolio assistant/i,
    }),
  );
}

beforeEach(() => {
  sessionStorage.clear();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('"Hiring for a role?" in the chat panel', () => {
  it('opens a picker with all 11 roles, shows the stored brief at once and never calls a model', async () => {
    openPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Hiring for a role?' }));

    const picker = await screen.findByRole('region', {
      name: /hiring for a role/i,
    });
    for (const brief of roleBriefs)
      expect(
        await within(picker).findByRole('button', { name: brief.title }),
      ).toBeVisible();

    const nlp = roleBriefs.find((b) => b.slug === 'nlp-engineer')!;
    fireEvent.click(within(picker).getByRole('button', { name: nlp.title }));

    const card = await screen.findByRole('article', { name: nlp.title });
    expect(within(card).getByText('Mohamed’s answer')).toBeVisible();
    expect(
      within(card).getByRole('heading', { name: 'Direct experience' }),
    ).toBeVisible();
    expect(
      within(card).getByText(nlp.direct[0]!.text, { exact: false }),
    ).toBeVisible();
    expect(
      within(card).getByRole('link', { name: /open the full page/i }),
    ).toHaveAttribute('href', `/hiring/${nlp.slug}`);

    // No question was sent, so no human check and no request to the API.
    expect(fetchMock).not.toHaveBeenCalled();
    expect(mocks.requestTurnstileToken).not.toHaveBeenCalled();
  });

  it('goes back to the list, and closes with the conversation view restored', async () => {
    openPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Hiring for a role?' }));
    const picker = await screen.findByRole('region', {
      name: /hiring for a role/i,
    });
    fireEvent.click(
      await within(picker).findByRole('button', {
        name: roleBriefs[0]!.title,
      }),
    );
    fireEvent.click(await screen.findByRole('button', { name: /all roles/i }));
    expect(
      await within(picker).findByRole('button', { name: roleBriefs[1]!.title }),
    ).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: /back to chat/i }));
    expect(
      screen.queryByRole('region', { name: /hiring for a role/i }),
    ).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Hiring for a role?' }),
    ).toBeVisible();
  });

  it('copies the brief as plain text', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    openPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Hiring for a role?' }));
    const picker = await screen.findByRole('region', {
      name: /hiring for a role/i,
    });
    const brief = roleBriefs[2]!;
    fireEvent.click(
      await within(picker).findByRole('button', { name: brief.title }),
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Copy brief' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    const text = writeText.mock.calls[0]![0] as string;
    expect(text.startsWith(brief.title)).toBe(true);
    expect(text).toContain('Direct experience');
    expect(text).toContain(brief.direct[0]!.text);
    expect(await screen.findByText('Copied')).toBeVisible();
  });
});
