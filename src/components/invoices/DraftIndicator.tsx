// T037 [US5]: Draft indicator component showing save status
'use client';

import { formatDistanceToNow } from 'date-fns';

interface DraftIndicatorProps {
  isSaving: boolean;
  lastSaved: number | null; // Unix timestamp
  draftId: string | null;
}

export function DraftIndicator({ isSaving, lastSaved, draftId }: DraftIndicatorProps) {
  const getStatusText = () => {
    if (isSaving) {
      return 'Saving draft...';
    }

    if (lastSaved) {
      const timeAgo = formatDistanceToNow(lastSaved, { addSuffix: true });
      return `Draft saved ${timeAgo}`;
    }

    return 'Draft not saved yet';
  };

  const getStatusIcon = () => {
    if (isSaving) {
      return (
        <svg className="animate-spin h-4 w-4 text-[var(--primary)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      );
    }

    if (lastSaved) {
      return <span className="text-[var(--positive)] text-lg">✓</span>;
    }

    return <span className="text-[var(--foreground-subtle)] text-lg">○</span>;
  };

  const getStatusColor = () => {
    if (isSaving) return 'text-[var(--primary)]';
    if (lastSaved) return 'text-[var(--positive)]';
    return 'text-[var(--foreground-muted)]';
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-[var(--surface-2)] rounded-lg border border-[var(--border)]">
      {getStatusIcon()}
      <div className="flex flex-col">
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
        {draftId && (
          <span className="text-xs text-[var(--foreground-subtle)]">
            Draft ID: {draftId.slice(0, 8)}...
          </span>
        )}
      </div>
    </div>
  );
}
