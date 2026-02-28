import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlannerOnboarding } from './steps/PlannerOnboarding';
import { PlannerStep1 } from './steps/PlannerStep1';
import { PlannerStep2 } from './steps/PlannerStep2';
import { PlannerStep3 } from './steps/PlannerStep3';
import { PlannerStep4 } from './steps/PlannerStep4';
import { PlannerStep5 } from './steps/PlannerStep5';
import { PlannerStep6 } from './steps/PlannerStep6';
import { PlannerStep7 } from './steps/PlannerStep7';
import { PlannerStep8 } from './steps/PlannerStep8';

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
                            overflow: "hidden", // Important: Container doesn't scroll
                            width: "100%",
                            position: "relative"
                        }}
                    >
                        {/* Scrollable Content Area */}
                        <div
                            style={{
                                flex: 1,
                                overflowY: "auto",
                                padding: "40px 30px 120px", // Extra bottom padding for the footer room
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                width: "100%",
                            }}
                        >
                            <div
                                style={{
                                    width: "100%",
                                    maxWidth: "800px",
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

                        {/* Floating Action Bar (Sticky Footer) */}
                        {plannerStep > 0 && plannerStep < 9 && (
                            <div
                                style={{
                                    position: "absolute",
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    padding: "20px 30px 40px",
                                    background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 70%, transparent 100%)",
                                    backdropFilter: "blur(10px)",
                                    borderTop: "1px solid rgba(255,255,255,0.1)",
                                    zIndex: 100,
                                    display: "flex",
                                    justifyContent: "center"
                                }}
                            >
                                <div id="planner-nav-actions" style={{ width: "100%", maxWidth: "800px" }} />
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
