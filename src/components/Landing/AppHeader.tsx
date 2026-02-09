import React from 'react';

/**
 * App header with logo and title (used in landing page)
 */
export const AppHeader: React.FC = () => {
    return (
        <>
            <div
                style={{
                    width: 100,
                    height: 100,
                    borderRadius: "30px",
                    overflow: "hidden",
                    marginBottom: "24px",
                    boxShadow: "0 15px 40px rgba(0,0,0,0.4)",
                    border: "1px solid rgba(255,255,255,0.1)",
                }}
            >
                <img
                    src="/logo.png"
                    alt="빠니보살"
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                    }}
                />
            </div>
            <h1
                style={{
                    fontSize: "48px",
                    fontWeight: 900,
                    marginBottom: "4px",
                    letterSpacing: "-2px",
                    color: "#ffffff",
                    textShadow: "0 0 20px rgba(0,212,255,0.4)",
                }}
            >
                빠니보살
            </h1>
            <p
                style={{
                    color: "var(--primary)",
                    fontSize: "18px",
                    fontWeight: 700,
                    marginBottom: "40px",
                    letterSpacing: "1px",
                }}
            >
                AI로 자유여행
            </p>
        </>
    );
};
