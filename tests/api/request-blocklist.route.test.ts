/**
 * Component: Request Blocklist API Route Tests
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { createPrismaMock } from '../helpers/prisma';

const prismaMock = createPrismaMock();

vi.mock('@/lib/db', () => ({
  prisma: prismaMock,
}));

vi.mock('@/lib/middleware/auth', () => ({
  requireAuth: (req: any, handler: any) => handler({ ...req, user: { id: 'user-1', role: 'user' } }),
  requireAdmin: (req: any, handler: any) => handler(req),
}));

vi.mock('@/lib/services/blocklist.service', () => ({
  clearBlocklistForRequest: vi.fn().mockResolvedValue({ count: 3 }),
}));

describe('DELETE /api/requests/[id]/blocklist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('clears blocked releases for owned request and resets status', async () => {
    prismaMock.request.findUnique.mockResolvedValue({
      id: 'req-1',
      userId: 'user-1',
    });
    prismaMock.request.update.mockResolvedValue({ id: 'req-1', status: 'awaiting_search' });

    const { DELETE } = await import('@/app/api/requests/[id]/blocklist/route');
    const req = new NextRequest('http://localhost/api/requests/req-1/blocklist', { method: 'DELETE' });

    const res = await DELETE(req, { params: Promise.resolve({ id: 'req-1' }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.count).toBe(3);
    expect(prismaMock.request.update).toHaveBeenCalledWith({
      where: { id: 'req-1' },
      data: {
        errorMessage: null,
        status: 'awaiting_search',
        updatedAt: expect.any(Date),
      },
    });
  });

  it('rejects forbidden access if user does not own request and is not admin', async () => {
    prismaMock.request.findUnique.mockResolvedValue({
      id: 'req-1',
      userId: 'other-user',
    });

    const { DELETE } = await import('@/app/api/requests/[id]/blocklist/route');
    const req = new NextRequest('http://localhost/api/requests/req-1/blocklist', { method: 'DELETE' });

    const res = await DELETE(req, { params: Promise.resolve({ id: 'req-1' }) });
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.error).toBe('Forbidden');
  });
});
