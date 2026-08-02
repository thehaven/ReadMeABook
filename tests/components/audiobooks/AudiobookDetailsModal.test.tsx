/**
 * Component: Audiobook Details Modal Tests
 * Documentation: documentation/frontend/components.md
 */

// @vitest-environment jsdom

import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const useAuthMock = vi.hoisted(() => vi.fn());
const useAudiobookDetailsMock = vi.hoisted(() => vi.fn());
const createRequestMock = vi.hoisted(() => vi.fn());
const fetchEbookMock = vi.hoisted(() => vi.fn());
const revalidateEbookStatusMock = vi.hoisted(() => vi.fn());

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('@/contexts/PreferencesContext', () => ({
  usePreferences: () => ({ squareCovers: false, setSquareCovers: vi.fn(), cardSize: 5, setCardSize: vi.fn() }),
}));

vi.mock('@/lib/hooks/useAudiobooks', () => ({
  useAudiobookDetails: (asin: string | null) => useAudiobookDetailsMock(asin),
}));

vi.mock('@/lib/hooks/useRequests', () => ({
  useCreateRequest: () => ({ createRequest: createRequestMock, isLoading: false }),
  useEbookStatus: () => ({
    ebookStatus: { ebookSourcesEnabled: false, hasActiveEbookRequest: false },
    revalidate: revalidateEbookStatusMock,
  }),
  useDownloadStatus: () => ({ downloadAvailable: false, requestId: null }),
  useFetchEbookByAsin: () => ({ fetchEbook: fetchEbookMock, isLoading: false }),
}));

vi.mock('@/components/requests/InteractiveTorrentSearchModal', () => ({
  InteractiveTorrentSearchModal: ({ isOpen, requestId }: { isOpen: boolean; requestId?: string }) => (
    <div
      data-testid="interactive-modal"
      data-open={String(isOpen)}
      data-request-id={requestId ?? ''}
    />
  ),
}));

vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

const audiobookDetails = {
  asin: 'ASIN123',
  title: 'Detail Book',
  author: 'Detail Author',
  description: 'Summary',
  rating: 4.2,
  durationMinutes: 320,
  releaseDate: '2023-01-01',
  genres: ['Fantasy'],
};

