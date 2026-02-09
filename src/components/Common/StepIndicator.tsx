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
                gap: "8px",
                marginBottom: "30px",
            }}
        >
            {Array.from({ length: totalSteps }, (_, i) => (
                <div
                    key={i}
                    style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background:
                            i === currentStep
                                ? "var(--primary)"
                                : "rgba(255,255,255,0.1)",
                        opacity: i < currentStep ? 0.3 : 1,
                    }}
                />
            ))}
        </div>
    );
};
