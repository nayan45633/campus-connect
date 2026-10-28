import { useState, type FC } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '@/layouts/Header';
import { Sidebar } from '@/layouts/Sidebar';
import { MobileNav } from '@/layouts/MobileNav';

export const RootLayout: FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-main flex flex-col text-slate-900 dark:text-dark-text-main transition-colors duration-200">
      {/* Top Navbar */}
      <Header
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={toggleMobileMenu}
      />

      {/* Main App Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        {/* Desktop / Tablet Sidebar */}
        <Sidebar className="hidden md:flex" />

        {/* Mobile Drawer Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs md:hidden"
            onClick={closeMobileMenu}
            aria-hidden="true"
          >
            <div
              className="absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-dark-surface p-4 shadow-xl border-r border-slate-200 dark:border-dark-border"
              onClick={(e) => e.stopPropagation()}
            >
              <Sidebar
                className="w-full border-r-0 h-full static top-0 p-0"
                onNavigate={closeMobileMenu}
              />
            </div>
          </div>
        )}

        {/* Dynamic Route Content */}
        <main className="flex-1 min-w-0 px-4 py-6 sm:px-6 lg:px-8 pb-20 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav />
    </div>
  );
};
