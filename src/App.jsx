import React, { useState, useEffect } from 'react';
import { ProfileProvider } from './context/ProfileContext';
import { AnalysisProvider } from './context/AnalysisContext';
import Navigation from './components/Navigation';
import HomeScreen from './screens/Home/HomeScreen';
import ProfileScreen from './screens/Profile/ProfileScreen';
import AnalyzeScreen from './screens/Analyze/AnalyzeScreen';
import ResultsScreen from './screens/Results/ResultsScreen';
import DevCardsScreen from './screens/DevCards/DevCardsScreen';
import './styles/theme.css';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState(() => {
    return window.location.pathname || '/';
  });

  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (route) => {
    if (window.location.pathname !== route) {
      window.history.pushState({}, '', route);
    }
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderCurrentScreen = () => {
    switch (currentRoute) {
      case '/profile':
        return <ProfileScreen onNavigate={navigateTo} />;
      case '/analyze':
        return <AnalyzeScreen onNavigate={navigateTo} />;
      case '/results':
        return <ResultsScreen onNavigate={navigateTo} />;
      case '/dev-cards':
        return <DevCardsScreen onNavigate={navigateTo} />;
      case '/':
      default:
        return <HomeScreen onNavigate={navigateTo} />;
    }
  };

  return (
    <ProfileProvider>
      <AnalysisProvider>
        <div className="app-container">
          <Navigation currentRoute={currentRoute} onNavigate={navigateTo} />
          <main className="main-content">
            {renderCurrentScreen()}
          </main>
        </div>
      </AnalysisProvider>
    </ProfileProvider>
  );
}
