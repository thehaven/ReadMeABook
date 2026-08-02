/**
 * Component: Audiobook Card Tests
 * Documentation: documentation/frontend/components.md
 */

// @vitest-environment jsdom

import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const createRequestMock = vi.hoisted(() => vi.fn());
const authState = {
  user: null as null | { id: string; username: string },
};

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => authState,
}));

vi.mock('@/lib/hooks/useRequests', () => ({
  useCreateRequest: () => ({ createRequest: createRequestMock, isLoading: false }),
}));

vi.mock('@/components/audiobooks/AudiobookDetailsModal', () => ({
  AudiobookDetailsModal: ({ isOpen }: { isOpen: boolean }) => (
    <div data-testid="details-modal" data-open={String(isOpen)} />
  ),
}));

vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

const baseAudiobook = {
  asin: 'asin-1',
  title: 'Test Book',
  author: 'Author',
};

describe('AudiobookCard', () => {
  beforeEach(() => {
    authState.user = null;
    createRequestMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('disables requests when no user is logged in', async () => {
    const { AudiobookCard } = await import('@/components/audiobooks/AudiobookCard');

    render(<AudiobookCard audiobook={baseAudiobook} />);

    const requestButton = await screen.findByRole('button', { name: 'Sign in to Request' });
    expect(requestButton).toBeDisabled();
    expect(createRequestMock).not.toHaveBeenCalled();
  });

  it('creates a request and shows a success toast', async () => {
    authState.user = { id: 'user-1', username: 'user' };
    createRequestMock.mockResolvedValueOnce(undefined);

    const onRequestSuccess = vi.fn();
    const { AudiobookCard } = await import('@/components/audiobooks/AudiobookCard');

    render(<AudiobookCard audiobook={baseAudiobook} onRequestSuccess={onRequestSuccess} />);

    const button = await screen.findByRole('button', { name: 'Request' });
    fireEvent.click(button);

    const requestPromise = createRequestMock.mock.results[0]?.value;
    await act(async () => {
      await requestPromise;
    });

    expect(createRequestMock).toHaveBeenCalledWith(baseAudiobook);
    expect(onRequestSuccess).toHaveBeenCalled();

    expect(await screen.findByText(/Request created!/)).toBeInTheDocument();
  });

  it('shows in-library state when available', async () => {
    const { AudiobookCard } = await import('@/components/audiobooks/AudiobookCard');

    render(<AudiobookCard audiobook={{ ...baseAudiobook, isAvailable: true }} />);

    expect(await screen.findByText('In Your Library')).toBeInTheDocument();
  });

  it('opens the details modal when the title is clicked', async () => {
    const { AudiobookCard } = await import('@/components/audiobooks/AudiobookCard');

    render(<AudiobookCard audiobook={baseAudiobook} />);

    const modal = await screen.findByTestId('details-modal');
    expect(modal).toHaveAttribute('data-open', 'false');

    const titleElement = await screen.findByText('Test Book');
    await act(async () => {
      fireEvent.click(titleElement);
    });

    expect(modal).toHaveAttribute('data-open', 'true');
  });

  it('shows in-library state for downloaded or available requests', async () => {
    const { AudiobookCard } = await import('@/components/audiobooks/AudiobookCard');

    render(
      <AudiobookCard
        audiobook={{ ...baseAudiobook, isRequested: true, requestStatus: 'available' }}
      />
    );

    expect(await screen.findByText('In Your Library')).toBeInTheDocument();
  });

  it('shows processing state for active downloading requests', async () => {
    const { AudiobookCard } = await import('@/components/audiobooks/AudiobookCard');

    render(
      <AudiobookCard
        audiobook={{ ...baseAudiobook, isRequested: true, requestStatus: 'downloading' }}
      />
    );

    expect(await screen.findByText('Processing')).toBeInTheDocument();
  });

  it('shows pending status for awaiting_approval requests', async () => {
    const { AudiobookCard } = await import('@/components/audiobooks/AudiobookCard');

    render(
      <AudiobookCard
        audiobook={{
          ...baseAudiobook,
          isRequested: true,
          requestStatus: 'awaiting_approval',
          requestedByUsername: 'alice',
        }}
      />
    );

    expect(await screen.findByText('Requested')).toBeInTheDocument();
  });

  it('allows re-requesting for denied status', async () => {
    authState.user = { id: 'user-1', username: 'user' };
    const { AudiobookCard } = await import('@/components/audiobooks/AudiobookCard');

    render(
      <AudiobookCard
        audiobook={{ ...baseAudiobook, isRequested: true, requestStatus: 'denied' }}
      />
    );

    expect(await screen.findByRole('button', { name: 'Request' })).toBeInTheDocument();
  });

  it('shows an error when a request fails', async () => {
    authState.user = { id: 'user-1', username: 'user' };
    createRequestMock.mockRejectedValueOnce(new Error('Request failed'));

    const { AudiobookCard } = await import('@/components/audiobooks/AudiobookCard');

    render(<AudiobookCard audiobook={baseAudiobook} />);

    const button = await screen.findByRole('button', { name: 'Request' });
    await act(async () => {
      fireEvent.click(button);
    });

    expect(await screen.findByText('Request failed')).toBeInTheDocument();
  });
});
