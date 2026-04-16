export function getUnitSymbol(units) {
  return units === 'imperial' ? '°F' : '°C';
}

export function getWindUnit(units) {
  return units === 'imperial' ? 'mph' : 'm/s';
}

export function formatTemp(value) {
  return Math.round(value);
}

export function getBackgroundTheme(weatherMain, localHour) {
  const isNight = localHour >= 19 || localHour <= 5;
  const key = (weatherMain || '').toLowerCase();

  if (key.includes('rain') || key.includes('drizzle') || key.includes('thunderstorm')) {
    return {
      gradient: isNight
        ? 'radial-gradient(circle at 18% 24%, #2e6f99 0%, #153f63 45%, #0c243a 100%)'
        : 'radial-gradient(circle at 15% 20%, #70b6e9 0%, #3f7fae 48%, #2c5f88 100%)',
      tint: 'rgba(92, 164, 214, 0.34)',
      scene: 'rain'
    };
  }

  if (key.includes('cloud') || key.includes('mist') || key.includes('fog') || key.includes('haze')) {
    return {
      gradient: isNight
        ? 'radial-gradient(circle at 20% 18%, #68768a 0%, #3f4856 45%, #272d37 100%)'
        : 'radial-gradient(circle at 20% 20%, #c4ced8 0%, #8d99a8 50%, #677384 100%)',
      tint: 'rgba(170, 179, 191, 0.3)',
      scene: 'clouds'
    };
  }

  if (key.includes('snow')) {
    return {
      gradient: isNight
        ? 'radial-gradient(circle at 22% 16%, #6e8fa8 0%, #436078 44%, #2a3f53 100%)'
        : 'radial-gradient(circle at 22% 16%, #e5f4ff 0%, #b7d7ee 44%, #87b2d0 100%)',
      tint: 'rgba(210, 237, 255, 0.38)',
      scene: 'snow'
    };
  }

  if (key.includes('clear')) {
    return {
      gradient: isNight
        ? 'radial-gradient(circle at 65% 10%, #3b4f8f 0%, #1d2b59 48%, #121c3b 100%)'
        : 'radial-gradient(circle at 65% 10%, #fff2a8 0%, #ffd35f 35%, #f38b2f 100%)',
      tint: isNight ? 'rgba(110, 131, 215, 0.28)' : 'rgba(255, 200, 94, 0.34)',
      scene: isNight ? 'stars' : 'sun'
    };
  }

  return {
    gradient: isNight
      ? 'radial-gradient(circle at 25% 15%, #445b7e 0%, #2b3a53 46%, #1d2737 100%)'
      : 'radial-gradient(circle at 20% 20%, #9dd3fb 0%, #75a8d6 50%, #4f769d 100%)',
    tint: 'rgba(140, 188, 226, 0.28)',
    scene: 'clouds'
  };
}

export function buildLocationLabel(weather) {
  const city = weather?.name || '';
  const country = weather?.sys?.country || '';
  return country ? `${city}, ${country}` : city;
}

export function getCityTimeFromOffset(timezoneOffsetSeconds) {
  const utcNow = Date.now() + new Date().getTimezoneOffset() * 60 * 1000;
  return new Date(utcNow + timezoneOffsetSeconds * 1000);
}

export function toHourLabel(timestampSeconds, timezoneOffsetSeconds, locale) {
  const date = new Date((timestampSeconds + timezoneOffsetSeconds) * 1000);
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC'
  }).format(date);
}

export function toWeekdayLabel(timestampSeconds, timezoneOffsetSeconds, locale) {
  const date = new Date((timestampSeconds + timezoneOffsetSeconds) * 1000);
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  }).format(date);
}

export function groupDailyForecast(list) {
  const grouped = {};

  list.forEach((item) => {
    const [datePart] = item.dt_txt.split(' ');
    if (!grouped[datePart]) {
      grouped[datePart] = [];
    }
    grouped[datePart].push(item);
  });

  return Object.keys(grouped)
    .slice(0, 5)
    .map((dateKey) => {
      const entries = grouped[dateKey];
      const midday = entries.find((entry) => entry.dt_txt.includes('12:00:00')) || entries[0];
      const minTemp = Math.min(...entries.map((entry) => entry.main.temp_min));
      const maxTemp = Math.max(...entries.map((entry) => entry.main.temp_max));

      return {
        dateKey,
        dt: midday.dt,
        weather: midday.weather[0],
        minTemp,
        maxTemp
      };
    });
}

