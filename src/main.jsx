/**
 * Student: Rupert Guppy (23196925)
 * File: main.jsx
 * Description: Entry point for the CabsOnline React app. Mounts the App
 *              component into the DOM and imports global styles.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import './index.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
