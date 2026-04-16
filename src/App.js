import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import './App.css';
import AnimatedScene from './components/AnimatedScene';
import SearchBar from './components/SearchBar';
import WeatherDisplay from './components/WeatherDisplay';
import HourlyForecast from './components/HourlyForecast';
import FiveDayForecast from './components/FiveDayForecast';
import {
  getCoordinatesForCity,
  getCitySuggestions,
  getCurrentWeatherByCoords,
  getForecastByCoords,
  getWeatherAlertsByCoords
} from './services/weatherApi';
import {
  getBackgroundTheme,
  getCityTimeFromOffset,
  groupDailyForecast,
  normalizeGeolocationError,
  normalizeWeatherApiError,
  toWeekdayLabel,
  TRANSLATIONS
} from './components/formatters';

const initialState = {
  query: '',
  units: 'metric',
  language: 'en',
  loading: false,
  error: '',
  weather: null,
  forecast: null,
  alerts: [],
  cityTime: new Date(),
  photoUrl: '',
  lastCoords: null
};

function reducer(state, action) {
  switch (action.type) {
    case 'setQuery':
      return { ...state, query: action.payload };
    case 'setUnits':
      return { ...state, units: action.payload };
    case 'setLanguage':
      return { ...state, language: action.payload };
    case 'startLoading':
      return { ...state, loading: true, error: '' };
    case 'setError':
      return { ...state, loading: false, error: action.payload };
    case 'setWeatherData':
      return {
        ...state,
        loading: false,
        error: '',
        weather: action.payload.weather,
        forecast: action.payload.forecast,
        alerts: action.payload.alerts ?? state.alerts,
        query: action.payload.query ?? state.query,
        lastCoords: action.payload.lastCoords,
        photoUrl: action.payload.photoUrl,
        cityTime: getCityTimeFromOffset(action.payload.weather.timezone)
      };
    default:
      return state;
  }
}

function getCountryName(regionCode, locale) {
  if (!regionCode) {
    return '';
  }

  try {
    const display = new Intl.DisplayNames([locale], { type: 'region' });
    return display.of(regionCode) || regionCode;
  } catch (error) {
    return regionCode;
  }
}

function getBackdropPhotoUrl(city, countryCode) {
  const countryName = getCountryName(countryCode, 'en');
  const query = encodeURIComponent(`${city} ${countryName} tourist attraction blurred`);
  return `https://source.unsplash.com/1600x900/?${query}`;
}

