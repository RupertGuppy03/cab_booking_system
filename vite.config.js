/**
 * Student: Rupert Guppy (23196925)
 * File: vite.config.js
 * Description: Vite build configuration for the CabsOnline Part 2 React app.
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/~pxw1781/assign/Part2/',
});
