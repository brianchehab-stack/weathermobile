
import React from "react";
import { formatTemp, getUnitSymbol, toHourLabel } from './formatters';

function HourlyForecast({
  entries,
  timezone,
  units,
  locale,
  text,
  selectedDayLabel,
}) {
  const unitSymbol = getUnitSymbol(units);

  const heading = selectedDayLabel
    ? `${text.hourly} - ${selectedDayLabel}`
    : text.hourly;

  const renderHourCard = (item) => {
    const weather = item.weather?.[0];

    return (
      <article key={item.dt} className="hour-card">
        <span>{toHourLabel(item.dt, timezone, locale)}</span>

        <img
          alt={weather?.description || "weather icon"}
          src={`https://openweathermap.org/img/wn/${weather?.icon}.png`}
        />

        <strong>
          {formatTemp(item.main.temp)} {unitSymbol}
        </strong>
      </article>
    );
  };

  return (
    <section className="forecast-panel glass">
      <h3>{heading}</h3>

      <div className="hourly-strip">
        {entries.map(renderHourCard)}
      </div>
    </section>
  );
}

export default HourlyForecast;