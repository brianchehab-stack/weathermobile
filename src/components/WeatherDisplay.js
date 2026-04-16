import React from 'react';
import { formatTemp, getUnitSymbol, getWindUnit } from './formatters';

function formatClockTime(value, locale) {
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(value);
}

function formatAlertDateTime(timestampSeconds, timezoneOffsetSeconds, locale) {
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC'
  }).format(new Date((Number(timestampSeconds || 0) + timezoneOffsetSeconds) * 1000));
}

function WeatherDisplay({ weather, alerts, cityTime, selectedForecastDate, units, text, locale }) {
  const symbol = getUnitSymbol(units);
  const windUnit = getWindUnit(units);

  return (
    <section className="current-weather glass">
      <div className="current-header">
        <div>
          <p className="city-time">
            <strong>{text.localTimeLabel} {weather.name}: </strong>
            {formatClockTime(cityTime, locale)}
          </p>
          <p className="forecast-date">
            <strong>{text.forecastDateLabel}: </strong>
            {selectedForecastDate || '--'}
          </p>
          <p className="condition-line">{weather.weather[0].description}</p>
        </div>
        <img
          className="condition-icon"
          alt={weather.weather[0].description}
          src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
        />
      </div>

      <div className="temp-band">
        <span className="temp-big">
          {formatTemp(weather.main.temp)} {symbol}
        </span>
      </div>

      <div className="meta-grid">
        <article className="meta-card">
          <span>{text.feelsLike}</span>
          <strong>
            {formatTemp(weather.main.feels_like)} {symbol}
          </strong>
        </article>
        <article className="meta-card">
          <span>{text.humidity}</span>
          <strong>{weather.main.humidity}%</strong>
        </article>
        <article className="meta-card">
          <span>{text.wind}</span>
          <strong>
            {weather.wind.speed} {windUnit}
          </strong>
        </article>
        <article className="meta-card">
          <span>{text.sunrise}</span>
          <strong>
            {new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(
              new Date((weather.sys.sunrise + weather.timezone) * 1000)
            )}
          </strong>
        </article>
      </div>

      {Array.isArray(alerts) && alerts.length > 0 && (
        <section className="alerts-panel" aria-label={text.alertsTitle}>
          <h3>{text.alertsTitle}</h3>
          <ul className="alerts-list">
            {alerts.map((alert) => (
              <li key={`${alert.event}-${alert.start}-${alert.end}`} className="alert-card">
                <strong>{alert.event || 'Alert'}</strong>
                <p>{alert.sender_name || 'OpenWeather'}</p>
                <p>
                  {text.alertFrom}:{' '}
                  {formatAlertDateTime(alert.start, weather.timezone, locale)}
                </p>
                <p>
                  {text.alertTo}:{' '}
                  {formatAlertDateTime(alert.end, weather.timezone, locale)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}

export default WeatherDisplay;
