/**
 * Student: Rupert Guppy (23196925)
 * File: App.jsx
 * Description: Root component. Sets up React Router with four routes — one for
 *              each page — wrapped in a shared Layout component.
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import BookingPage from './pages/BookingPage';
import AdminPage from './pages/AdminPage';
import DriverPortalPage from './pages/DriverPortalPage';
import TripHistoryPage from './pages/TripHistoryPage';

export default function App() {
  return (
    <BrowserRouter basename="/~pxw1781/assign/Part2">
      <Layout>
        <Routes>
          <Route path="/" element={<BookingPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/driver" element={<DriverPortalPage />} />
          <Route path="/trips" element={<TripHistoryPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
