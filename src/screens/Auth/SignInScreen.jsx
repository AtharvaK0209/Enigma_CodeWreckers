import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';
import PillButton from '../../components/common/PillButton';
import Card from '../../components/common/Card';
import './SignInScreen.css';

export default function SignInScreen({ onNavigate }) {
  const { signIn } = useProfile();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    setError('');

    // Simulate rapid auth verification
    setTimeout(() => {
      signIn(email.trim(), password);
      setIsLoading(false);
      onNavigate('/dashboard');
    }, 350);
  };

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    setTimeout(() => {
      signIn('google.user@nutrilens.app', 'demo123');
      setIsLoading(false);
      onNavigate('/dashboard');
    }, 400);
  };

  return (
    <div className="signin-page anim-spring-pop">
      {/* Top minimal header */}
      <header className="signin-header">
        <button
          type="button"
          className="signin-back-btn"
          onClick={() => onNavigate('/')}
        >
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </button>
        <div className="signin-brand-badge" onClick={() => onNavigate('/')}>
          <div className="brand-dot"></div>
          <span className="brand-title">NutriLens</span>
        </div>
      </header>

      {/* Main Authentication Container */}
      <div className="signin-card-container">
        <Card className="signin-auth-card">
          <div className="auth-card-top">
            <div className="auth-icon-bubble">
              <ShieldCheck size={28} color="#171715" />
            </div>
            <h1 className="auth-heading">Welcome back.</h1>
            <p className="auth-subtext">
              Continue making food decisions with your personalized NutriLens profile.
            </p>
          </div>

          {error && (
            <div className="auth-error-banner anim-spring-pop">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field-group">
              <label className="auth-field-label">Email</label>
              <div className="auth-input-wrapper">
                <Mail size={18} className="auth-field-glyph" />
                <input
                  type="email"
                  className="auth-text-input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="auth-field-group">
              <div className="auth-password-label-row">
                <label className="auth-field-label">Password</label>
                <button
                  type="button"
                  className="forgot-password-link"
                  onClick={() => alert('Password reset link sent to demo profile.')}
                >
                  Forgot password?
                </button>
              </div>
              <div className="auth-input-wrapper">
                <Lock size={18} className="auth-field-glyph" />
                <input
                  type="password"
                  className="auth-text-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="auth-submit-group">
              <PillButton
                type="submit"
                variant="primary"
                size="lg"
                iconRight={ArrowRight}
                loading={isLoading}
                fullWidth
              >
                Sign In
              </PillButton>
            </div>
          </form>

          {/* Divider */}
          <div className="auth-divider">
            <span className="divider-line"></span>
            <span className="divider-label">OR</span>
            <span className="divider-line"></span>
          </div>

          {/* Secondary Option: Continue with Google */}
          <button
            type="button"
            className="btn-google-auth"
            onClick={handleGoogleSignIn}
          >
            <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Create Profile link */}
          <div className="auth-footer-prompt">
            <span className="prompt-text">Don't have an account?</span>
            <button
              type="button"
              className="prompt-link"
              onClick={() => onNavigate('/onboarding')}
            >
              Create your profile →
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
