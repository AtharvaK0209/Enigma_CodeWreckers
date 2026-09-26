import React from 'react';
import { Home, Search, ScanLine, User, Sparkles, Palette } from 'lucide-react';
import './Navigation.css';

/**
 * Responsive Navigation component:
 * - Desktop Header with clean links
 * - Mobile Floating Black Pill Dock with 4 destinations: Home, Search, Scan, Profile
 * - "Scan" item is visually emphasized (elevated, filled accent ring) per Mission 3 spec
 */
export default function Navigation({ currentRoute, onNavigate }) {
  const mainNav = [
    { id: 'home', label: 'Home', icon: Home, route: '/' },
    { id: 'search', label: 'Search', icon: Search, route: '/search' },
    { id: 'scan', label: 'Scan', icon: ScanLine, route: '/analyze', isEmphasized: true },
    { id: 'profile', label: 'Profile', icon: User, route: '/profile' },
  ];

  return (
    <>
      {/* Desktop Header */}
      <header className="desktop-header">
        <div className="header-container">
          <div className="brand-badge" onClick={() => onNavigate('/')}>
            <div className="brand-dot"></div>
            <span className="brand-title">NutriLens</span>
            <span className="brand-tag">Food Safety</span>
          </div>

          <nav className="desktop-nav-links">
            <button
              onClick={() => onNavigate('/')}
              className={`desktop-nav-item ${currentRoute === '/' || currentRoute === '/home' ? 'active' : ''}`}
            >
              <Home size={15} />
              <span>Home</span>
            </button>

            <button
              onClick={() => onNavigate('/search')}
              className={`desktop-nav-item ${currentRoute === '/search' ? 'active' : ''}`}
            >
              <Search size={15} />
              <span>Search</span>
            </button>

            <button
              onClick={() => onNavigate('/analyze')}
              className={`desktop-nav-item ${currentRoute === '/analyze' ? 'active' : ''}`}
            >
              <ScanLine size={15} />
              <span>Scan Food</span>
            </button>

            <button
              onClick={() => onNavigate('/profile')}
              className={`desktop-nav-item ${currentRoute === '/profile' || currentRoute === '/onboarding' ? 'active' : ''}`}
            >
              <User size={15} />
              <span>Profile</span>
            </button>

            {/* Dev helper links */}
            <button
              onClick={() => onNavigate('/styleguide')}
              className={`desktop-nav-item dev-nav-link ${currentRoute === '/styleguide' ? 'active' : ''}`}
              title="Design Tokens & Styleguide"
            >
              <Palette size={14} />
              <span>Tokens</span>
            </button>

            <button
              onClick={() => onNavigate('/dev-cards')}
              className={`desktop-nav-item dev-nav-link ${currentRoute === '/dev-cards' ? 'active' : ''}`}
              title="RiskCard Component Gallery"
            >
              <Sparkles size={14} />
              <span>Cards</span>
            </button>
          </nav>

          <button
            className="btn-pill-primary desktop-cta"
            onClick={() => onNavigate('/analyze')}
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
            const isActive = currentRoute === item.route ||
              (item.route === '/' && currentRoute === '/home') ||
              (item.route === '/profile' && currentRoute === '/onboarding');

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
