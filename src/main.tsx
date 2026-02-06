import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/design-system.css';
import { PlannerProvider } from './contexts/PlannerContext';

console.log("Main.tsx executing...");
const rootElement = document.getElementById('root');

if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            <PlannerProvider>
                <App />
            </PlannerProvider>
        </React.StrictMode>
    );
} else {
    console.error("Root element not found");
}
