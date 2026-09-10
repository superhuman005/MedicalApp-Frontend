import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'

// Global safety net for errors that happen outside React's render cycle (e.g.
// thrown from a browser API callback like MutationObserver/ResizeObserver, or
// an unhandled promise rejection). React's <ErrorBoundary> can't catch these,
// so without this a bug in that category produces a silent blank page with
// nothing but a console line most people never open. This makes any such
// failure visible directly on the page instead, with no DevTools needed.
const showGlobalErrorBanner = (message: string, detail: string) => {
  if (document.getElementById('global-error-banner')) return; // don't stack duplicates
  const banner = document.createElement('div');
  banner.id = 'global-error-banner';
  banner.style.cssText =
    'position:fixed;inset:0;z-index:99999;background:#fff;color:#111;font-family:ui-sans-serif,system-ui,sans-serif;padding:24px;overflow:auto;';
  banner.innerHTML = `
    <div style="max-width:640px;margin:0 auto;border:1px solid #fecaca;border-radius:8px;padding:24px;">
      <h1 style="font-size:18px;font-weight:600;margin:0 0 8px;">Something went wrong</h1>
      <p style="font-size:14px;color:#4b5563;margin:0 0 16px;">${message}</p>
      <pre style="background:#111827;color:#fca5a5;font-size:12px;border-radius:6px;padding:16px;overflow:auto;max-height:280px;white-space:pre-wrap;word-break:break-word;">${detail.replace(/</g, '&lt;')}</pre>
      <button id="global-error-copy" style="margin-top:16px;padding:8px 16px;border-radius:6px;border:1px solid #d1d5db;background:#fff;cursor:pointer;font-size:14px;">Copy error details</button>
    </div>
  `;
  document.body.appendChild(banner);
  document.getElementById('global-error-copy')?.addEventListener('click', () => {
    navigator.clipboard?.writeText(detail).catch(() => {});
  });
};

window.addEventListener('error', (event) => {
  showGlobalErrorBanner(
    'A script error occurred outside the normal React error handling.',
    `${event.error?.stack || event.message}`
  );
});

window.addEventListener('unhandledrejection', (event) => {
  showGlobalErrorBanner(
    'An unhandled promise rejection occurred.',
    `${event.reason?.stack || event.reason}`
  );
});

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <AuthProvider>
      <App />
    </AuthProvider>
  </ErrorBoundary>
);
