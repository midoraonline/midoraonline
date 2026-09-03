'use client';

import { useEffect, useRef, ReactNode } from 'react';
import { registerAnalyticsSubscribers } from '@/lib/analytics/subscribers';

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      registerAnalyticsSubscribers();
      initialized.current = true;
    }
  }, []);

  return <>{children}</>;
}