export function normalizeWeatherApiError(error, language) {
  const isFrench = language === 'fr';
  const status = Number(error?.status);
  const apiCode = String(error?.apiCode || '').toLowerCase();
  const message = String(error?.message || '').toLowerCase();

  if (apiCode === 'city_not_found' || status === 404 || message.includes('city not found')) {
    return isFrench
      ? 'Ville introuvable. Verifiez le nom et ajoutez le code pays (exemple : Montreal,CA).'
      : 'City not found. Please check spelling and include country code (example: Montreal,CA).';
  }

  if (status === 401 || message.includes('invalid api key')) {
    return isFrench
      ? 'Cle API invalide. Verifiez votre configuration OpenWeatherMap dans le fichier .env.'
      : 'Invalid API key. Please verify your OpenWeatherMap key in the .env file.';
  }

  if (status === 429 || message.includes('too many requests')) {
    return isFrench
      ? 'Limite de requetes atteinte. Reessayez dans quelques instants.'
      : 'Rate limit reached. Please try again in a moment.';
  }

  if (status >= 500) {
    return isFrench
      ? 'Le service meteo est temporairement indisponible. Reessayez plus tard.'
      : 'Weather service is temporarily unavailable. Please try again later.';
  }

  if (message.includes('missing api key')) {
    return isFrench
      ? 'Cle API manquante. Ajoutez REACT_APP_WEATHER_API_KEY ou VITE_APP_WEATHER_API_KEY dans .env.'
      : 'Missing API key. Add REACT_APP_WEATHER_API_KEY or VITE_APP_WEATHER_API_KEY to .env.';
  }

  return isFrench
    ? 'Impossible de recuperer les donnees meteo pour le moment. Reessayez.'
    : 'Unable to fetch weather data right now. Please try again.';
}

export function normalizeGeolocationError(geoError, language) {
  const isFrench = language === 'fr';
  const code = Number(geoError?.code);

  if (code === 1) {
    return isFrench
      ? 'Acces a la position refuse. Autorisez la geolocalisation dans votre navigateur.'
      : 'Location access denied. Please allow geolocation in your browser.';
  }

  if (code === 2) {
    return isFrench
      ? 'Position indisponible. Verifiez votre connexion ou GPS, puis reessayez.'
      : 'Location unavailable. Check your network or GPS and try again.';
  }

  if (code === 3) {
    return isFrench
      ? 'La demande de geolocalisation a expire. Reessayez.'
      : 'Geolocation request timed out. Please try again.';
  }

  return isFrench
    ? 'Impossible de recuperer votre position. Verifiez les permissions.'
    : 'Unable to access your location. Please allow location permissions.';
}

export const TRANSLATIONS = {
  en: {
    appTitle: "Brian's Weather App",
    searchPlaceholder: 'Enter city (example: Montreal,CA)',
    search: 'Search',
    suggestionsLabel: 'City suggestions',
    useMyLocation: 'Use my location',
    emailForecastCta: ' Enter your name and email to receive the currently viewed forecast.',
    unitLabel: 'Units',
    languageLabel: 'Language',
    controlsLabel: 'Weather controls',
    hourly: '3-Hour Forecast',
    fiveDays: '5-Day Forecast',
    humidity: 'Humidity',
    localTimeLabel: 'Local time in',
    selectedCityLabel: 'Selected city',
    forecastDateLabel: 'Forecast date',
    feelsLike: 'Feels like',
    wind: 'Wind',
    sunrise: 'Sunrise',
    sunset: 'Sunset',
    alertsTitle: 'Weather Alerts',
    alertFrom: 'From',
    alertTo: 'To',
    emailFormTitle: 'Enter your name and email to receive the currently viewed forecast.',
    nameLabel: 'Name',
    namePlaceholder: 'Your name',
    emailLabel: 'Email',
    emailPlaceholder: 'you@example.com',
    sendEmailButton: 'Send forecast',
    emailSuccess: 'Thanks! Your request has been recorded. Email delivery can be connected next.',
    loading: 'Loading weather data...',
    defaultError: 'Please enter a valid city and try again.'
  },
  fr: {
    appTitle: "L'application météo de Brian",
    searchPlaceholder: 'Entrez une ville (exemple : Montreal,CA)',
    search: 'Rechercher',
    suggestionsLabel: 'Suggestions de villes',
    useMyLocation: 'Utiliser ma position',
    emailForecastCta: 'Entrez votre nom et votre courriel pour recevoir la prevision actuellement affichee.',
    unitLabel: 'Unites',
    languageLabel: 'Langue',
    controlsLabel: 'Controles meteo',
    hourly: 'Previsions pour les 3 prochaines heures',
    fiveDays: 'Previsions 5 jours',
    humidity: 'Humidite',
    localTimeLabel: 'Heure locale a',
    selectedCityLabel: 'Ville selectionnee',
    forecastDateLabel: 'Date de prevision',
    feelsLike: 'Ressenti',
    wind: 'Vent',
    sunrise: 'Lever du soleil',
    sunset: 'Coucher du soleil',
    alertsTitle: 'Alertes meteo',
    alertFrom: 'Du',
    alertTo: 'Au',
    emailFormTitle: 'Entrez votre nom et votre courriel pour recevoir la prevision actuellement affichee.',
    nameLabel: 'Nom',
    namePlaceholder: 'Votre nom',
    emailLabel: 'Courriel',
    emailPlaceholder: 'vous@exemple.com',
    sendEmailButton: 'Envoyer la prevision',
    emailSuccess: 'Merci! Votre demande est enregistree. La livraison par courriel peut etre connectee ensuite.',
    loading: 'Chargement des donnees meteo...',
    defaultError: 'Saisissez une ville valide puis reessayez.'
  }
};