function App() {
  const ENABLE_STRICT_CITY_MATCH = true;
  const ENABLE_AUTOCOMPLETE = true;

  const [state, dispatch] = useReducer(reducer, initialState);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedDayKey, setSelectedDayKey] = useState('');
  const [emailForm, setEmailForm] = useState({ name: '', email: '' });
  const [emailMessage, setEmailMessage] = useState('');
  const emailFormRef = useRef(null);
  const latestActionIdRef = useRef(0);
  const hasLoadedInitialWeatherRef = useRef(false);
  const lastCoordsRef = useRef(null);

  const text = TRANSLATIONS[state.language];
  const locale = state.language === 'fr' ? 'fr-FR' : 'en-CA';
  const timezone = state.weather?.timezone || 0;

  const hourlyEntries = useMemo(() => {
    if (!state.forecast?.list) {
      return [];
    }
    const entriesForDay = selectedDayKey
      ? state.forecast.list.filter((item) => item.dt_txt.startsWith(selectedDayKey))
      : state.forecast.list;
    return entriesForDay.slice(0, 8);
  }, [state.forecast, selectedDayKey]);

  const dailyEntries = useMemo(() => {
    if (!state.forecast?.list) {
      return [];
    }
    return groupDailyForecast(state.forecast.list);
  }, [state.forecast]);

  const selectedDayLabel = useMemo(() => {
    const selectedDay = dailyEntries.find((day) => day.dateKey === selectedDayKey);
    if (!selectedDay) {
      return '';
    }
    return toWeekdayLabel(selectedDay.dt, timezone, locale);
  }, [dailyEntries, selectedDayKey, timezone, locale]);

  const selectedForecastDate = useMemo(() => {
    const selectedDay = dailyEntries.find((day) => day.dateKey === selectedDayKey);
    if (!selectedDay) {
      return '';
    }

    return new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    }).format(new Date((selectedDay.dt + timezone) * 1000));
  }, [dailyEntries, selectedDayKey, timezone, locale]);

  const theme = useMemo(() => {
    const localHour = state.cityTime.getHours();
    return getBackgroundTheme(state.weather?.weather?.[0]?.main, localHour);
  }, [state.weather, state.cityTime]);

  useEffect(() => {
    if (!state.weather?.timezone) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      dispatch({
        type: 'setWeatherData',
        payload: {
          weather: state.weather,
          forecast: state.forecast,
          alerts: state.alerts,
          query: state.query,
          lastCoords: state.lastCoords,
          photoUrl: state.photoUrl
        }
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [state.weather, state.forecast, state.alerts, state.query, state.lastCoords, state.photoUrl]);

  useEffect(() => {
    if (!ENABLE_AUTOCOMPLETE) {
      return undefined;
    }

    const query = state.query.trim();
    if (query.length < 2) {
      setCitySuggestions([]);
      return undefined;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const suggestions = await getCitySuggestions(query, 5);
        setCitySuggestions(suggestions);
      } catch (error) {
        setCitySuggestions([]);
      }
    }, 220);

    return () => clearTimeout(timeoutId);
  }, [state.query, ENABLE_AUTOCOMPLETE]);

  const loadWeatherByCoords = useCallback(async (lat, lon, actionId, options = {}) => {
    const { skipLoading = false } = options;

    if (!skipLoading && actionId === latestActionIdRef.current) {
      dispatch({ type: 'startLoading' });
    }

    try {
      const [weather, forecast] = await Promise.all([
        getCurrentWeatherByCoords(lat, lon, state.units, state.language),
        getForecastByCoords(lat, lon, state.units, state.language)
      ]);

      const alerts = await getWeatherAlertsByCoords(lat, lon, state.language).catch(() => []);

      if (actionId !== latestActionIdRef.current) {
        return;
      }

      dispatch({
        type: 'setWeatherData',
        payload: {
          weather,
          forecast,
          alerts,
          lastCoords: { lat, lon },
          photoUrl: getBackdropPhotoUrl(weather.name, weather.sys.country)
        }
      });
    } catch (error) {
      if (actionId !== latestActionIdRef.current) {
        return;
      }

      dispatch({
        type: 'setError',
        payload: normalizeWeatherApiError(error, state.language)
      });
    }
  }, [state.units, state.language]);

  async function handleSearch(event) {
    event.preventDefault();
    const actionId = latestActionIdRef.current + 1;
    latestActionIdRef.current = actionId;

    if (!state.query.trim()) {
      dispatch({ type: 'setError', payload: text.defaultError });
      return;
    }

    dispatch({ type: 'startLoading' });

    try {
      const strictCoordinates = await getCoordinatesForCity(state.query.trim(), {
        strictMatch: ENABLE_STRICT_CITY_MATCH
      });
      if (actionId !== latestActionIdRef.current) {
        return;
      }

      setShowSuggestions(false);
      await loadWeatherByCoords(strictCoordinates.lat, strictCoordinates.lon, actionId, { skipLoading: true });
    } catch (error) {
      if (actionId !== latestActionIdRef.current) {
        return;
      }

      dispatch({
        type: 'setError',
        payload: normalizeWeatherApiError(error, state.language)
      });
    }
  }

  function handleUseMyLocation() {
    setShowSuggestions(false);

    if (!navigator.geolocation) {
      dispatch({
        type: 'setError',
        payload:
          state.language === 'fr'
            ? 'La geolocalisation nest pas prise en charge par votre navigateur.'
            : 'Geolocation is not supported by your browser.'
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const actionId = latestActionIdRef.current + 1;
        latestActionIdRef.current = actionId;
        await loadWeatherByCoords(position.coords.latitude, position.coords.longitude, actionId);
      },
      (geoError) => {
        dispatch({
          type: 'setError',
          payload: normalizeGeolocationError(geoError, state.language)
        });
      }
    );
  }

  useEffect(() => {
    if (hasLoadedInitialWeatherRef.current) {
      return;
    }

    hasLoadedInitialWeatherRef.current = true;
    const actionId = latestActionIdRef.current + 1;
    latestActionIdRef.current = actionId;
    loadWeatherByCoords(45.5019, -73.5674, actionId);
  }, [loadWeatherByCoords]);

  useEffect(() => {
    lastCoordsRef.current = state.lastCoords;
  }, [state.lastCoords]);

  useEffect(() => {
    const coords = lastCoordsRef.current;
    if (coords) {
      const actionId = latestActionIdRef.current + 1;
      latestActionIdRef.current = actionId;
      loadWeatherByCoords(coords.lat, coords.lon, actionId);
    }
  }, [state.units, state.language, loadWeatherByCoords]);

  useEffect(() => {
    if (!dailyEntries.length) {
      setSelectedDayKey('');
      return;
    }

    const hasSelectedDay = dailyEntries.some((day) => day.dateKey === selectedDayKey);
    if (!hasSelectedDay) {
      setSelectedDayKey(dailyEntries[0].dateKey);
    }
  }, [dailyEntries, selectedDayKey]);

  function handleScrollToEmailForm() {
    emailFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleEmailFieldChange(event) {
    const { name, value } = event.target;
    setEmailForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleEmailSubmit(event) {
    event.preventDefault();
    setEmailMessage(text.emailSuccess);
  }

  async function handleSelectSuggestion(suggestion) {
    const actionId = latestActionIdRef.current + 1;
    latestActionIdRef.current = actionId;

    const nextQuery = suggestion.state
      ? `${suggestion.name}, ${suggestion.state}, ${suggestion.country}`
      : `${suggestion.name}, ${suggestion.country}`;
    dispatch({ type: 'setQuery', payload: nextQuery });
    setShowSuggestions(false);

    await loadWeatherByCoords(suggestion.lat, suggestion.lon, actionId);
  }

  return (
    <div
      className={`app-shell scene-${theme.scene}`}
      style={{ '--weather-gradient': theme.gradient, '--weather-tint': theme.tint }}
    >
      <div
        className="photo-backdrop"
        style={{
          backgroundImage: state.photoUrl ? `url(${state.photoUrl})` : undefined
        }}
      />

      <AnimatedScene scene={theme.scene} />

      <main className="app-content">
        <div className="top-utility-row">
          <button type="button" className="btn email-cta-btn" onClick={handleScrollToEmailForm}>
            {text.emailForecastCta}
          </button>

          <section className="top-controls glass" aria-label={text.controlsLabel}>
            <label className="control-label" htmlFor="unit-select">
              {text.unitLabel}
            </label>
            <select
              id="unit-select"
              className="select"
              value={state.units}
              onChange={(event) => dispatch({ type: 'setUnits', payload: event.target.value })}
            >
              <option value="metric">Celsius (°C)</option>
              <option value="imperial">Fahrenheit (°F)</option>
            </select>

            <label className="control-label" htmlFor="lang-select">
              {text.languageLabel}
            </label>
            <select
              id="lang-select"
              className="select"
              value={state.language}
              onChange={(event) => dispatch({ type: 'setLanguage', payload: event.target.value })}
            >
              <option value="en">English</option>
              <option value="fr">Francais</option>
            </select>
          </section>
        </div>

        <header className="app-heading glass">
          <h1>{text.appTitle}</h1>
        </header>

        <SearchBar
          query={state.query}
          onQueryChange={(value) => dispatch({ type: 'setQuery', payload: value })}
          onSubmit={handleSearch}
          onUseMyLocation={handleUseMyLocation}
          suggestions={citySuggestions}
          showSuggestions={showSuggestions && ENABLE_AUTOCOMPLETE}
          onSuggestionSelect={handleSelectSuggestion}
          onInputFocus={() => setShowSuggestions(true)}
          onInputBlur={() => {
            setTimeout(() => setShowSuggestions(false), 120);
          }}
          text={text}
        />

        {state.error && <div className="error-banner glass">{state.error}</div>}
        {state.loading && <div className="loading-banner glass">{text.loading}</div>}

        {state.weather && (
          <WeatherDisplay
            weather={state.weather}
            alerts={state.alerts}
            cityTime={state.cityTime}
            selectedForecastDate={selectedForecastDate}
            units={state.units}
            text={text}
            locale={locale}
          />
        )}

        {hourlyEntries.length > 0 && (
          <HourlyForecast
            entries={hourlyEntries}
            timezone={timezone}
            units={state.units}
            locale={locale}
            text={text}
            selectedDayLabel={selectedDayLabel}
          />
        )}

        {dailyEntries.length > 0 && (
          <FiveDayForecast
            days={dailyEntries}
            timezone={timezone}
            units={state.units}
            locale={locale}
            text={text}
            activeDayKey={selectedDayKey}
            onDaySelect={setSelectedDayKey}
          />
        )}

        <section className="email-form-panel glass" ref={emailFormRef}>
          <h3>{text.emailFormTitle}</h3>
          <p>{text.emailFormDescription}</p>

          <form className="email-form" onSubmit={handleEmailSubmit}>
            <label htmlFor="email-name">{text.nameLabel}</label>
            <input
              id="email-name"
              className="search-input"
              name="name"
              type="text"
              value={emailForm.name}
              onChange={handleEmailFieldChange}
              placeholder={text.namePlaceholder}
              required
            />

            <label htmlFor="email-address">{text.emailLabel}</label>
            <input
              id="email-address"
              className="search-input"
              name="email"
              type="email"
              value={emailForm.email}
              onChange={handleEmailFieldChange}
              placeholder={text.emailPlaceholder}
              required
            />

            <button type="submit" className="btn primary-btn">
              {text.sendEmailButton}
            </button>
          </form>

          {emailMessage && <p className="email-message">{emailMessage}</p>}
        </section>
      </main>
    </div>
  );
}

export default App;
