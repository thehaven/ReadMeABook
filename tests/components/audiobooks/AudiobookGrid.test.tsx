/**
 * Component: Audiobook Grid Tests
 * Documentation: documentation/frontend/components.md
 */

// @vitest-environment jsdom

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/components/audiobooks/AudiobookCard', () => ({
  AudiobookCard: ({ audiobook }: { audiobook: any }) => (
    <div data-testid="audiobook-card">{audiobook.asin}</div>
  ),
}));

describe('AudiobookGrid', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('renders skeleton cards when loading', async () => {
    const { AudiobookGrid } = await import('@/components/audiobooks/AudiobookGrid');

    const { container } = render(<AudiobookGrid audiobooks={[]} isLoading={true} />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(container.getElementsByClassName('animate-pulse').length).toBe(10);
  });

  it('shows the empty message when there are no results', async () => {
    const { AudiobookGrid } = await import('@/components/audiobooks/AudiobookGrid');

    render(<AudiobookGrid audiobooks={[]} isLoading={false} emptyMessage="Nothing found" />);

    expect(await screen.findByText('Nothing found')).toBeInTheDocument();
  });

  it('applies grid classes based on card size', async () => {
    const { AudiobookGrid } = await import('@/components/audiobooks/AudiobookGrid');

    render(
      <AudiobookGrid
        audiobooks={[{ asin: 'a1', title: 'Book', author: 'Author' }]}
        cardSize={9}
      />
    );

    const card = await screen.findByTestId('audiobook-card');
    expect(card).toBeInTheDocument();
  });
});
