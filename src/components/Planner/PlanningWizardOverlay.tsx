import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlannerOnboarding } from '../Planner/PlannerOnboarding';
import { PlannerStep1 } from '../Planner/PlannerStep1';
import { PlannerStep2 } from '../Planner/PlannerStep2';
import { PlannerStep3 } from '../Planner/PlannerStep3';
import { PlannerStep4 } from '../Planner/PlannerStep4';
import { PlannerStep5 } from '../Planner/PlannerStep5';
import { PlannerStep6 } from '../Planner/PlannerStep6';
import { PlannerStep7 } from '../Planner/PlannerStep7';
import { PlannerStep8 } from '../Planner/PlannerStep8';

interface PlanningWizardOverlayProps {
    isPlanning: boolean;
    plannerStep: number;
}

/**
 * Full-screen overlay for the trip planning wizard
 */
export const PlanningWizardOverlay: React.FC<PlanningWizardOverlayProps> = ({
    isPlanning,
    plannerStep
}) => {
    return (
        <AnimatePresence>
            {isPlanning && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "rgba(0,0,0,0.98)",
                        backdropFilter: "blur(30px)",
                        zIndex: 5000000,
                        display: "flex",
                        flexDirection: "column",
                        color: "white",
                    }}
                >
                    <div
                        style={{
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: plannerStep >= 3 ? "flex-start" : "center",
                            alignItems: "center",
                            padding: "0 30px 60px",
                            overflowY: "auto",
                        }}
                    >
                        <div
                            style={{
                                width: "100%",
                                maxWidth: "700px",
                                textAlign: "center",
                            }}
                        >
                            <AnimatePresence mode="wait">
                                {plannerStep === 0 && <PlannerOnboarding />}
                                {plannerStep === 1 && <PlannerStep1 />}
                                {plannerStep === 2 && <PlannerStep2 />}
                                {plannerStep === 3 && <PlannerStep3 />}
                                {plannerStep === 4 && <PlannerStep4 />}
                                {plannerStep === 5 && <PlannerStep5 />}
                                {plannerStep === 6 && <PlannerStep6 />}
                                {plannerStep === 7 && <PlannerStep7 />}
                                {plannerStep === 8 && <PlannerStep8 />}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
