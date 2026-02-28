import React from 'react';

interface StepIndicatorProps {
    currentStep: number;
    totalSteps?: number;
}

/**
 * Step progress indicator dots
 */
export const StepIndicator: React.FC<StepIndicatorProps> = ({
    currentStep,
    totalSteps = 5
}) => {
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "30px",
            }}
        >
            <div
                style={{
                    padding: "6px 16px",
                    borderRadius: "20px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "var(--primary)",
                    fontSize: "14px",
                    fontWeight: 800,
                    letterSpacing: "2px"
                }}
            >
                {currentStep} / {totalSteps}
            </div>
        </div>
    );
};