describe('AudiobookDetailsModal', () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({ user: { id: 'user-1', username: 'user' } });
    useAudiobookDetailsMock.mockReturnValue({
      audiobook: audiobookDetails,
      isLoading: false,
      error: null,
    });
    createRequestMock.mockReset();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders audiobook details and closes when requested', async () => {
    const onClose = vi.fn();
    const { AudiobookDetailsModal } = await import('@/components/audiobooks/AudiobookDetailsModal');

    render(
      <AudiobookDetailsModal
        asin="ASIN123"
        isOpen={true}
        onClose={onClose}
      />
    );

    expect(await screen.findByText('Detail Book')).toBeInTheDocument();
    expect(document.body.style.overflow).toBe('hidden');

    const closeButtons = await screen.findAllByRole('button', { name: 'Close' });
    fireEvent.click(closeButtons[0]);
    expect(onClose).toHaveBeenCalled();
  });

  it('creates requests and auto-closes after success', async () => {
    createRequestMock.mockResolvedValueOnce(undefined);
    const onClose = vi.fn();
    const onRequestSuccess = vi.fn();
    const { AudiobookDetailsModal } = await import('@/components/audiobooks/AudiobookDetailsModal');

    render(
      <AudiobookDetailsModal
        asin="ASIN123"
        isOpen={true}
        onClose={onClose}
        onRequestSuccess={onRequestSuccess}
      />
    );

    const requestButton = await screen.findByRole('button', { name: 'Request Audiobook' });
    await act(async () => {
      fireEvent.click(requestButton);
    });

    expect(onRequestSuccess).toHaveBeenCalled();
    expect(await screen.findByText(/Request created!/)).toBeInTheDocument();
  });

  it('copies the ASIN to the clipboard', async () => {
    const { AudiobookDetailsModal } = await import('@/components/audiobooks/AudiobookDetailsModal');

    render(
      <AudiobookDetailsModal
        asin="ASIN123"
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    const asinButton = await screen.findByText('ASIN123');
    await act(async () => {
      fireEvent.click(asinButton.closest('button') as HTMLButtonElement);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ASIN123');
  });

  it('shows an error state when details fail to load', async () => {
    useAudiobookDetailsMock.mockReturnValue({
      audiobook: null,
      isLoading: false,
      error: 'boom',
    });
    const { AudiobookDetailsModal } = await import('@/components/audiobooks/AudiobookDetailsModal');

    render(
      <AudiobookDetailsModal
        asin="ASIN123"
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    expect(await screen.findByText('Failed to load details')).toBeInTheDocument();
  });

  it('shows availability state and hides interactive search when available', async () => {
    const { AudiobookDetailsModal } = await import('@/components/audiobooks/AudiobookDetailsModal');

    render(
      <AudiobookDetailsModal
        asin="ASIN123"
        isOpen={true}
        onClose={vi.fn()}
        isAvailable={true}
      />
    );

    expect((await screen.findAllByText('In Your Library')).length).toBeGreaterThan(0);
    expect(screen.queryByTitle('Interactive Search')).toBeNull();
  });

  it('shows pending approval status with requester name', async () => {
    const { AudiobookDetailsModal } = await import('@/components/audiobooks/AudiobookDetailsModal');

    render(
      <AudiobookDetailsModal
        asin="ASIN123"
        isOpen={true}
        onClose={vi.fn()}
        isRequested={true}
        requestStatus="awaiting_approval"
        requestedByUsername="alice"
      />
    );

    expect(await screen.findByRole('button', { name: /Pending Approval \(alice\)/ })).toBeDisabled();
  });

  it('shows request button for denied status (allows re-request)', async () => {
    const { AudiobookDetailsModal } = await import('@/components/audiobooks/AudiobookDetailsModal');

    render(
      <AudiobookDetailsModal
        asin="ASIN123"
        isOpen={true}
        onClose={vi.fn()}
        isRequested={true}
        requestStatus="denied"
      />
    );

    expect(await screen.findByRole('button', { name: 'Request Audiobook' })).toBeInTheDocument();
  });

  it('does not show rating badge when rating is zero', async () => {
    useAudiobookDetailsMock.mockReturnValue({
      audiobook: { ...audiobookDetails, rating: 0 },
      isLoading: false,
      error: null,
    });
    const { AudiobookDetailsModal } = await import('@/components/audiobooks/AudiobookDetailsModal');

    render(
      <AudiobookDetailsModal
        asin="ASIN123"
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    await act(async () => {});
    expect(screen.queryByText('0.0')).toBeNull();
  });

  it('opens interactive search when requested', async () => {
    const { AudiobookDetailsModal } = await import('@/components/audiobooks/AudiobookDetailsModal');

    render(
      <AudiobookDetailsModal
        asin="ASIN123"
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByTestId('interactive-modal')).toBeNull();

    const searchBtn = await screen.findByTitle('Interactive Search');
    await act(async () => {
      fireEvent.click(searchBtn);
    });

    expect(screen.getByTestId('interactive-modal')).toHaveAttribute('data-open', 'true');
  });

  it('shows request error and clears it after timeout', async () => {
    createRequestMock.mockRejectedValueOnce(new Error('Request failed'));
    const { AudiobookDetailsModal } = await import('@/components/audiobooks/AudiobookDetailsModal');

    render(
      <AudiobookDetailsModal
        asin="ASIN123"
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    const btn = await screen.findByRole('button', { name: 'Request Audiobook' });
    await act(async () => {
      fireEvent.click(btn);
    });

    expect(await screen.findByText('Request failed')).toBeInTheDocument();
  });

  it('renders sticky footer with status pill and admin icons when opened from a pending request', async () => {
    useAuthMock.mockReturnValue({ user: { id: 'admin-1', username: 'admin', role: 'admin' } });
    const { AudiobookDetailsModal } = await import('@/components/audiobooks/AudiobookDetailsModal');

    render(
      <AudiobookDetailsModal
        asin="ASIN123"
        isOpen={true}
        onClose={vi.fn()}
        requestStatus="pending"
        isAvailable={false}
      />
    );

    const statusPill = await screen.findByRole('button', { name: 'Requested' });
    expect(statusPill).toBeDisabled();
    expect(await screen.findByTitle('Interactive Search')).toBeInTheDocument();
    expect(await screen.findByTitle('Manual Import')).toBeInTheDocument();
  });

  describe('Interactive Search routing (advance vs. create)', () => {
    const openInteractiveAndReadForwardedRequestId = async (props: {
      user: { id: string; username: string; role?: string };
      requestStatus?: string | null;
      requestId?: string | null;
      requestedByUserId?: string | null;
    }) => {
      useAuthMock.mockReturnValue({ user: props.user });
      const { AudiobookDetailsModal } = await import('@/components/audiobooks/AudiobookDetailsModal');

      render(
        <AudiobookDetailsModal
          asin="ASIN123"
          isOpen={true}
          onClose={vi.fn()}
          requestStatus={props.requestStatus ?? null}
          requestId={props.requestId ?? null}
          requestedByUserId={props.requestedByUserId ?? null}
        />
      );

      const searchButton = await screen.findByTitle('Interactive Search');
      await act(async () => {
        fireEvent.click(searchButton);
      });
      const modal = await screen.findByTestId('interactive-modal');
      return modal.getAttribute('data-request-id') ?? '';
    };

    it.each(['pending', 'failed', 'awaiting_search', 'awaiting_release'])(
      'forwards requestId when own user has an advanceable %s request',
      async (status) => {
        const forwarded = await openInteractiveAndReadForwardedRequestId({
          user: { id: 'user-1', username: 'u' },
          requestStatus: status,
          requestId: 'req-advance',
          requestedByUserId: 'user-1',
        });
        expect(forwarded).toBe('req-advance');
      }
    );

    it.each(['awaiting_approval', 'searching', 'downloading', 'processing', 'denied'])(
      'does NOT forward requestId when own status is %s (blocked / non-advanceable)',
      async (status) => {
        const forwarded = await openInteractiveAndReadForwardedRequestId({
          user: { id: 'user-1', username: 'u' },
          requestStatus: status,
          requestId: 'req-x',
          requestedByUserId: 'user-1',
        });
        expect(forwarded).toBe('');
      }
    );

    it('does NOT forward requestId for a non-admin viewing another user\'s awaiting_search request', async () => {
      const forwarded = await openInteractiveAndReadForwardedRequestId({
        user: { id: 'user-2', username: 'other' },
        requestStatus: 'awaiting_search',
        requestId: 'req-from-user-1',
        requestedByUserId: 'user-1',
      });
      expect(forwarded).toBe('');
    });

    it('forwards requestId for an admin viewing another user\'s awaiting_search request', async () => {
      const forwarded = await openInteractiveAndReadForwardedRequestId({
        user: { id: 'admin-1', username: 'admin', role: 'admin' },
        requestStatus: 'awaiting_search',
        requestId: 'req-from-user-1',
        requestedByUserId: 'user-1',
      });
      expect(forwarded).toBe('req-from-user-1');
    });

    it('does NOT forward requestId when caller omits requestId entirely', async () => {
      const forwarded = await openInteractiveAndReadForwardedRequestId({
        user: { id: 'user-1', username: 'u' },
        requestStatus: 'awaiting_search',
        requestId: null,
        requestedByUserId: 'user-1',
      });
      expect(forwarded).toBe('');
    });
  });
});
