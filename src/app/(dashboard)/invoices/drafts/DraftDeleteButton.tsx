'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function DraftDeleteButton({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm('Delete this draft? This cannot be undone.')) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, { method: 'DELETE' });
      if (res.ok) router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="text-[var(--error)] hover:opacity-80 text-xs font-medium disabled:opacity-50"
    >
      {deleting ? 'Deleting...' : 'Delete'}
    </button>
  );
}
