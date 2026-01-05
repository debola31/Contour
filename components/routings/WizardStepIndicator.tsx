'use client';

import { Stepper, Step, StepLabel, StepButton } from '@mui/material';

interface WizardStepIndicatorProps {
  steps: string[];
  activeStep: number;
  onStepClick?: (step: number) => void;
  clickable?: boolean;
}

/**
 * Step indicator component for the routing wizard.
 * Uses MUI Stepper for consistent styling with import wizards.
 */
export default function WizardStepIndicator({
  steps,
  activeStep,
  onStepClick,
  clickable = true,
}: WizardStepIndicatorProps) {
  return (
    <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
      {steps.map((label, index) => (
        <Step key={label}>
          {clickable && onStepClick ? (
            <StepButton onClick={() => onStepClick(index)}>
              {label}
            </StepButton>
          ) : (
            <StepLabel>{label}</StepLabel>
          )}
        </Step>
      ))}
    </Stepper>
  );
}
