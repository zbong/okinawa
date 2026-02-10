import React from "react";
import "./styles/design-system.css";
import { useSharedLink } from "./hooks/useSharedLink";
import { useAppEvents } from "./hooks/useAppEvents";
import { useAppCleanup } from "./hooks/useAppCleanup";
import { usePlanner } from "./contexts/PlannerContext";
import { Toast } from "./components/Common/Toast";
import { ConfirmModal } from "./components/Common/ConfirmModal";
import { ErrorBoundary } from "./components/Common/ErrorBoundary";
import { LoadingOverlay } from "./components/Common/LoadingOverlay";
import { FullScreenImagePreview } from "./components/Common/FullScreenImagePreview";

import { DebugView } from "./components/Debug/DebugView";
import { LandingPage } from "./components/Landing/LandingPage";
import { TabNavigation } from "./components/Navigation/TabNavigation";
import { ScheduleTab } from "./components/Schedule/ScheduleTab";
import { SummaryTab } from "./components/Summary/SummaryTab";
import { DocumentsTab } from "./components/Documents/DocumentsTab";
import { ExchangeTab } from "./components/Exchange/ExchangeTab";
import { PhrasebookTab } from "./components/Phrasebook/PhrasebookTab";
import { Ocr_labTab } from "./components/Ocr_lab/Ocr_labTab";
import { PlanningWizardOverlay } from "./components/Planner/PlanningWizardOverlay";
import { PlannerReviewModal } from "./components/Planner/PlannerReviewModal";
import { PlannerReEditModal } from "./components/Planner/PlannerReEditModal";
import { AttractionDetailModal } from "./components/Planner/AttractionDetailModal";
import { LocationBottomSheet } from "./components/LocationBottomSheet";
import { motion } from "framer-motion";

const App: React.FC = () => {
  const {
    view, setView, activeTab, setActiveTab,
    theme, toggleTheme, trip,
    setSelectedPoint,
    isPlanning,
    plannerStep,
    setActivePlannerDetail,
    // States
    analyzedFiles, ticketFileInputRef,
    isOcrLoading, isAuthLoading,

    toasts, closeToast, deleteConfirmModal,
    setDeleteConfirmModal,
    selectedFile, setSelectedFile,
    convert, speak,
    handleTicketOcr, handleMultipleOcr, handleFileUpload, deleteFile
  } = usePlanner();

  // Handle Shared Link (Supabase)
  useSharedLink();

  // Global error handlers & drag prevention
  useAppEvents();

  // Draft & Cache Cleanup
  useAppCleanup();

  const tabProps = {
    SummaryTab: {},
    ScheduleTab: { ErrorBoundary },
    DocumentsTab: { handleFileUpload, deleteFile },
    ExchangeTab: { convert },
    PhrasebookTab: { speak },
    Ocr_labTab: {
      analyzedFiles, handleMultipleOcr, ticketFileInputRef,
      isOcrLoading, handleTicketOcr, handleFileUpload, deleteFile
    }
  };

  return (
    <>
      <div className="app">
        {/* Global Loading Overlay for OCR & Auth */}
        <LoadingOverlay isLoading={isOcrLoading || isAuthLoading} />

        {/* Landing Page (Handles its own visibility) */}
        {view === "landing" && !isAuthLoading && !new URLSearchParams(window.location.search).has("id") && <LandingPage />}

        {/* Login Form */}


        {/* Main App View */}
        {view === "app" && trip && (
          <motion.div
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              height: "100%",
              overflow: "hidden",
            }}
          >
            <TabNavigation
              activeTab={activeTab as any}
              setActiveTab={setActiveTab as any}
              theme={theme as "dark" | "light"}
              toggleTheme={toggleTheme}
              onClose={() => {
                setSelectedPoint(null);
                setActivePlannerDetail(null);
                setView("landing");
              }}
              onTabChange={() => {
                setSelectedPoint(null);
                setActivePlannerDetail(null);
              }}
            />

            <main
              style={{
                flex: 1,
                overflowY: "auto",
                paddingBottom: "20px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <SummaryTab {...tabProps.SummaryTab} />
              <ScheduleTab {...tabProps.ScheduleTab} />
              <DocumentsTab {...tabProps.DocumentsTab} />
              <ExchangeTab {...tabProps.ExchangeTab} />
              <PhrasebookTab {...tabProps.PhrasebookTab} />
              <Ocr_labTab {...tabProps.Ocr_labTab} />
            </main>

            {/* Bottom Sheet */}
            <LocationBottomSheet />
          </motion.div>
        )}

        {/* Planning Wizard Overlay */}
        <PlanningWizardOverlay isPlanning={isPlanning} plannerStep={plannerStep} />

        {/* Attraction Detail Modal */}
        <AttractionDetailModal />

        {view === "debug" && (
          <DebugView onBack={() => setView("landing")} />
        )}

      </div>

      {/* Global Modals */}
      <PlannerReEditModal />
      <PlannerReviewModal />

      <ConfirmModal
        isOpen={deleteConfirmModal.isOpen}
        title={deleteConfirmModal.title}
        message={deleteConfirmModal.message}
        onConfirm={() => {
          deleteConfirmModal.onConfirm();
          setDeleteConfirmModal({
            isOpen: false,
            title: "",
            message: "",
            onConfirm: () => { },
          });
        }}
        onCancel={() =>
          setDeleteConfirmModal({
            isOpen: false,
            title: "",
            message: "",
            onConfirm: () => { },
          })
        }
        confirmText={deleteConfirmModal.confirmText || "삭제"}
        cancelText={deleteConfirmModal.cancelText || "취소"}
      />

      {selectedFile && (
        <FullScreenImagePreview
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
        />
      )}

      <Toast toasts={toasts} onClose={closeToast} />
    </>
  );
};

export default App;
