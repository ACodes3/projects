import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  Check,
  Droplets,
  Skull,
  Sparkles,
  Activity,
  User,
  ArrowUpRight,
} from "lucide-react";

import {
  getBloodDemonArts,
  getDemons,
  getTechniques,
} from "../services/dataService";

import {
  getBloodDemonArtUser,
  getBloodDemonArtTechniques,
} from "../utils/dataHelpers";

import "./BloodDemonArtsPage.css";

function BloodDemonArtsPage() {
  const navigate = useNavigate();

  const [bloodDemonArts, setBloodDemonArts] = useState([]);
  const [demons, setDemons] = useState([]);
  const [techniques, setTechniques] = useState([]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  const filteredArts = useMemo(
    () =>
      bloodDemonArts
        .map((art, index) => ({ art, index }))
        .filter(({ art }) =>
          art.name.toLowerCase().includes(searchTerm.trim().toLowerCase()),
        ),
    [bloodDemonArts, searchTerm],
  );

  useEffect(() => {
    if (!isDropdownOpen) return;

    const handlePointerDown = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
        setSearchTerm("");
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDropdownOpen]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [artData, demonData, techniqueData] = await Promise.all([
          getBloodDemonArts(),
          getDemons(),
          getTechniques(),
        ]);

        setBloodDemonArts(artData);
        setDemons(demonData);
        setTechniques(techniqueData);
      } catch (error) {
        console.error(error);

        setError("Could not load Blood Demon Art data.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const selectedArt = bloodDemonArts[selectedIndex] || null;

  const selectedDemon = useMemo(() => {
    if (!selectedArt) {
      return null;
    }

    return getBloodDemonArtUser(selectedArt, demons);
  }, [selectedArt, demons]);

  const artTechniques = useMemo(() => {
    if (!selectedArt) {
      return [];
    }

    return getBloodDemonArtTechniques(selectedArt, techniques);
  }, [selectedArt, techniques]);

  const handlePrevious = () => {
    setSelectedIndex((current) => {
      if (!bloodDemonArts.length) {
        return 0;
      }

      return (current - 1 + bloodDemonArts.length) % bloodDemonArts.length;
    });
  };

  const handleNext = () => {
    setSelectedIndex((current) => {
      if (!bloodDemonArts.length) {
        return 0;
      }

      return (current + 1) % bloodDemonArts.length;
    });
  };

  if (isLoading) {
    return <div className="status-screen">Loading Blood Demon Arts...</div>;
  }

  if (error) {
    return <div className="status-screen">{error}</div>;
  }

  if (!selectedArt) {
    return <div className="status-screen">No Blood Demon Arts found.</div>;
  }

  const accentPrimary = selectedArt.theme?.primary || "#e11d48";

  const accentSecondary = selectedArt.theme?.secondary || "#7e22ce";

  return (
    <section
      className="blood-arts-showcase"
      style={{
        "--blood-primary": accentPrimary,
        "--blood-secondary": accentSecondary,
      }}
    >
      <div className="blood-arts-showcase__fog" />
      <div className="blood-arts-showcase__particles" />

      {/* TOP SELECTOR */}

      <div className="blood-arts-selector">
        <div className="blood-arts-selector__label">
          <span className="blood-arts-selector__mark">
            <Droplets size={15} />
          </span>

          <span>BLOOD DEMON ARTS</span>
        </div>

        <div className="blood-arts-dropdown" ref={dropdownRef}>
          <button
            type="button"
            className="blood-arts-dropdown__trigger"
            onClick={() => setIsDropdownOpen((open) => !open)}
            aria-expanded={isDropdownOpen}
            aria-haspopup="listbox"
          >
            <span>{selectedArt.name}</span>
            <ChevronDown size={18} aria-hidden="true" />
          </button>

          {isDropdownOpen && (
            <div className="blood-arts-dropdown__menu">
              <div className="blood-arts-dropdown__search">
                <Search size={17} aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Search a Blood Demon Art..."
                  aria-label="Search Blood Demon Arts"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  autoFocus
                />
              </div>

              <div
                className="blood-arts-dropdown__options"
                role="listbox"
                aria-label="Blood Demon Arts"
              >
                {filteredArts.map(({ art, index }) => (
                  <button
                    key={art.id}
                    type="button"
                    role="option"
                    aria-selected={index === selectedIndex}
                    className={
                      index === selectedIndex
                        ? "blood-arts-dropdown__option active"
                        : "blood-arts-dropdown__option"
                    }
                    onClick={() => {
                      setSelectedIndex(index);
                      setIsDropdownOpen(false);
                      setSearchTerm("");
                    }}
                  >
                    <span>{art.name}</span>
                    {index === selectedIndex && (
                      <Check size={15} aria-hidden="true" />
                    )}
                  </button>
                ))}

                {filteredArts.length === 0 && (
                  <p className="blood-arts-dropdown__empty">
                    No Blood Demon Arts found.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MAIN */}

      <div className="blood-arts-showcase__main">
        {/* LEFT INFO */}

        <div className="blood-art-info">
          <div className="blood-art-eyebrow">
            <span className="blood-art-eyebrow__line" />

            <span>SUPERNATURAL DEMON TECHNIQUE</span>
          </div>

          <header className="blood-art-heading">
            <h1>{selectedArt.name}</h1>

            <span>BLOOD DEMON ART</span>
          </header>

          <p className="blood-art-description">
            {selectedArt.description ||
              "A supernatural ability manifested through demonic blood, granting its user unique and dangerous powers."}
          </p>

          {/* STATS */}

          <div className="blood-art-stats">
            <div className="blood-art-stat">
              <div className="blood-art-stat__icon">
                <Sparkles size={15} />
              </div>

              <div>
                <strong>{artTechniques.length}</strong>

                <span>ABILITIES</span>
              </div>
            </div>

            <div className="blood-art-stat">
              <div className="blood-art-stat__icon">
                <User size={15} />
              </div>

              <div>
                <strong>{selectedDemon ? 1 : 0}</strong>

                <span>USER</span>
              </div>
            </div>

            <div className="blood-art-stat">
              <div className="blood-art-stat__icon">
                <Activity size={15} />
              </div>

              <div>
                <strong>{selectedDemon?.stats?.power || 0}</strong>

                <span>POWER</span>
              </div>
            </div>
          </div>

          {/* USER PANEL */}

          <div className="blood-art-user-panel">
            <div className="blood-art-user-panel__header">
              <div className="blood-art-user-panel__symbol">
                <Skull size={20} />
              </div>

              <div>
                <span>DEMON USER</span>

                <strong>CONNECTED CHARACTER</strong>
              </div>
            </div>

            {selectedDemon ? (
              <button
                type="button"
                className="blood-art-user"
                onClick={() => navigate(`/demons/${selectedDemon.id}`)}
              >
                <div className="blood-art-user__avatar">
                  <img
                    src={selectedDemon.image}
                    alt={selectedDemon.name}
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />

                  <Skull size={16} />
                </div>

                <div className="blood-art-user__text">
                  <strong>{selectedDemon.name}</strong>

                  <span>{selectedDemon.rank}</span>
                </div>

                <ArrowUpRight size={15} />
              </button>
            ) : (
              <div className="blood-art-user-panel__empty">
                No demon user recorded.
              </div>
            )}
          </div>
        </div>

        {/* CENTER VISUAL */}

        <div className="blood-art-visual">
          <div className="blood-art-visual__outer-ring" />

          <div className="blood-art-visual__veins">
            <span />
            <span />
            <span />
            <span />
          </div>

          <div className="blood-art-visual__middle-ring" />

          <div className="blood-art-visual__core">
            <div className="blood-art-visual__core-glow" />

            {selectedArt.image && (
              <img
                className="blood-art-visual__image"
                src={selectedArt.image}
                alt={selectedArt.name}
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            )}

            <Droplets
              className="blood-art-visual__fallback"
              size={88}
              strokeWidth={1}
            />
          </div>

          <div className="blood-art-visual__orbit blood-art-visual__orbit--one" />
          <div className="blood-art-visual__orbit blood-art-visual__orbit--two" />

          <div className="blood-art-visual__label">
            <span>BLOOD ART</span>

            <strong>{selectedArt.name}</strong>
          </div>
        </div>

        {/* RIGHT DETAILS */}

        <aside className="blood-art-details">
          <div className="blood-art-details__title">ABILITIES</div>

          <div className="blood-art-details__abilities">
            {artTechniques.length > 0 ? (
              artTechniques.slice(0, 7).map((technique, index) => (
                <button
                  key={technique.id}
                  type="button"
                  className="blood-art-ability"
                  onClick={() => navigate(`/techniques/${technique.id}`)}
                >
                  <span className="blood-art-ability__number">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <div className="blood-art-ability__content">
                    <strong>{technique.name}</strong>

                    <span>DEMON TECHNIQUE</span>
                  </div>

                  <ChevronRight size={14} />
                </button>
              ))
            ) : (
              <div className="blood-art-details__empty">
                No abilities recorded.
              </div>
            )}
          </div>

          {/* USER SUMMARY */}

          <div className="blood-art-details__connection">
            <span className="blood-art-details__small-title">
              CONNECTED DEMON
            </span>

            {selectedDemon ? (
              <button
                type="button"
                className="blood-demon-connection"
                onClick={() => navigate(`/demons/${selectedDemon.id}`)}
              >
                <Skull size={14} />

                <span>{selectedDemon.name}</span>

                <ChevronRight size={13} />
              </button>
            ) : (
              <div className="blood-demon-connection blood-demon-connection--empty">
                No demon connection
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* SIDE NAV */}

      <button
        type="button"
        className="blood-art-nav blood-art-nav--left"
        onClick={handlePrevious}
        aria-label="Previous Blood Demon Art"
      >
        <ChevronLeft size={22} />
      </button>

      <button
        type="button"
        className="blood-art-nav blood-art-nav--right"
        onClick={handleNext}
        aria-label="Next Blood Demon Art"
      >
        <ChevronRight size={22} />
      </button>
    </section>
  );
}

export default BloodDemonArtsPage;
