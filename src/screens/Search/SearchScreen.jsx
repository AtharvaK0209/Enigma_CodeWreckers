import React, { useState } from 'react';
import { Search, ArrowRight, ShieldCheck, AlertCircle, Sparkles, ScanLine, X } from 'lucide-react';
import { searchFood } from '../../services/api';
import { useAnalysis } from '../../context/AnalysisContext';
import { useProfile } from '../../context/ProfileContext';
import PillButton from '../../components/common/PillButton';
import Card from '../../components/common/Card';
import './SearchScreen.css';

export default function SearchScreen({ onNavigate }) {
  const { profile } = useProfile();
  const { setCurrentResult } = useAnalysis();
  const initialQ = new URLSearchParams(window.location.search).get('q') || '';
  const [searchTerm, setSearchTerm] = useState(initialQ);
  const [results, setResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(Boolean(initialQ));

  // Quick suggestion chips
  const popularSearches = ['Snickers', 'Nutella', 'Oreo', 'Rolled Oats', 'Energy Drink', 'Hummus', 'Peanut Butter'];

  React.useEffect(() => {
    if (initialQ) {
      executeSearch(initialQ);
    }
  }, []);

  const executeSearch = async (queryToSearch) => {
    const q = (queryToSearch || searchTerm).trim();
    if (!q) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const searchMatches = await searchFood(q, profile);
      setResults(searchMatches);
    } catch (err) {
      console.warn('[SearchScreen] Search failed:', err);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    executeSearch();
  };

  const handleSuggestionClick = (query) => {
    setSearchTerm(query);
    executeSearch(query);
  };

  const handleSelectProduct = (analysisResult) => {
    setCurrentResult(analysisResult);
    onNavigate('/results');
  };

  const handleClear = () => {
    setSearchTerm('');
    setResults(null);
    setHasSearched(false);
  };

  return (
    <div className="search-screen anim-spring-pop">
      <header className="search-header-block">
        <span className="search-eyebrow">Food Directory</span>
        <h1 className="search-title">Search Food by Name</h1>
        <p className="search-sub">
          Check any packaged snack, drink, or condiment against your health profile before buying.
        </p>
      </header>

      {/* Full-width Responsive Search Bar (Fixes failure mode 4: search input too narrow) */}
      <form onSubmit={handleFormSubmit} className="search-input-form">
        <div className="search-field-container">
          <Search size={18} className="search-field-icon" />
          <input
            type="text"
            className="search-field-input"
            placeholder="Search e.g. Snickers, Nutella, Oats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
          {searchTerm && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={handleClear}
              aria-label="Clear search input"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <PillButton
          type="submit"
          variant="primary"
          size="md"
          loading={isSearching}
        >
          Search
        </PillButton>
      </form>

      {/* Suggestion Chips */}
      {!hasSearched && (
        <section className="search-suggestions-section">
          <span className="suggestions-label">Popular Searches:</span>
          <div className="suggestions-chips-cloud">
            {popularSearches.map((item) => (
              <button
                key={item}
                type="button"
                className="suggestion-chip"
                onClick={() => handleSuggestionClick(item)}
              >
                <Search size={12} />
                <span>{item}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Results List */}
      {hasSearched && results && results.length > 0 && (
        <section className="search-results-section anim-spring-pop">
          <div className="results-count-bar">
            <span className="results-count-text">Found {results.length} matching products</span>
            <span className="results-profile-note">Evaluated for {profile.name || 'You'}</span>
          </div>

          <div className="search-results-stack">
            {results.map((item, index) => {
              const verdictClass = `item-verdict-${item.verdict}`;
              return (
                <Card
                  key={index}
                  interactive
                  className={`search-result-card ${verdictClass}`}
                  onClick={() => handleSelectProduct(item)}
                >
                  <div className="result-card-left">
                    <img
                      src={item.product?.image}
                      alt={item.product?.name}
                      className="result-product-thumb"
                    />
                    <div className="result-text-meta">
                      <span className="result-brand">{item.product?.brand}</span>
                      <h3 className="result-name">{item.product?.name}</h3>
                      <p className="result-summary">{item.verdictTitle}</p>
                    </div>
                  </div>

                  <div className="result-card-right">
                    <span className={`verdict-tag-pill tag-${item.verdict}`}>
                      {item.verdict === 'safe' ? 'Looks Safe' : item.verdict === 'caution' ? 'Caution' : 'Risk Found'}
                    </span>
                    <ArrowRight size={16} className="result-arrow" />
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Dedicated Empty State (Mission 7 Acceptance Criteria) */}
      {hasSearched && results && results.length === 0 && (
        <Card className="search-empty-state-card anim-spring-pop">
          <div className="empty-search-icon">
            <AlertCircle size={32} />
          </div>
          <h3 className="empty-state-title">No matching products found</h3>
          <p className="empty-state-desc">
            We couldn't find any products in our catalog matching "{searchTerm}".
          </p>
          <div className="empty-state-advice">
            <p>💡 Check for typos, or use the camera to scan the barcode or ingredient label directly.</p>
          </div>
          <div className="empty-state-actions">
            <PillButton
              variant="primary"
              size="md"
              icon={ScanLine}
              onClick={() => onNavigate('/analyze')}
            >
              Scan Barcode Instead
            </PillButton>
            <PillButton
              variant="secondary"
              size="md"
              onClick={handleClear}
            >
              Try Another Search
            </PillButton>
          </div>
        </Card>
      )}
    </div>
  );
}
