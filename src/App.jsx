import React, { useState, useEffect } from 'react';
import { ProfileProvider, useProfile } from './context/ProfileContext';
import { AnalysisProvider } from './context/AnalysisContext';
import Navigation from './components/Navigation';
import LandingScreen from './screens/Landing/LandingScreen';
import SignInScreen from './screens/Auth/SignInScreen';
import OnboardingScreen from './screens/Onboarding/OnboardingScreen';
import HomeScreen from './screens/Home/HomeScreen';
import ProfileScreen from './screens/Profile/ProfileScreen';
import AnalyzeScreen from './screens/Analyze/AnalyzeScreen';
import ResultsScreen from './screens/Results/ResultsScreen';
import SearchScreen from './screens/Search/SearchScreen';
import StyleGuideScreen from './screens/StyleGuide/StyleGuideScreen';
import DevCardsScreen from './screens/DevCards/DevCardsScreen';
import './styles/theme.css';

function AppContent() {
  const { isAuthenticated, profile } = useProfile();
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

  const currentPath = (currentRoute || '/').split('?')[0];

  const renderCurrentScreen = () => {
    switch (currentPath) {
      case '/landing':
        return <LandingScreen onNavigate={navigateTo} />;
      case '/signin':
        return <SignInScreen onNavigate={navigateTo} />;
      case '/onboarding':
        return <OnboardingScreen onNavigate={navigateTo} />;
      case '/dashboard':
        return <HomeScreen onNavigate={navigateTo} />;
      case '/scan':
      case '/analyze':
        return <AnalyzeScreen onNavigate={navigateTo} />;
      case '/search':
        return <SearchScreen onNavigate={navigateTo} />;
      case '/profile':
        return <ProfileScreen onNavigate={navigateTo} />;
      case '/results':
        return <ResultsScreen onNavigate={navigateTo} />;
      case '/styleguide':
        return <StyleGuideScreen onNavigate={navigateTo} />;
      case '/dev-cards':
        return <DevCardsScreen onNavigate={navigateTo} />;
      case '/':
      default:
        // If user is authenticated and completed onboarding, show dashboard, otherwise landing
        if (isAuthenticated && profile.onboardingComplete) {
          return <HomeScreen onNavigate={navigateTo} />;
        }
        return <LandingScreen onNavigate={navigateTo} />;
    }
  };


  return (
    <div className="app-container">
      <Navigation currentRoute={currentRoute} onNavigate={navigateTo} />
      <main className="main-content">
        {renderCurrentScreen()}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ProfileProvider>
      <AnalysisProvider>
        <AppContent />
      </AnalysisProvider>
    </ProfileProvider>
  );
}


