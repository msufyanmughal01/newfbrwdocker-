'use client';

// T062: Error boundary for FBR components — prevents crashes from propagating to the entire form
import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class FBRErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('FBR component error:', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="rounded-lg border border-[var(--warning)]/20 bg-[var(--warning-bg)] px-3 py-2 text-xs text-[var(--warning)]">
          This feature is temporarily unavailable. Please refresh or continue manually.
        </div>
      );
    }
    return this.props.children;
  }
}
