import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        <Outlet />
      </main>
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-400">
        <p>Trip Finance &bull; Shared Group Travel Financial Workspace</p>
      </footer>
    </div>
  );
};
