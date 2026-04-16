const API_BASE = 'https://api.openweathermap.org/data/2.5';
const GEO_BASE = 'https://api.openweathermap.org/geo/1.0';
const ONECALL_BASE = 'https://api.openweathermap.org/data/3.0';

const API_KEY = process.env.REACT_APP_WEATHER_API_KEY || process.env.VITE_APP_WEATHER_API_KEY;

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’'`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitSearchQuery(cityQuery) {
  return String(cityQuery || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function scoreCandidate(candidate, cityQuery) {
  const parts = splitSearchQuery(cityQuery);
  const requestedCity = normalizeText(parts[0]);
  const requestedRegion = normalizeText(parts[1]);
  const requestedCountry = normalizeText(parts[2] || (parts[1] && parts[1].length === 2 ? parts[1] : ''));

  const candidateName = normalizeText(candidate?.name);
  const candidateState = normalizeText(candidate?.state);
  const candidateCountry = normalizeText(candidate?.country);
  const localNames = Object.values(candidate?.local_names || {}).map((name) => normalizeText(name));

  let score = 0;

  if (requestedCity && candidateName === requestedCity) {
    score += 100;
  } else if (requestedCity && localNames.includes(requestedCity)) {
    score += 95;
  } else if (requestedCity && candidateName.startsWith(requestedCity)) {
    score += 70;
  } else if (requestedCity && candidateName.includes(requestedCity)) {
    score += 50;
  }

  if (requestedCountry && candidateCountry === requestedCountry) {
    score += 30;
  }

  if (requestedRegion && candidateState === requestedRegion) {
    score += 20;
  }

  if (typeof candidate?.lat === 'number' && typeof candidate?.lon === 'number') {
    score += 1;
  }

  return score;
}

function isStrictCityMatch(candidate, cityQuery) {
  const requestedCity = normalizeText(splitSearchQuery(cityQuery)[0]);
  if (!requestedCity) {
    return false;
  }

  const candidateName = normalizeText(candidate?.name);
  const localNames = Object.values(candidate?.local_names || {}).map((name) => normalizeText(name));

  return candidateName === requestedCity || localNames.includes(requestedCity);
}

function assertCod200(payload) {
  if (payload && payload.cod !== undefined && Number(payload.cod) !== 200) {
    const apiError = new Error(payload.message || 'Unable to fetch weather data right now.');
    apiError.status = Number(payload.cod) || 500;
    apiError.apiCode = String(payload.cod);
    throw apiError;
  }
}

function ensureApiKey() {
  if (!API_KEY) {
    throw new Error('Missing API key. Add REACT_APP_WEATHER_API_KEY or VITE_APP_WEATHER_API_KEY in .env.');
  }
}

async function safeFetch(url) {
  const response = await fetch(url);

  if (!response.ok) {
    let message = 'Unable to fetch weather data right now.';
    let apiCode = '';

    try {
      const payload = await response.json();
      if (payload && payload.message) {
        message = payload.message;
      }
      if (payload && payload.cod !== undefined) {
        apiCode = String(payload.cod);
      }
    } catch (error) {
    
    }

    const enrichedError = new Error(message);
    enrichedError.status = response.status;
    enrichedError.apiCode = apiCode;
    throw enrichedError;
  }

  return response.json();
}

export async function getCurrentWeatherByCity(city, units, lang) {
  ensureApiKey();

  const query = new URLSearchParams({
    q: city,
    appid: API_KEY,
    units,
    lang
  });

  const data = await safeFetch(`${API_BASE}/weather?${query.toString()}`);
  assertCod200(data);
  return data;
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

  const data = await safeFetch(`${API_BASE}/weather?${query.toString()}`);
  assertCod200(data);
  return data;
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

  const data = await safeFetch(`${API_BASE}/forecast?${query.toString()}`);
  assertCod200(data);
  return data;
}

export async function getWeatherAlertsByCoords(lat, lon, lang) {
  ensureApiKey();

  const query = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    appid: API_KEY,
    lang,
    exclude: 'current,minutely,hourly,daily'
  });

  const data = await safeFetch(`${ONECALL_BASE}/onecall?${query.toString()}`);
  if (!Array.isArray(data?.alerts)) {
    return [];
  }

  return data.alerts;
}

export async function getCoordinatesForCity(city, options = {}) {
  const { strictMatch = false } = options;
  ensureApiKey();

  const query = new URLSearchParams({
    q: city,
    limit: '10',
    appid: API_KEY
  });

  const data = await safeFetch(`${GEO_BASE}/direct?${query.toString()}`);
  if (!Array.isArray(data) || data.length === 0) {
    const notFoundError = new Error('City not found. Please check spelling and try again.');
    notFoundError.status = 404;
    notFoundError.apiCode = 'city_not_found';
    throw notFoundError;
  }

  const ranked = [...data].sort((a, b) => scoreCandidate(b, city) - scoreCandidate(a, city));
  const bestMatch = strictMatch ? ranked.find((candidate) => isStrictCityMatch(candidate, city)) : ranked[0];

  if (!bestMatch) {
    const strictError = new Error('City not found. Please enter an exact city name.');
    strictError.status = 404;
    strictError.apiCode = 'city_not_found';
    throw strictError;
  }

  return bestMatch || data[0];
}

export async function getCitySuggestions(city, limit = 5) {
  ensureApiKey();

  const query = new URLSearchParams({
    q: city,
    limit: String(limit),
    appid: API_KEY
  });

  const data = await safeFetch(`${GEO_BASE}/direct?${query.toString()}`);
  if (!Array.isArray(data)) {
    return [];
  }

  return [...data].sort((a, b) => scoreCandidate(b, city) - scoreCandidate(a, city));
}
