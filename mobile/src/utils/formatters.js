export function getUnitSymbol(units) {
  return units === 'imperial' ? '°F' : '°C';
}

export function getWindUnit(units) {
  return units === 'imperial' ? 'mph' : 'm/s';
}

export function formatTemp(value) {
  return Math.round(value);
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

export function buildLocationLabel(weather) {
  const city = weather?.name || '';
  const country = weather?.sys?.country || '';
  return country ? `${city}, ${country}` : city;
}
