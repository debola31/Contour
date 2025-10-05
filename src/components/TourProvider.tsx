'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useStore } from '@/store/useStore';
import Tour, { TourStep } from './Tour';
import { initialTour, pageTours, tourIds } from '@/config/tours';

export default function TourProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isTourCompleted = useStore((state) => state.isTourCompleted);
  const completeTour = useStore((state) => state.completeTour);
  const isAuthenticated = useStore((state) => state.isAuthenticated);

  const [currentTour, setCurrentTour] = useState<{ id: string; steps: TourStep[] } | null>(null);
  const [runTour, setRunTour] = useState(false);

  // Handle initial tour on first login
  useEffect(() => {
    if (!isAuthenticated) return;

    const hasSeenInitialTour = isTourCompleted(tourIds.initial);

    if (!hasSeenInitialTour) {
      // Delay to ensure DOM is ready
      const timer = setTimeout(() => {
        setCurrentTour({ id: tourIds.initial, steps: initialTour });
        setRunTour(true);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isTourCompleted]);

  // Handle page-specific tours
  useEffect(() => {
    if (!isAuthenticated || !pathname) return;

    const hasSeenInitialTour = isTourCompleted(tourIds.initial);
    if (!hasSeenInitialTour) return; // Wait for initial tour first

    const pageTour = pageTours[pathname];
    if (!pageTour) return;

    const hasSeenPageTour = isTourCompleted(pageTour.id);
    if (!hasSeenPageTour) {
      // Delay to ensure DOM is ready and user clicked the sidebar item
      const timer = setTimeout(() => {
        setCurrentTour(pageTour);
        setRunTour(true);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [pathname, isAuthenticated, isTourCompleted]);

  const handleTourComplete = () => {
    if (currentTour) {
      completeTour(currentTour.id);
    }
    setRunTour(false);
    setCurrentTour(null);
  };

  const handleTourSkip = () => {
    if (currentTour) {
      completeTour(currentTour.id);
    }
    setRunTour(false);
    setCurrentTour(null);
  };

  return (
    <>
      {children}
      {currentTour && (
        <Tour
          steps={currentTour.steps}
          run={runTour}
          onComplete={handleTourComplete}
          onSkip={handleTourSkip}
        />
      )}
    </>
  );
}
