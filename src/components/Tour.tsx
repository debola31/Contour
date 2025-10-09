'use client';

import { useState, useEffect, useRef } from 'react';

export interface TourStep {
  target: string; // CSS selector
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  disableBeacon?: boolean;
}

interface TourProps {
  steps: TourStep[];
  run: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export default function Tour({ steps, run, onComplete, onSkip }: TourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [arrowPosition, setArrowPosition] = useState({ top: 0, left: 0 });
  const [isPositioned, setIsPositioned] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!run || steps.length === 0) return;

    setIsPositioned(false);

    const updatePosition = () => {
      const step = steps[currentStep];
      const element = document.querySelector(step.target);

      if (!element || !tooltipRef.current) {
        // Retry if tooltip not ready
        setTimeout(updatePosition, 50);
        return;
      }

      const rect = element.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const placement = step.placement || 'bottom';

      let top = 0;
      let left = 0;
      let arrowTop = 0;
      let arrowLeft = 0;

      switch (placement) {
        case 'bottom':
          top = rect.bottom + window.scrollY + 10;
          left = rect.left + window.scrollX + rect.width / 2 - tooltipRect.width / 2;
          arrowTop = -8;
          arrowLeft = tooltipRect.width / 2 - 8;
          break;
        case 'top':
          top = rect.top + window.scrollY - tooltipRect.height - 10;
          left = rect.left + window.scrollX + rect.width / 2 - tooltipRect.width / 2;
          arrowTop = tooltipRect.height;
          arrowLeft = tooltipRect.width / 2 - 8;
          break;
        case 'right':
          top = rect.top + window.scrollY + rect.height / 2 - tooltipRect.height / 2;
          left = rect.right + window.scrollX + 10;
          arrowTop = tooltipRect.height / 2 - 8;
          arrowLeft = -8;
          break;
        case 'left':
          top = rect.top + window.scrollY + rect.height / 2 - tooltipRect.height / 2;
          left = rect.left + window.scrollX - tooltipRect.width - 10;
          arrowTop = tooltipRect.height / 2 - 8;
          arrowLeft = tooltipRect.width;
          break;
      }

      setPosition({ top, left });
      setArrowPosition({ top: arrowTop, left: arrowLeft });
      setIsPositioned(true);

      // Highlight the element
      element.classList.add('tour-highlight');

      // Scroll element into view and center it
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      });
    };

    // Initial delay to ensure DOM is ready
    const initialTimer = setTimeout(updatePosition, 50);

    // Additional update after scroll completes
    const scrollTimer = setTimeout(updatePosition, 300);

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      clearTimeout(initialTimer);
      clearTimeout(scrollTimer);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);

      // Remove highlight from all elements
      document.querySelectorAll('.tour-highlight').forEach(el => {
        el.classList.remove('tour-highlight');
      });
    };
  }, [currentStep, run, steps]);

  if (!run || steps.length === 0) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-[9998]" onClick={onSkip} />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-[9999] bg-white rounded-lg shadow-2xl max-w-md transition-opacity duration-200"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          opacity: isPositioned ? 1 : 0,
        }}
      >
        {/* Arrow */}
        <div
          className="absolute w-4 h-4 bg-white transform rotate-45"
          style={{
            top: `${arrowPosition.top}px`,
            left: `${arrowPosition.left}px`,
          }}
        />

        {/* Content */}
        <div className="relative z-10 bg-white rounded-lg p-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{currentStepData.title}</h3>
              <button
                onClick={onSkip}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-gray-600 text-sm">{currentStepData.content}</p>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-400">
              {currentStep + 1} of {steps.length}
            </div>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handleBack}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Back
                </button>
              )}
              <button
                onClick={onSkip}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Skip
              </button>
              <button
                onClick={handleNext}
                className="px-4 py-2 text-sm bg-[#4682B4] text-white rounded-lg hover:bg-[#3a6a94] transition-colors"
              >
                {currentStep < steps.length - 1 ? 'Next' : 'Finish'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .tour-highlight {
          position: relative;
          z-index: 9997 !important;
          box-shadow: 0 0 0 4px rgba(70, 130, 180, 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.5) !important;
        }
      `}</style>
    </>
  );
}
