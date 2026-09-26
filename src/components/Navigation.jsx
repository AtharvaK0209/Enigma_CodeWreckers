import React from 'react';
import { Home, Search, ScanLine, User, Sparkles, Palette } from 'lucide-react';
import './Navigation.css';

/**
 * Responsive Navigation component:
 * - Desktop Header with clean links
 * - Mobile Floating Black Pill Dock with 4 destinations: Home, Search, Scan, Profile
 * - "Scan" item is visually emphasized (elevated, filled accent ring) per Mission 3 spec
 */
import { useProfile } from '../context/ProfileContext';

export default function Navigation({ currentRoute, onNavigate }) {
  const { isAuthenticated, profile } = useProfile();
  const currentPath = (currentRoute || '/').split('?')[0];

  const mainNav = [
    { id: 'home', label: 'Home', icon: Home, route: '/dashboard' },
    { id: 'search', label: 'Search', icon: Search, route: '/search' },
    { id: 'scan', label: 'Scan', icon: ScanLine, route: '/scan', isEmphasized: true },
    { id: 'profile', label: 'Profile', icon: User, route: '/profile' },
  ];

  const isLandingView = currentPath === '/' || currentPath === '/landing';
  const isPublicFlow = isLandingView || currentPath === '/signin' || currentPath === '/onboarding';

  const isHomeActive = currentPath === '/dashboard' || currentPath === '/home';
  const isScanActive = currentPath === '/scan' || currentPath === '/analyze' || currentPath === '/results';
  const isSearchActive = currentPath === '/search';
  const isProfileActive = currentPath === '/profile';

  if (isPublicFlow) {
    return null; // Public pages have their own focused layout & navigation
  }


  return (
    <>
      {/* Desktop Header */}
      <header className="desktop-header">
        <div className="header-container">
          <div className="brand-badge" onClick={() => onNavigate('/dashboard')}>
            <div className="brand-dot"></div>
            <span className="brand-title">NutriLens</span>
            <span className="brand-tag">Food Safety</span>
          </div>

          <nav className="desktop-nav-links">
            <button
              onClick={() => onNavigate('/dashboard')}
              className={`desktop-nav-item ${isHomeActive ? 'active' : ''}`}
            >
              <Home size={15} />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => onNavigate('/search')}
              className={`desktop-nav-item ${isSearchActive ? 'active' : ''}`}
            >
              <Search size={15} />
              <span>Search</span>
            </button>

            <button
              onClick={() => onNavigate('/scan')}
              className={`desktop-nav-item ${isScanActive ? 'active' : ''}`}
            >
              <ScanLine size={15} />
              <span>Scan Food</span>
            </button>

            <button
              onClick={() => onNavigate('/profile')}
              className={`desktop-nav-item ${isProfileActive ? 'active' : ''}`}
            >
              <User size={15} />
              <span>Profile</span>
            </button>
          </nav>

          <button
            className="btn-pill-primary desktop-cta"
            onClick={() => onNavigate('/scan')}
          >
            <ScanLine size={16} />
            <span>Scan Product</span>
          </button>
        </div>
      </header>

      {/* Floating Bottom Nav for Mobile & Tablet (Mission 3) */}
      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
        <div className="pill-nav-dock">
          {mainNav.map((item) => {
            const Icon = item.icon;
            const isActive =
              (item.id === 'home' && isHomeActive) ||
              (item.id === 'search' && isSearchActive) ||
              (item.id === 'scan' && isScanActive) ||
              (item.id === 'profile' && isProfileActive);

            if (item.isEmphasized) {
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.route)}
                  className={`pill-nav-btn emphasized-scan-btn ${isActive ? 'active' : ''}`}
                  aria-label="Scan Food Product"
                >
                  <div className="emphasized-icon-bubble">
                    <Icon size={22} strokeWidth={2.6} />
                  </div>
                  <span className="pill-btn-label">{item.label}</span>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.route)}
                className={`pill-nav-btn ${isActive ? 'active' : ''}`}
              >
                <div className="pill-icon-wrap">
                  <Icon size={19} strokeWidth={isActive ? 2.5 : 2} />
                  {isActive && <div className="active-glow-dot"></div>}
                </div>
                <span className="pill-btn-label">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}

