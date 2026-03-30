// DELETE /api/hs-codes/master/[id] — unpin (soft-delete) an HS code

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { unpinHSCode } from '@/lib/hs-codes/master-service';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const removed = await unpinHSCode(session.user.id, id);

  if (!removed) {
    return NextResponse.json(
      { error: 'HS code not found or already removed' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
