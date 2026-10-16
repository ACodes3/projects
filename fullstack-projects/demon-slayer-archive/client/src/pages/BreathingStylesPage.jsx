import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  Wind,
  Sword,
  Users,
  Sparkles,
  GitBranch,
  ArrowUpRight,
} from "lucide-react";

import {
  getBreathingStyles,
  getSlayers,
  getTechniques,
} from "../services/dataService";

import {
  findById,
  getBreathingStyleUsers,
  getBreathingStyleTechniques,
} from "../utils/dataHelpers";

import "./BreathingStylesPage.css";

function BreathingStylesPage() {
  const navigate = useNavigate();

  const [breathingStyles, setBreathingStyles] = useState([]);
  const [slayers, setSlayers] = useState([]);
  const [techniques, setTechniques] = useState([]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  const filteredStyles = useMemo(
    () =>
      breathingStyles
        .map((style, index) => ({ style, index }))
        .filter(({ style }) =>
          style.name.toLowerCase().includes(searchTerm.trim().toLowerCase()),
        ),
    [breathingStyles, searchTerm],
  );

  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
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

    document.addEventListener("pointerdown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isDropdownOpen]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [breathingData, slayerData, techniqueData] = await Promise.all([
          getBreathingStyles(),
          getSlayers(),
          getTechniques(),
        ]);

        setBreathingStyles(breathingData);
        setSlayers(slayerData);
        setTechniques(techniqueData);
      } catch (error) {
        console.error(error);

        setError("Could not load Breathing Style data.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const selectedStyle = breathingStyles[selectedIndex] || null;

  const styleUsers = useMemo(() => {
    if (!selectedStyle) {
      return [];
    }

    return getBreathingStyleUsers(selectedStyle, slayers);
  }, [selectedStyle, slayers]);

  const styleTechniques = useMemo(() => {
    if (!selectedStyle) {
      return [];
    }

    return getBreathingStyleTechniques(selectedStyle, techniques);
  }, [selectedStyle, techniques]);

  const parentStyle = useMemo(() => {
    if (!selectedStyle || !selectedStyle.derivedFromId) {
      return null;
    }

    return findById(breathingStyles, selectedStyle.derivedFromId);
  }, [selectedStyle, breathingStyles]);

  const derivedStyles = useMemo(() => {
    if (!selectedStyle) {
      return [];
    }

    return breathingStyles.filter(
      (style) => style.derivedFromId === selectedStyle.id,
    );
  }, [selectedStyle, breathingStyles]);

  const handlePrevious = () => {
    setSelectedIndex((current) => {
      if (!breathingStyles.length) {
        return 0;
      }

      return (current - 1 + breathingStyles.length) % breathingStyles.length;
    });
  };

  const handleNext = () => {
    setSelectedIndex((current) => {
      if (!breathingStyles.length) {
        return 0;
      }

      return (current + 1) % breathingStyles.length;
    });
  };

  if (isLoading) {
    return <div className="status-screen">Loading Breathing Styles...</div>;
  }

  if (error) {
    return <div className="status-screen">{error}</div>;
  }

  if (!selectedStyle) {
    return <div className="status-screen">No Breathing Styles found.</div>;
  }

  const styleNameParts = selectedStyle.name.split(" ");

  const mainName = styleNameParts.slice(0, -1).join(" ");

  const typeName = styleNameParts[styleNameParts.length - 1];

  const accentPrimary = selectedStyle.theme?.primary || "#38bdf8";

  const accentSecondary = selectedStyle.theme?.secondary || "#1d4ed8";

  return (
    <section
      className="breathing-showcase"
      style={{
        "--breathing-primary": accentPrimary,

        "--breathing-secondary": accentSecondary,
      }}
    >
      <div className="breathing-showcase__mist" />
      <div className="breathing-showcase__particles" />

      {/* TOP SELECTOR */}

      <div className="breathing-selector">
        <div className="breathing-selector__label">
          <span className="breathing-selector__mark">
            <Wind size={15} />
          </span>

          <span>BREATHING STYLES</span>
        </div>

        <div className="breathing-dropdown" ref={dropdownRef}>
          <button
            type="button"
            className="breathing-dropdown__trigger"
            onClick={() => setIsDropdownOpen((open) => !open)}
            aria-expanded={isDropdownOpen}
            aria-haspopup="listbox"
          >
            <span>{selectedStyle.name}</span>
            <ChevronDown size={18} aria-hidden="true" />
          </button>

          {isDropdownOpen && (
            <div className="breathing-dropdown__menu">
              <div className="breathing-dropdown__search">
                <Search size={17} aria-hidden="true" />
                <input
                  type="search"
                  aria-label="Search breathing styles"
                  placeholder="Search a Breathing Style..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  autoFocus
                />
              </div>

              <div
                className="breathing-dropdown__options"
                role="listbox"
                aria-label="Breathing styles"
              >
                {filteredStyles.map(({ style, index }) => (
                  <button
                    key={style.id}
                    type="button"
                    role="option"
                    aria-selected={index === selectedIndex}
                    className={
                      index === selectedIndex
                        ? "breathing-dropdown__option active"
                        : "breathing-dropdown__option"
                    }
                    onClick={() => {
                      setSelectedIndex(index);
                      setIsDropdownOpen(false);
                      setSearchTerm("");
                    }}
                  >
                    {style.name}
                  </button>
                ))}
                {filteredStyles.length === 0 && (
                  <p className="breathing-dropdown__empty">
                    No Breathing Styles found.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MAIN */}

      <div className="breathing-showcase__main">
        {/* LEFT INFO */}

        <div className="breathing-info">
          <div className="breathing-lineage">
            <span className="breathing-lineage__line" />

            <span>BREATHING TECHNIQUE</span>
          </div>

          <header className="breathing-heading">
            <h1>{mainName || selectedStyle.name}</h1>

            {mainName && <span>{typeName}</span>}
          </header>

          <p className="breathing-description">
            {selectedStyle.description ||
              "A swordsmanship style based on Total Concentration Breathing, allowing its users to perform specialized combat forms."}
          </p>

          {/* STATS / COUNTS */}

          <div className="breathing-stats">
            <div className="breathing-stat">
              <div className="breathing-stat__icon">
                <Sword size={15} />
              </div>

              <div>
                <strong>{styleTechniques.length}</strong>

                <span>TECHNIQUES</span>
              </div>
            </div>

            <div className="breathing-stat">
              <div className="breathing-stat__icon">
                <Users size={15} />
              </div>

              <div>
                <strong>{styleUsers.length}</strong>

                <span>USERS</span>
              </div>
            </div>

            <div className="breathing-stat">
              <div className="breathing-stat__icon">
                <GitBranch size={15} />
              </div>

              <div>
                <strong>{derivedStyles.length}</strong>

                <span>DERIVATIVES</span>
              </div>
            </div>
          </div>

          {/* USERS PANEL */}

          <div className="breathing-users-panel">
            <div className="breathing-users-panel__header">
              <div className="breathing-users-panel__symbol">
                <Users size={20} />
              </div>

              <div>
                <span>KNOWN USERS</span>

                <strong>DEMON SLAYERS</strong>
              </div>
            </div>

            <div className="breathing-users-panel__list">
              {styleUsers.length > 0 ? (
                styleUsers.map((slayer) => (
                  <button
                    key={slayer.id}
                    type="button"
                    className="breathing-user"
                    onClick={() => navigate(`/slayers/${slayer.id}`)}
                  >
                    <div className="breathing-user__avatar">
                      <img
                        src={slayer.image}
                        alt={slayer.name}
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />

                      <Sword size={14} />
                    </div>

                    <div className="breathing-user__text">
                      <strong>{slayer.name}</strong>

                      <span>{slayer.rank}</span>
                    </div>

                    <ArrowUpRight size={14} />
                  </button>
                ))
              ) : (
                <span className="breathing-users-panel__empty">
                  No recorded users.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* CENTER STYLE VISUAL */}

        <div className="breathing-visual">
          <div className="breathing-visual__outer-ring" />

          <div className="breathing-visual__middle-ring" />

          <div className="breathing-visual__core">
            <div className="breathing-visual__core-glow" />

            {selectedStyle.image ? (
              <img
                className="breathing-visual__image"
                src={selectedStyle.image}
                alt={selectedStyle.name}
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : null}

            <Wind
              className="breathing-visual__fallback"
              size={86}
              strokeWidth={1}
            />
          </div>

          <div className="breathing-visual__orbit breathing-visual__orbit--one" />

          <div className="breathing-visual__orbit breathing-visual__orbit--two" />

          <div className="breathing-visual__label">
            <span>STYLE</span>

            <strong>{selectedStyle.name}</strong>
          </div>
        </div>

        {/* RIGHT PANEL */}

        <aside className="breathing-details">
          <div className="breathing-details__title">TECHNIQUES</div>

          <div className="breathing-details__techniques">
            {styleTechniques.slice(0, 6).map((technique, index) => (
              <button
                key={technique.id}
                type="button"
                className="style-technique"
                onClick={() => navigate(`/techniques/${technique.id}`)}
              >
                <span className="style-technique__number">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div className="style-technique__content">
                  <strong>{technique.name}</strong>

                  <span>FORM</span>
                </div>

                <ChevronRight size={14} />
              </button>
            ))}
          </div>

          {/* LINEAGE */}

          <div className="breathing-details__lineage">
            <span className="breathing-details__small-title">ORIGIN</span>

            {parentStyle ? (
              <button
                type="button"
                className="breathing-origin"
                onClick={() => {
                  const parentIndex = breathingStyles.findIndex(
                    (style) => style.id === parentStyle.id,
                  );

                  if (parentIndex !== -1) {
                    setSelectedIndex(parentIndex);
                  }
                }}
              >
                <GitBranch size={14} />

                <span>{parentStyle.name}</span>

                <ChevronRight size={13} />
              </button>
            ) : (
              <div className="breathing-origin breathing-origin--root">
                <Sparkles size={14} />

                <span>ORIGINAL STYLE</span>
              </div>
            )}
          </div>

          {derivedStyles.length > 0 && (
            <div className="breathing-details__derived">
              <span className="breathing-details__small-title">
                DERIVED STYLES
              </span>

              <div className="breathing-derived-list">
                {derivedStyles.map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => {
                      const styleIndex = breathingStyles.findIndex(
                        (item) => item.id === style.id,
                      );

                      if (styleIndex !== -1) {
                        setSelectedIndex(styleIndex);
                      }
                    }}
                  >
                    {style.name}

                    <ChevronRight size={12} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* SIDE NAV */}

      <button
        type="button"
        className="breathing-nav breathing-nav--left"
        onClick={handlePrevious}
        aria-label="Previous breathing style"
      >
        <ChevronLeft size={22} />
      </button>

      <button
        type="button"
        className="breathing-nav breathing-nav--right"
        onClick={handleNext}
        aria-label="Next breathing style"
      >
        <ChevronRight size={22} />
      </button>
    </section>
  );
}

export default BreathingStylesPage;
