import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AppLayout() {
  return (
    <div className="min-h-screen relative">
      {/* Dreamy lavender atmosphere */}
      <div className="app-wash" />

      {/* Floating rail */}
      <Sidebar />

      {/* Main content — full width on mobile (rail becomes a bottom bar),
          offset by the floating rail from sm up. */}
      <main className="min-h-screen relative z-10 sm:ml-[96px] pb-28 sm:pb-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
