import React from "react";

function AnimatedScene({ scene }) {
  return (
    <div className={`scene scene-${scene}`} aria-hidden="true">
      {(scene === "clouds" || scene === "rain" || scene === "snow") && (
        <>
          <span className="cloud cloud-1" />
          <span className="cloud cloud-2" />
          <span className="cloud cloud-3" />
        </>
      )}

      {scene === "rain" &&
        Array.from({ length: 18 }).map((_, i) => (
          <span key={`rain-${i}`} className="rain-drop" />
        ))}

      {scene === "snow" &&
        Array.from({ length: 14 }).map((_, i) => (
          <span key={`snow-${i}`} className="snow-flake">
            *
          </span>
        ))}

      {scene === "sun" && <span className="sun-core" />}

      {scene === "stars" &&
        Array.from({ length: 16 }).map((_, i) => (
          <span key={`star-${i}`} className="star" />
        ))}
    </div>
  );
}

export default AnimatedScene;