import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n';
import { AccessibilityProvider } from './context/AccessibilityContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AccessibilityProvider>
      <App />
    </AccessibilityProvider>
  </StrictMode>,
);
