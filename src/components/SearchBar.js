import React from 'react';

function getCountryCode(countryCode) {
  if (!countryCode || !/^[a-z]{2}$/i.test(countryCode)) {
    return '';
  }

  return countryCode.toLowerCase();
}

function formatCityLabel(suggestion) {
  return suggestion.state
    ? `${suggestion.name}, ${suggestion.state}, ${suggestion.country}`
    : `${suggestion.name}, ${suggestion.country}`;
}

function getFlagUrl(countryCode) {
  const code = getCountryCode(countryCode);
  return code ? `https://flagcdn.com/24x18/${code}.png` : '';
}

function SearchBar({
  query,
  onQueryChange,
  onSubmit,
  onUseMyLocation,
  suggestions,
  showSuggestions,
  onSuggestionSelect,
  onInputFocus,
  onInputBlur,
  text
}) {
  function renderSuggestionItem(suggestion) {
    const label = formatCityLabel(suggestion);
    const flagUrl = getFlagUrl(suggestion.country);

    return (
      <li key={`${suggestion.lat}-${suggestion.lon}`}>
        <button
          type="button"
          className="suggestion-btn"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onSuggestionSelect(suggestion)}
        >
          <span>{label}</span>

          {flagUrl && (
            <img
              className="flag-icon"
              src={flagUrl}
              alt={`${suggestion.country} flag`}
              loading="lazy"
              decoding="async"
            />
          )}
        </button>
      </li>
    );
  }

  return (
    <form className="search-panel glass" onSubmit={onSubmit}>
      <div className="search-row">
        <div className="search-input-wrap">
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={onInputFocus}
            onBlur={onInputBlur}
            className="search-input"
            placeholder={text.searchPlaceholder}
            aria-label={text.searchPlaceholder}
            autoComplete="off"
          />

          {showSuggestions && suggestions.length > 0 && (
            <ul
              className="suggestions-list"
              role="listbox"
              aria-label={text.suggestionsLabel}
            >
              {suggestions.map(renderSuggestionItem)}
            </ul>
          )}
        </div>

        <button type="submit" className="btn primary-btn">
          {text.search}
        </button>

        <button
          type="button"
          className="btn location-btn"
          onClick={onUseMyLocation}
        >
          {text.useMyLocation}
        </button>
      </div>
    </form>
  );
}

export default SearchBar;