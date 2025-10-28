import { useState } from 'react';
import { ThermometerSun, CloudRain, Wind, Droplets, X, Settings } from 'lucide-react';
import { NAVBAR_ICON_SIZE, WEATHER_ICON_SIZE, WEATHER_WIDGET_WIDTH, SETTINGS_ICON_SIZE } from '../utils/constants';
import { weatherThemes } from '../utils/weatherThemes';
import useGlobalReducer from "../hooks/useGlobalReducer";

const WeatherWidget = ({ weather, city, loading, onChangeCity, defaultOpen = false }) => {

  const { store } = useGlobalReducer();
  const textMutedClass = !store.isDarkMode ? "text-light" : "text-muted";

  const [open, setOpen] = useState(defaultOpen);
  const [searchMode, setSearchMode] = useState(!city);
  const [query, setQuery] = useState(city || '');

  const current = weather?.current;
  const forecast3 = weather?.forecast?.slice(0, 3) || [];

  const handleToggle = () => setOpen((prev) => !prev);

  const handleSubmitCity = (e) => {
    e.preventDefault();
    const trimmed = query.trim().charAt(0).toUpperCase() + query.trim().slice(1).toLowerCase();
    if (!trimmed) return;
    if (onChangeCity) onChangeCity(trimmed);
    else localStorage.setItem('home.city', trimmed);
    setSearchMode(false);
    setQuery("");
  };

  // --- RENDER HELPERS ---
  const renderCollapsedButton = () => (
    <button
      type="button"
      className="btn btn-primary rounded-circle d-flex align-items-center justify-content-center shadow-sm border weather-btn"
      onClick={handleToggle}
      aria-label="Open weather"
    >
      <ThermometerSun size={NAVBAR_ICON_SIZE} />
    </button>
  );

  const renderHeader = () => (
    <div className="d-flex align-items-start justify-content-between">
      <div>
        <div className={`small ${textMutedClass}`}>{weather?.country || ''}</div>
        <div className="fw-semibold">{weather?.city || city}</div>
      </div>

      <div className="d-flex align-items-center gap-1">
        <button
          type="button"
          className="btn btn-sm text-light p-1 rotate-on-hover"
          onClick={() => {
            setSearchMode((prev) => {
              const next = !prev;
              if (next) {
                setQuery("");
              }

              return next;
            });
          }}
          aria-label="Search another city"
          title="Search another city"
        >
          <Settings size={SETTINGS_ICON_SIZE} />
        </button>


        <button
          type="button"
          className="btn btn-sm text-light border-light border-2 rounded-circle p-1 rotate-on-hover"
          onClick={handleToggle}
          aria-label="Close weather"
          title="Close weather"
        >
          <X size={NAVBAR_ICON_SIZE} />
        </button>
      </div>
    </div>
  );


  const renderSearchForm = () => (
    <form className="mt-2 d-flex align-items-center gap-2" onSubmit={handleSubmitCity}>
      <div className="position-relative flex-grow-1">
        <input
          className="form-control"
          placeholder="Enter city…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <button type="submit" className="btn bg-orange text-white">Go</button>
    </form>
  );
  const renderWeatherInfo = () => {
    if (loading) {
      return (
        <div className={`d-flex align-items-center ${textMutedClass}`}>
          <span
            className="spinner-border spinner-border-sm me-2"
            role="status"
            aria-hidden="true"
          ></span>
          Loading…
        </div>
      );
    }

    if (current) {
      return (
        <>
          <span className="display-6 fw-bold">{Math.round(current.temperature)}°</span>
          <span className={`${textMutedClass}`}>{current.description}</span>
        </>
      );
    }

    return <span className="text-danger">No data</span>;
  };


  const renderCurrentStats = () => (
    <div className={`mt-2 d-flex flex-wrap gap-3 small ${textMutedClass}`}>
      <span className="d-inline-flex align-items-center gap-1">
        <Droplets size={WEATHER_ICON_SIZE} />{current.humidity}%
      </span>
      <span className="d-inline-flex align-items-center gap-1">
        <Wind size={WEATHER_ICON_SIZE} />{current.wind_speed} m/s
      </span>
    </div>
  );

  const renderForecast = () => (
    <div className="mt-3 row g-2 row-cols-3">
      {forecast3.map((d) => (
        <div key={d.date} className="col">
          <div className="rounded-3 p-2 text-center h-100 bg-white bg-opacity-10">
            <div className="small fw-semibold text-truncate">
              {d.day_name.slice(0, 3).toUpperCase()}
            </div>
            <div className="small">
              {Math.round(d.temp_min)}° / {Math.round(d.temp_max)}°
            </div>
            <div className="small d-inline-flex align-items-center gap-1">
              <CloudRain size={WEATHER_ICON_SIZE} />{d.pop}%
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // --- BG THEMES ---
  const themeFor = (desc = '') => {
    const d = desc.toLowerCase();
    if (d.includes('clear')) return weatherThemes.Clear;
    if (d.includes('cloud')) return weatherThemes.Clouds;
    if (d.includes('rain')) return weatherThemes.Rain;
    if (d.includes('snow')) return weatherThemes.Snow;
    if (d.includes('thunder')) return weatherThemes.Thunderstorm;
    if (d.includes('drizzle')) return weatherThemes.Drizzle;
    if (d.includes('mist') || d.includes('fog') || d.includes('haze')) return weatherThemes.Mist;
    return weatherThemes.Default;
  };

  const cardStyle = {
    width: WEATHER_WIDGET_WIDTH,
    background: themeFor(current?.description || ''),
    color: '#fff',
  };

  // --- MAIN RENDER ---
  if (!open) return renderCollapsedButton();

  return (
    <div
      className="card position-relative shadow-sm border rounded-4 text-white overflow-hidden"
      style={cardStyle}
    >
      {/* --- OVERLAY --- */}
      <div
        className="position-absolute top-0 start-0 w-100 h-100"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.25)",
          zIndex: 1,
        }}
      ></div>

      <div className="card-body position-relative p-3" style={{ zIndex: 2 }}>
        {renderHeader()}

        {searchMode ? (
          renderSearchForm()
        ) : (
          <div className="d-flex align-items-baseline gap-2 mt-2">
            {renderWeatherInfo()}
          </div>
        )}

        {!searchMode && current && renderCurrentStats()}
        {!searchMode && forecast3.length > 0 && renderForecast()}
      </div>
    </div>
  );

};

export default WeatherWidget;
