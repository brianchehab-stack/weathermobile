import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getCoordinatesForCity,
  getCurrentWeatherByCoords,
  getForecastByCoords
} from '../services/weatherApi';
import { groupDailyForecast } from '../utils/formatters';
import { loadSettings, saveRecentCity, saveSettings } from '../storage/preferences';

const defaultSettings = {
  units: 'metric',
  language: 'en'
};

export default function useWeather() {
  const [query, setQuery] = useState('Montreal,CA');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [lastCoords, setLastCoords] = useState(null);
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    (async () => {
      const stored = await loadSettings();
      if (stored && mounted) {
        setSettings((prev) => ({ ...prev, ...stored }));
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const loadByCoords = useCallback(async (lat, lon) => {
    setLoading(true);
    setError('');

    try {
      const [current, nextForecast] = await Promise.all([
        getCurrentWeatherByCoords(lat, lon, settings.units, settings.language),
        getForecastByCoords(lat, lon, settings.units, settings.language)
      ]);

      setLastCoords((prev) => {
        if (prev && prev.lat === lat && prev.lon === lon) {
          return prev;
        }

        return { lat, lon };
      });
      setWeather(current);
      setForecast(nextForecast);
    } catch (err) {
      setError(err.message || 'Unable to fetch weather data.');
    } finally {
      setLoading(false);
    }
  }, [settings.language, settings.units]);

  const searchCity = useCallback(async (cityQuery) => {
    if (!cityQuery?.trim()) {
      setError('Please enter a city name.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const city = await getCoordinatesForCity(cityQuery.trim());
      await saveRecentCity({
        name: city.name,
        country: city.country,
        state: city.state || '',
        lat: city.lat,
        lon: city.lon
      });

      setQuery(city.state ? `${city.name}, ${city.state}, ${city.country}` : `${city.name}, ${city.country}`);
      await loadByCoords(city.lat, city.lon);
    } catch (err) {
      setError(err.message || 'Unable to search city.');
      setLoading(false);
    }
  }, [loadByCoords]);

  const updateSettings = useCallback(async (partialSettings) => {
    const next = { ...settings, ...partialSettings };
    setSettings(next);
    await saveSettings(next);
  }, [settings]);

  useEffect(() => {
    if (!lastCoords) {
      return;
    }

    loadByCoords(lastCoords.lat, lastCoords.lon);
  }, [settings.units, settings.language, lastCoords, loadByCoords]);

  const dailyForecast = useMemo(() => {
    if (!forecast?.list) {
      return [];
    }
    return groupDailyForecast(forecast.list);
  }, [forecast]);

  return {
    query,
    setQuery,
    weather,
    forecast,
    dailyForecast,
    settings,
    loading,
    error,
    searchCity,
    loadByCoords,
    updateSettings
  };
}
