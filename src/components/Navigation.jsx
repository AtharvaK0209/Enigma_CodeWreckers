import React from 'react';
import { Home, ShieldCheck, ScanLine, FileText, Sparkles } from 'lucide-react';
import './Navigation.css';

export default function Navigation({ currentRoute, onNavigate }) {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home, route: '/' },
    { id: 'profile', label: 'Profile', icon: ShieldCheck, route: '/profile' },
    { id: 'analyze', label: 'Scan Food', icon: ScanLine, route: '/analyze' },
    { id: 'results', label: 'Results', icon: FileText, route: '/results' },
    { id: 'dev-cards', label: 'Dev Cards', icon: Sparkles, route: '/dev-cards' },
  ];

  return (
    <>
      {/* Top Header for Desktop */}
      <header className="desktop-header">
        <div className="header-container">
          <div className="brand-badge" onClick={() => onNavigate('/')}>
            <div className="brand-dot"></div>
            <span className="brand-title">NutriLens</span>
            <span className="brand-tag">SafeEats</span>
          </div>

          <nav className="desktop-nav-links">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentRoute === item.route;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.route)}
                  className={`desktop-nav-item ${isActive ? 'active' : ''}`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              );
            })}
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

      {/* Floating Black Pill Bottom Nav for Mobile & Tablet */}
      <nav className="mobile-bottom-nav">
        <div className="pill-nav-dock">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.route;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.route)}
                className={`pill-nav-btn ${isActive ? 'active' : ''}`}
                title={item.label}
              >
                <div className="pill-icon-wrap">
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
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
