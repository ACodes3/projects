import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  Sword,
  Shield,
  Zap,
  Activity,
  Wind,
  ArrowUpRight,
} from "lucide-react";

import {
  getSlayers,
  getBreathingStyles,
  getTechniques,
} from "../services/dataService";

import {
  getSlayerBreathingStyles,
  getBreathingStyleTechniques,
} from "../utils/dataHelpers";

import "./SlayersPage.css";

function SlayersPage() {
  const navigate = useNavigate();

  const [slayers, setSlayers] = useState([]);
  const [breathingStyles, setBreathingStyles] = useState([]);
  const [techniques, setTechniques] = useState([]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  const filteredSlayers = slayers
    .map((slayer, index) => ({ slayer, index }))
    .filter(({ slayer }) =>
      slayer.name.toLowerCase().includes(searchTerm.trim().toLowerCase()),
    );

  useEffect(() => {
    if (!isDropdownOpen) return;

    const handlePointerDown = (event) => {
      if (!dropdownRef.current?.contains(event.target)) {
        setIsDropdownOpen(false);
        setSearchTerm("");
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isDropdownOpen]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [slayerData, breathingData, techniqueData] = await Promise.all([
          getSlayers(),
          getBreathingStyles(),
          getTechniques(),
        ]);

        setSlayers(slayerData);
        setBreathingStyles(breathingData);
        setTechniques(techniqueData);
      } catch (error) {
        console.error(error);

        setError("Could not load Demon Slayer data.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const selectedSlayer = slayers[selectedIndex] || null;

  const selectedBreathingStyles = useMemo(() => {
    if (!selectedSlayer) {
      return [];
    }

    return getSlayerBreathingStyles(selectedSlayer, breathingStyles);
  }, [selectedSlayer, breathingStyles]);

  const primaryBreathingStyle = selectedBreathingStyles[0] || null;

  const breathingTechniques = useMemo(() => {
    if (!primaryBreathingStyle) {
      return [];
    }

    return getBreathingStyleTechniques(primaryBreathingStyle, techniques);
  }, [primaryBreathingStyle, techniques]);

  const handlePrevious = () => {
    setSelectedIndex((current) => {
      if (!slayers.length) {
        return 0;
      }

      return (current - 1 + slayers.length) % slayers.length;
    });
  };

  const handleNext = () => {
    setSelectedIndex((current) => {
      if (!slayers.length) {
        return 0;
      }

      return (current + 1) % slayers.length;
    });
  };

  if (isLoading) {
    return <div className="status-screen">Loading Demon Slayers...</div>;
  }

  if (error) {
    return <div className="status-screen">{error}</div>;
  }

  if (!selectedSlayer) {
    return <div className="status-screen">No Demon Slayers found.</div>;
  }

  const nameParts = selectedSlayer.name.split(" ");

  const mainName = nameParts[0];

  const secondaryName = nameParts.slice(1).join(" ");

  const accentPrimary = primaryBreathingStyle?.theme?.primary || "#4f9cff";

  const accentSecondary = primaryBreathingStyle?.theme?.secondary || "#2348a8";

  return (
    <section
      className="slayers-showcase"
      style={{
        "--slayer-primary": accentPrimary,
        "--slayer-secondary": accentSecondary,
      }}
    >
      <div className="slayers-showcase__mist" />
      <div className="slayers-showcase__light" />

      {/* TOP SELECTOR */}

      <div className="slayers-selector">
        <div className="slayers-selector__label">
          <span className="slayers-selector__mark">
            <Sword size={15} />
          </span>

          <span>DEMON SLAYERS</span>
        </div>

        <div className="slayers-dropdown" ref={dropdownRef}>
          <button
            type="button"
            className="slayers-dropdown__trigger"
            aria-expanded={isDropdownOpen}
            aria-haspopup="listbox"
            onClick={() => {
              setIsDropdownOpen((open) => !open);
              setSearchTerm("");
            }}
          >
            <span>{selectedSlayer.name}</span>
            <ChevronDown size={18} aria-hidden="true" />
          </button>

          {isDropdownOpen && (
            <div className="slayers-dropdown__menu">
              <div className="slayers-dropdown__search">
                <Search size={17} aria-hidden="true" />
                <input
                  type="search"
                  aria-label="Search Demon Slayers"
                  placeholder="Search a Slayer..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  autoFocus
                />
              </div>

              <div
                className="slayers-dropdown__options"
                role="listbox"
                aria-label="Choose a Demon Slayer"
              >
                {filteredSlayers.map(({ slayer, index }) => (
                  <button
                    key={slayer.id}
                    type="button"
                    role="option"
                    aria-selected={index === selectedIndex}
                    className={`slayers-dropdown__option${index === selectedIndex ? " active" : ""}`}
                    onClick={() => {
                      setSelectedIndex(index);
                      setIsDropdownOpen(false);
                      setSearchTerm("");
                    }}
                  >
                    {slayer.name}
                  </button>
                ))}
                {filteredSlayers.length === 0 && (
                  <p className="slayers-dropdown__empty">No Slayers found.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MAIN */}

      <div className="slayers-showcase__main">
        {/* LEFT INFORMATION */}

        <div className="slayer-info">
          <div className="slayer-rank">
            <span className="slayer-rank__line" />

            <span>{selectedSlayer.rank}</span>
          </div>

          <header className="slayer-heading">
            <h1>{mainName}</h1>

            {secondaryName && <span>{secondaryName}</span>}
          </header>

          <p className="slayer-description">
            {selectedSlayer.description ||
              "A member of the Demon Slayer Corps trained in specialized swordsmanship and Total Concentration Breathing to battle demons."}
          </p>

          {/* STATS */}

          <div className="slayer-stats">
            <div className="slayer-stat">
              <div className="slayer-stat__icon">
                <Sword size={15} />
              </div>

              <div>
                <strong>{selectedSlayer.stats?.power || 0}</strong>

                <span>POWER</span>
              </div>
            </div>

            <div className="slayer-stat">
              <div className="slayer-stat__icon">
                <Zap size={15} />
              </div>

              <div>
                <strong>{selectedSlayer.stats?.speed || 0}</strong>

                <span>SPEED</span>
              </div>
            </div>

            <div className="slayer-stat">
              <div className="slayer-stat__icon">
                <Shield size={15} />
              </div>

              <div>
                <strong>{selectedSlayer.stats?.defense || 0}</strong>

                <span>DEFENSE</span>
              </div>
            </div>
          </div>

          {/* BREATHING STYLE PANEL */}

          <div className="breathing-style-panel">
            <div className="breathing-style-panel__header">
              <div className="breathing-style-panel__symbol">
                <Wind size={21} />
              </div>

              <div className="breathing-style-panel__heading">
                <span>BREATHING STYLE</span>

                <button
                  type="button"
                  disabled={!primaryBreathingStyle}
                  onClick={() => {
                    if (primaryBreathingStyle) {
                      navigate(`/breathing/${primaryBreathingStyle.id}`);
                    }
                  }}
                >
                  {primaryBreathingStyle?.name || "Unknown"}

                  {primaryBreathingStyle && <ArrowUpRight size={14} />}
                </button>
              </div>
            </div>

            <p className="breathing-style-panel__description">
              {primaryBreathingStyle?.description ||
                "No Breathing Style information is available."}
            </p>

            <div className="breathing-style-panel__techniques">
              {breathingTechniques.length > 0 ? (
                breathingTechniques.slice(0, 4).map((technique, index) => (
                  <button
                    key={technique.id}
                    type="button"
                    onClick={() => navigate(`/techniques/${technique.id}`)}
                    className="breathing-technique"
                  >
                    <span className="breathing-technique__number">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span className="breathing-technique__name">
                      {technique.name}
                    </span>

                    <ChevronRight size={14} />
                  </button>
                ))
              ) : (
                <span className="breathing-style-panel__empty">
                  No recorded techniques.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* CHARACTER */}

        <div className="slayer-character">
          <div className="slayer-character__circle" />

          <div className="slayer-character__rings">
            <span />
            <span />
            <span />
          </div>

          <div className="slayer-character__glow" />

          <img
            className="slayer-character__image"
            src={selectedSlayer.image}
            alt={selectedSlayer.name}
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />

          <div className="slayer-character__ground" />
        </div>

        {/* RIGHT ABILITY RAIL */}

        <aside className="slayer-rail">
          <div className="slayer-rail__title">ABILITY</div>

          <div className="slayer-rail__items">
            <button
              type="button"
              className="slayer-rail__button active"
              title="Swordsmanship"
            >
              <Sword size={14} />
            </button>

            <button type="button" className="slayer-rail__button" title="Speed">
              <Zap size={14} />
            </button>

            <button
              type="button"
              className="slayer-rail__button"
              title="Defense"
            >
              <Shield size={14} />
            </button>

            <button
              type="button"
              className="slayer-rail__button"
              title="Endurance"
            >
              <Activity size={14} />
            </button>
          </div>

          <div className="slayer-rail__style">
            <span>STYLE</span>

            <strong>
              {String(selectedBreathingStyles.length).padStart(2, "0")}
            </strong>
          </div>
        </aside>
      </div>

      {/* SIDE NAVIGATION */}

      <button
        type="button"
        className="slayer-nav slayer-nav--left"
        onClick={handlePrevious}
        aria-label="Previous slayer"
      >
        <ChevronLeft size={22} />
      </button>

      <button
        type="button"
        className="slayer-nav slayer-nav--right"
        onClick={handleNext}
        aria-label="Next slayer"
      >
        <ChevronRight size={22} />
      </button>
    </section>
  );
}

export default SlayersPage;
