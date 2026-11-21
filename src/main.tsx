import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import {ErrorBoundary} from './components/ErrorBoundary.tsx';
import './index.css';

if (import.meta.env.PROD) {
  registerSW({immediate: true});
} else if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js', {scope: '/', updateViaCache: 'none'})
    .then((reg) => reg.update())
    .catch(() => {
      // Ignore dev service worker registration errors
    });
}

const DESKTOP_WIDTH = 1280;

function applyDesktopSiteScale() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const scale = vw > 0 && vw < DESKTOP_WIDTH ? vw / DESKTOP_WIDTH : 1;

  if (scale < 1) {
    document.documentElement.style.setProperty('zoom', String(scale));
  } else {
    document.documentElement.style.removeProperty('zoom');
  }

  const effectiveVh = vh > 0 ? vh / scale : 900;
  const fitMapPx = Math.max(460, Math.floor(effectiveVh - 355));
  document.documentElement.style.setProperty('--city-map-max', `${fitMapPx}px`);
}

applyDesktopSiteScale();
window.addEventListener('resize', applyDesktopSiteScale);

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
