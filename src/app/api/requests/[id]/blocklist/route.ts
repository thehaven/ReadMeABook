/**
 * Component: Request Blocklist API
 * Documentation: documentation/admin-features/release-blocklist.md
 *
 * DELETE /api/requests/[id]/blocklist
 *   → { success: true, count: number }
 *
 * Clears all blocked release entries for a given request.
 * Authorized for request owners and admins.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { prisma } from '@/lib/db';
import { RMABLogger } from '@/lib/utils/logger';
import { clearBlocklistForRequest } from '@/lib/services/blocklist.service';

const logger = RMABLogger.create('API.Requests.Blocklist');

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return requireAuth(request, async (req: AuthenticatedRequest) => {
    try {
      if (!req.user) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'User not authenticated' },
          { status: 401 }
        );
      }

      const { id } = await params;
      if (!id || typeof id !== 'string' || id.trim().length === 0) {
        return NextResponse.json({ error: 'Invalid request ID' }, { status: 400 });
      }

      const requestRecord = await prisma.request.findUnique({
        where: { id },
        select: { id: true, userId: true },
      });

      if (!requestRecord) {
        return NextResponse.json(
          { error: 'NotFound', message: 'Request not found' },
          { status: 404 }
        );
      }

      // Authorization check: owner or admin
      if (requestRecord.userId !== req.user.id && req.user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Forbidden', message: 'You do not have permission for this request' },
          { status: 403 }
        );
      }

      const { count } = await clearBlocklistForRequest(id);

      // Reset errorMessage if it was blocked-related
      await prisma.request.update({
        where: { id },
        data: {
          errorMessage: null,
          status: 'awaiting_search',
          updatedAt: new Date(),
        },
      });

      logger.info(`Cleared ${count} blocked releases for request ${id}`);

      return NextResponse.json({
        success: true,
        count,
        message: `Cleared ${count} blocked release(s)`,
      });
    } catch (error) {
      logger.error('Failed to clear blocklist for request', {
        error: error instanceof Error ? error.message : String(error),
      });
      return NextResponse.json(
        { error: 'Failed to clear blocklist' },
        { status: 500 }
      );
    }
  });
}
