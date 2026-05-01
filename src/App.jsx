/**
 * Student: Rupert Guppy (23196925)
 * File: App.jsx
 * Description: Root component. Sets up React Router with four routes — one for
 *              each feature page — wrapped in a shared Layout component.
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import BookingPage from './pages/BookingPage';
import DriverPortalPage from './pages/DriverPortalPage';
import TrackerPage from './pages/TrackerPage';
import TripHistoryPage from './pages/TripHistoryPage';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<BookingPage />} />
          <Route path="/driver" element={<DriverPortalPage />} />
          <Route path="/tracker" element={<TrackerPage />} />
          <Route path="/trips" element={<TripHistoryPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
