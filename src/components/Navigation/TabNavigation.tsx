import React from 'react';
import {
    LayoutDashboard, Calendar, FileText, RefreshCw, MessageCircle,
    Sun, Moon, X
} from 'lucide-react';

type TabType = 'summary' | 'schedule' | 'files' | 'exchange' | 'speech' | 'ocr_lab';

interface TabNavigationProps {
    activeTab: TabType;
    setActiveTab: (tab: TabType) => void;
    theme: 'dark' | 'light';
    toggleTheme: () => void;
    onClose: () => void;
    onTabChange?: () => void; // Optional callback before tab change
}

/**
 * Tab navigation bar for the main app view
 */
export const TabNavigation: React.FC<TabNavigationProps> = ({
    activeTab,
    setActiveTab,
    theme,
    toggleTheme,
    onClose,
    onTabChange
}) => {
    const handleTabClick = (tab: TabType) => {
        onTabChange?.();
        setActiveTab(tab);
    };

    return (
        <nav className="nav-tabs">
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    console.log("🔄 Navigating to landing via X button...");
                    onClose();
                }}
                style={{
                    padding: "8px",
                    background: "transparent",
                    border: "none",
                    color: "var(--text-primary)",
                    marginRight: "8px",
                }}
            >
                <X size={20} />
            </button>
            <button
                className={`tab ${activeTab === "summary" ? "active" : ""}`}
                onClick={() => handleTabClick("summary")}
            >
                <LayoutDashboard size={18} />
                <span style={{ marginLeft: "4px" }}>개요</span>
            </button>
            <button
                className={`tab ${activeTab === "schedule" ? "active" : ""}`}
                onClick={() => handleTabClick("schedule")}
            >
                <Calendar size={18} />
                <span style={{ marginLeft: "4px" }}>일정</span>
            </button>
            <button
                className={`tab ${activeTab === "files" ? "active" : ""}`}
                onClick={() => handleTabClick("files")}
            >
                <FileText size={18} />
                <span style={{ marginLeft: "4px" }}>서류</span>
            </button>
            <button
                className={`tab ${activeTab === "exchange" ? "active" : ""}`}
                onClick={() => handleTabClick("exchange")}
            >
                <RefreshCw size={18} />
                <span style={{ marginLeft: "4px" }}>환율</span>
            </button>
            <button
                className={`tab ${activeTab === "speech" ? "active" : ""}`}
                onClick={() => handleTabClick("speech")}
            >
                <MessageCircle size={18} />
                <span style={{ marginLeft: "4px" }}>회화</span>
            </button>
            <button
                className="tab"
                onClick={toggleTheme}
                style={{
                    marginLeft: "auto",
                    padding: "6px 10px",
                    minWidth: "auto",
                }}
            >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
        </nav>
    );
};
