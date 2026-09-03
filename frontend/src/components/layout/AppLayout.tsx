import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AppLayout() {
  return (
    <div className="min-h-screen relative">
      {/* Ambient background orbs */}
      <div className="ambient-orb ambient-orb-cyan" />
      <div className="ambient-orb ambient-orb-violet" />
      <div className="ambient-orb ambient-orb-teal" />

      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <main className="ml-[72px] min-h-screen relative z-10">
        <div className="max-w-5xl mx-auto px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
