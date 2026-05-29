const API_BASE = 'https://api.openweathermap.org/data/2.5';
const GEO_BASE = 'https://api.openweathermap.org/geo/1.0';

const API_KEY = process.env.EXPO_PUBLIC_WEATHER_API_KEY;

function ensureApiKey() {
  if (!API_KEY) {
    throw new Error('Missing API key. Add EXPO_PUBLIC_WEATHER_API_KEY in mobile/.env');
  }
}

async function safeFetch(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      let details = '';
      try {
        const payload = await response.json();
        details = payload?.message ? `: ${payload.message}` : '';
      } catch {
        details = '';
      }

      throw new Error(`OpenWeather request failed (${response.status})${details}`);
    }

    return response.json();
  } catch (error) {
    const message = String(error?.message || '').toLowerCase();
    if (message.includes('aborted')) {
      throw new Error('Request timed out. Please check your internet connection and try again.');
    }

    if (message.includes('network request failed') || message.includes('fetch failed')) {
      throw new Error('Network request failed. Ensure your phone/emulator has internet access.');
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getCoordinatesForCity(city) {
  ensureApiKey();

  const query = new URLSearchParams({
    q: city,
    limit: '5',
    appid: API_KEY
  });

  const list = await safeFetch(`${GEO_BASE}/direct?${query.toString()}`);
  if (!Array.isArray(list) || list.length === 0) {
    throw new Error('City not found. Please check spelling and country code.');
  }

  return list[0];
}

export async function getCurrentWeatherByCoords(lat, lon, units, lang) {
  ensureApiKey();

  const query = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    appid: API_KEY,
    units,
    lang
  });

  return safeFetch(`${API_BASE}/weather?${query.toString()}`);
}

export async function getForecastByCoords(lat, lon, units, lang) {
  ensureApiKey();

  const query = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    appid: API_KEY,
    units,
    lang
  });

  return safeFetch(`${API_BASE}/forecast?${query.toString()}`);
}
