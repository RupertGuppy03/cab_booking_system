/**
 * Student: Rupert Guppy (23196925)
 * File: Layout.jsx
 * Description: Shared page layout wrapping all routes. Renders the top header
 *              bar with the CabsOnline brand and a navigation bar linking to
 *              the four main pages.
 * Functions: Layout
 */

import { NavLink } from 'react-router-dom';

const navLinks = [
  { to: '/', label: 'Book a Cab' },
  { to: '/admin', label: 'Admin' },
  { to: '/driver', label: 'Driver Portal' },
  { to: '/trips', label: 'My Trips' },
];

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-[#f4f4f4] font-sans text-[#333]">
      <header className="bg-brand text-white">
        <div className="max-w-5xl mx-auto px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">CabsOnline</h1>
            <p className="text-sm text-gray-300 mt-0.5">Your reliable taxi booking service</p>
          </div>
          <nav className="flex flex-wrap gap-2">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `px-4 py-2 rounded text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-white text-brand'
                      : 'text-gray-300 hover:bg-brand-dark hover:text-white'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
