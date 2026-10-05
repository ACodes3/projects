import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Droplets,
  Skull,
  Zap,
  Activity,
  Eye,
  ArrowUpRight
} from "lucide-react";

import {
  getDemons,
  getBloodDemonArts,
  getTechniques
} from "../services/dataService";

import {
  getDemonBloodArts,
  getBloodDemonArtTechniques
} from "../utils/dataHelpers";

import "./DemonsPage.css";

function DemonsPage() {
  const navigate = useNavigate();

  const [demons, setDemons] = useState([]);
  const [bloodArts, setBloodArts] = useState([]);
  const [techniques, setTechniques] = useState([]);

  const [selectedIndex, setSelectedIndex] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          demonData,
          bloodArtData,
          techniqueData
        ] = await Promise.all([
          getDemons(),
          getBloodDemonArts(),
          getTechniques()
        ]);

        setDemons(demonData);
        setBloodArts(bloodArtData);
        setTechniques(techniqueData);
      } catch (error) {
        console.error(error);

        setError(
          "Could not load demon data."
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const selectedDemon =
    demons[selectedIndex] || null;

  const selectedBloodArts = useMemo(() => {
    if (!selectedDemon) {
      return [];
    }

    return getDemonBloodArts(
      selectedDemon,
      bloodArts
    );
  }, [
    selectedDemon,
    bloodArts
  ]);

  const primaryBloodArt =
    selectedBloodArts[0] || null;

  const bloodArtTechniques = useMemo(() => {
    if (!primaryBloodArt) {
      return [];
    }

    return getBloodDemonArtTechniques(
      primaryBloodArt,
      techniques
    );
  }, [
    primaryBloodArt,
    techniques
  ]);

  const handlePrevious = () => {
    setSelectedIndex((current) => {
      if (!demons.length) {
        return 0;
      }

      return (
        current - 1 + demons.length
      ) % demons.length;
    });
  };

  const handleNext = () => {
    setSelectedIndex((current) => {
      if (!demons.length) {
        return 0;
      }

      return (
        current + 1
      ) % demons.length;
    });
  };

  if (isLoading) {
    return (
      <div className="status-screen">
        Loading demons...
      </div>
    );
  }

  if (error) {
    return (
      <div className="status-screen">
        {error}
      </div>
    );
  }

  if (!selectedDemon) {
    return (
      <div className="status-screen">
        No demons found.
      </div>
    );
  }

  const nameParts =
    selectedDemon.name.split(" ");

  const mainName =
    nameParts[0];

  const secondaryName =
    nameParts.slice(1).join(" ");

  const accentPrimary =
    primaryBloodArt?.theme?.primary ||
    "#b62042";

  const accentSecondary =
    primaryBloodArt?.theme?.secondary ||
    "#5b174f";

  return (
    <section
      className="demons-showcase"
      style={{
        "--demon-primary": accentPrimary,
        "--demon-secondary": accentSecondary
      }}
    >
      <div className="demons-showcase__fog" />
      <div className="demons-showcase__grain" />

      {/* TOP DEMON SELECTOR */}

      <div className="demons-selector">

        <div className="demons-selector__label">
          <span className="demons-selector__mark">
            <Skull size={15} />
          </span>

          <span>
            DEMONS
          </span>
        </div>

        <div className="demons-selector__characters">

          {demons.map((demon, index) => (
            <button
              key={demon.id}
              type="button"
              onClick={() =>
                setSelectedIndex(index)
              }
              className={
                index === selectedIndex
                  ? "demon-selector active"
                  : "demon-selector"
              }
            >
              {demon.name}
            </button>
          ))}

        </div>

      </div>

      {/* MAIN CONTENT */}

      <div className="demons-showcase__main">

        {/* LEFT */}

        <div className="demon-info">

          <div className="demon-rank">
            <span className="demon-rank__line" />

            <span>
              {selectedDemon.rank}
            </span>
          </div>

          <header className="demon-heading">

            <h1>
              {mainName}
            </h1>

            {secondaryName && (
              <span>
                {secondaryName}
              </span>
            )}

          </header>

          <p className="demon-description">
            {selectedDemon.description ||
              "A powerful demon possessing extraordinary physical abilities, regeneration and a unique supernatural Blood Demon Art."}
          </p>

          {/* STATS */}

          <div className="demon-stats">

            <div className="demon-stat">

              <div className="demon-stat__icon">
                <Skull size={15} />
              </div>

              <div>
                <strong>
                  {selectedDemon.stats?.power || 0}
                </strong>

                <span>
                  POWER
                </span>
              </div>

            </div>

            <div className="demon-stat">

              <div className="demon-stat__icon">
                <Zap size={15} />
              </div>

              <div>
                <strong>
                  {selectedDemon.stats?.speed || 0}
                </strong>

                <span>
                  SPEED
                </span>
              </div>

            </div>

            <div className="demon-stat">

              <div className="demon-stat__icon">
                <Activity size={15} />
              </div>

              <div>
                <strong>
                  {selectedDemon.stats?.regeneration || 0}
                </strong>

                <span>
                  REGEN
                </span>
              </div>

            </div>

          </div>

          {/* BLOOD ART */}

          <div className="blood-art-panel">

            <div className="blood-art-panel__header">

              <div className="blood-art-panel__symbol">
                <Droplets size={21} />
              </div>

              <div className="blood-art-panel__heading">

                <span>
                  BLOOD DEMON ART
                </span>

                <button
                  type="button"
                  disabled={!primaryBloodArt}
                  onClick={() => {
                    if (primaryBloodArt) {
                      navigate(
                        `/blood-arts/${primaryBloodArt.id}`
                      );
                    }
                  }}
                >
                  {primaryBloodArt?.name ||
                    "Unknown"}

                  {primaryBloodArt && (
                    <ArrowUpRight size={14} />
                  )}
                </button>

              </div>

            </div>

            <p className="blood-art-panel__description">
              {primaryBloodArt?.description ||
                "No Blood Demon Art information available."}
            </p>

            <div className="blood-art-panel__abilities">

              {bloodArtTechniques.length > 0 ? (
                bloodArtTechniques
                  .slice(0, 4)
                  .map((technique, index) => (
                    <button
                      key={technique.id}
                      type="button"
                      onClick={() =>
                        navigate(
                          `/techniques/${technique.id}`
                        )
                      }
                      className="blood-ability"
                    >
                      <span className="blood-ability__number">
                        {String(index + 1).padStart(
                          2,
                          "0"
                        )}
                      </span>

                      <span className="blood-ability__name">
                        {technique.name}
                      </span>

                      <ChevronRight size={14} />
                    </button>
                  ))
              ) : (
                <span className="blood-art-panel__empty">
                  No recorded abilities.
                </span>
              )}

            </div>

          </div>

        </div>

        {/* CHARACTER */}

        <div className="demon-character">

          <div className="demon-character__moon" />

          <div className="demon-character__sigil">
            <span />
            <span />
            <span />
          </div>

          <div className="demon-character__glow" />

          <img
            className="demon-character__image"
            src={selectedDemon.image}
            alt={selectedDemon.name}
            onError={(event) => {
              event.currentTarget.style.display =
                "none";
            }}
          />

          <div className="demon-character__ground" />

        </div>

        {/* RIGHT RAIL */}

        <aside className="demon-rail">

          <div className="demon-rail__title">
            ABILITY
          </div>

          <div className="demon-rail__items">

            <button
              type="button"
              className="demon-rail__button active"
              title="Blood Demon Art"
            >
              <Droplets size={14} />
            </button>

            <button
              type="button"
              className="demon-rail__button"
              title="Perception"
            >
              <Eye size={14} />
            </button>

            <button
              type="button"
              className="demon-rail__button"
              title="Regeneration"
            >
              <Activity size={14} />
            </button>

            <button
              type="button"
              className="demon-rail__button"
              title="Speed"
            >
              <Zap size={14} />
            </button>

          </div>

          <div className="demon-rail__rank">

            <span>
              RANK
            </span>

            <strong>
              {selectedIndex + 1}
            </strong>

          </div>

        </aside>

      </div>

      {/* SIDE NAV */}

      <button
        type="button"
        className="demon-nav demon-nav--left"
        onClick={handlePrevious}
        aria-label="Previous demon"
      >
        <ChevronLeft size={22} />
      </button>

      <button
        type="button"
        className="demon-nav demon-nav--right"
        onClick={handleNext}
        aria-label="Next demon"
      >
        <ChevronRight size={22} />
      </button>

    </section>
  );
}

export default DemonsPage;