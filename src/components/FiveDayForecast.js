import React from "react";
import { formatTemp, getUnitSymbol, toWeekdayLabel } from './formatters';

function FiveDayForecast({
  days,
  timezone,
  units,
  locale,
  text,
  activeDayKey,
  onDaySelect,
}) {
  const unitSymbol = getUnitSymbol(units);

  const handleKeyDown = (event, dateKey) => {
    const isActivateKey = event.key === "Enter" || event.key === " ";
    if (!isActivateKey) return;

    event.preventDefault();
    onDaySelect(dateKey);
  };

  const renderDayCard = (day) => {
    const isActive = activeDayKey === day.dateKey;

    return (
      <article
        key={day.dateKey}
        className={`day-card ${isActive ? "active-day" : ""}`}
        role="button"
        tabIndex={0}
        aria-pressed={isActive}
        onClick={() => onDaySelect(day.dateKey)}
        onKeyDown={(e) => handleKeyDown(e, day.dateKey)}
      >
        <span>{toWeekdayLabel(day.dt, timezone, locale)}</span>

        <img
          alt={day.weather.description}
          src={`https://openweathermap.org/img/wn/${day.weather.icon}.png`}
        />

        <p>{day.weather.description}</p>

        <strong>
          {formatTemp(day.maxTemp)} {unitSymbol} /{" "}
          {formatTemp(day.minTemp)} {unitSymbol}
        </strong>
      </article>
    );
  };

  return (
    <section className="forecast-panel glass">
      <h3>{text.fiveDays}</h3>
      <div className="daily-grid">{days.map(renderDayCard)}</div>
    </section>
  );
}

export default FiveDayForecast;