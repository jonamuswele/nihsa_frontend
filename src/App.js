// ╔══════════════════════════════════════════════════════════════════╗
// ║  NIHSA — Unified App Router                                     ║
// ║  /        → Public Flood Intelligence Platform                  ║
// ║  /admin   → Admin Panel (requires login)                        ║
// ╚══════════════════════════════════════════════════════════════════╝

// HOW TO USE:
// 1. Place this file as src/App.js
// 2. Place nihsa.jsx content as src/PublicApp.jsx  (rename export to PublicApp)
// 3. Place nihsa-admin.jsx content as src/AdminApp.jsx (export stays AdminApp)
// 4. npm install recharts
// 5. npm start
//
// Access:
//   http://localhost:3000        → Public platform
//   http://localhost:3000/admin  → Admin panel

import PublicApp from './PublicApp';
import AdminApp from './AdminApp';

export default function App() {
  const isAdmin = window.location.pathname.startsWith('/admin');
  return isAdmin ? <AdminApp /> : <PublicApp />;
}
