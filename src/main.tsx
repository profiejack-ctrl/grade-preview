// Polyfills for browser compatibility (pdfjs-dist requirements in older browser runtimes)
if (typeof Uint8Array !== 'undefined' && !(Uint8Array.prototype as any).toHex) {
  (Uint8Array.prototype as any).toHex = function () {
    return Array.from(this)
      .map((b: any) => b.toString(16).padStart(2, '0'))
      .join('');
  };
}

if (typeof Math !== 'undefined' && !(Math as any).sumPrecise) {
  (Math as any).sumPrecise = function (numbers: Iterable<number>) {
    let sum = 0;
    for (const n of numbers) {
      sum += n;
    }
    return sum;
  };
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

