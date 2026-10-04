import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Sword,
  Shield,
  Zap
} from "lucide-react";

import {
  getSlayers,
  getBreathingStyles,
  getTechniques
} from "../services/dataService";

import {
  getSlayerBreathingStyles,
  getSlayerTechniques
} from "../utils/dataHelpers";

import "./SlayersPage.css";

function SlayersPage() {
  const [slayers, setSlayers] = useState([]);
  const [breathingStyles, setBreathingStyles] = useState([]);
  const [techniques, setTechniques] = useState([]);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [
          slayerData,
          breathingData,
          techniqueData
        ] = await Promise.all([
          getSlayers(),
          getBreathingStyles(),
          getTechniques()
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

    return getSlayerBreathingStyles(
      selectedSlayer,
      breathingStyles
    );
  }, [
    selectedSlayer,
    breathingStyles
  ]);

  const selectedTechniques = useMemo(() => {
    if (!selectedSlayer) {
      return [];
    }

    return getSlayerTechniques(
      selectedSlayer,
      techniques
    );
  }, [
    selectedSlayer,
    techniques
  ]);

  const primaryBreathingStyle =
    selectedBreathingStyles[0] || null;

  const handlePrevious = () => {
    setSelectedIndex((current) => {
      if (slayers.length === 0) {
        return 0;
      }

      return (
        current - 1 + slayers.length
      ) % slayers.length;
    });
  };

  const handleNext = () => {
    setSelectedIndex((current) => {
      if (slayers.length === 0) {
        return 0;
      }

      return (
        current + 1
      ) % slayers.length;
    });
  };

  if (isLoading) {
    return (
      <div className="status-screen">
        Loading Demon Slayers...
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

  if (!selectedSlayer) {
    return (
      <div className="status-screen">
        No Demon Slayers found.
      </div>
    );
  }

  const firstName =
    selectedSlayer.name.split(" ")[0];

  const lastName =
    selectedSlayer.name
      .split(" ")
      .slice(1)
      .join(" ");

  return (
    <section
      className="slayers-showcase"
      style={{
        "--accent-primary":
          primaryBreathingStyle?.theme?.primary ||
          "#ff7b42",
        "--accent-secondary":
          primaryBreathingStyle?.theme?.secondary ||
          "#b91c1c"
      }}
    >
      <div className="slayers-showcase__ambient" />

      <div className="slayers-showcase__selector">
        <button
          className="slayers-showcase__back"
          type="button"
          onClick={handlePrevious}
          aria-label="Previous slayer"
        >
          <ChevronLeft size={19} />
        </button>

        <div className="slayers-showcase__category">
          <span className="slayers-showcase__ring" />
          <span>DEMON SLAYERS</span>
        </div>

        <div className="slayers-showcase__names">
          {slayers.map((slayer, index) => (
            <button
              key={slayer.id}
              className={
                index === selectedIndex
                  ? "slayer-selector active"
                  : "slayer-selector"
              }
              type="button"
              onClick={() => setSelectedIndex(index)}
            >
              {slayer.name.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="slayers-showcase__main">
        <div className="slayers-showcase__info">
          <div className="slayer-heading">
            <h1>{firstName}</h1>

            {lastName && (
              <span>{lastName}</span>
            )}
          </div>

          <p className="slayer-description">
            {selectedSlayer.description ||
              "A member of the Demon Slayer Corps, trained to battle demons using specialized swordsmanship and breathing techniques."}
          </p>

          <div className="slayer-stats">
            <div className="slayer-stat">
              <strong>
                {selectedSlayer.stats?.power || 0}
              </strong>
              <span>PWR</span>
            </div>

            <div className="slayer-stat">
              <strong>
                {selectedSlayer.stats?.speed || 0}
              </strong>
              <span>SPD</span>
            </div>

            <div className="slayer-stat">
              <strong>
                {selectedSlayer.stats?.defense || 0}
              </strong>
              <span>DEF</span>
            </div>
          </div>

          <div className="slayer-lower">
            <div className="slayer-feature-card">
              <div className="slayer-feature-card__visual">
                {primaryBreathingStyle?.image ? (
                  <img
                    src={primaryBreathingStyle.image}
                    alt={primaryBreathingStyle.name}
                  />
                ) : (
                  <div className="slayer-feature-card__placeholder">
                    <Flame size={38} />
                  </div>
                )}
              </div>

              <div className="slayer-feature-card__content">
                <span className="slayer-feature-card__label">
                  PRIMARY STYLE
                </span>

                <strong>
                  {primaryBreathingStyle?.name ||
                    "Unknown Style"}
                </strong>

                <span>
                  {selectedTechniques.length} techniques
                </span>
              </div>
            </div>

            <div className="slayer-technique-summary">
              <span className="slayer-technique-summary__orb" />

              <div>
                <span className="slayer-technique-summary__label">
                  TECHNIQUE
                </span>

                <strong>
                  {primaryBreathingStyle?.name ||
                    "Breathing Style"}
                </strong>
              </div>

              <div className="slayer-technique-summary__count">
                <Sword size={15} />
                <span>
                  {selectedTechniques.length} SKILLS
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="slayers-showcase__character">
          <div className="slayers-showcase__sun-ring" />
          <div className="slayers-showcase__glow" />

          <img
            className="slayers-showcase__character-image"
            src={selectedSlayer.image}
            alt={selectedSlayer.name}
          />
        </div>

        <div className="slayers-showcase__abilities">
          <span className="slayers-showcase__abilities-title">
            ABILITY
          </span>

          <div className="ability-orbs">
            <button
              className="ability-orb"
              type="button"
              title="Power"
            >
              <Flame size={15} />
            </button>

            <button
              className="ability-orb"
              type="button"
              title="Speed"
            >
              <Zap size={15} />
            </button>

            <button
              className="ability-orb active"
              type="button"
              title="Defense"
            >
              <Shield size={15} />
            </button>

            <button
              className="ability-orb"
              type="button"
              title="Swordsmanship"
            >
              <Sword size={15} />
            </button>
          </div>
        </div>
      </div>

      <button
        className="slayers-showcase__nav slayers-showcase__nav--left"
        type="button"
        onClick={handlePrevious}
        aria-label="Previous slayer"
      >
        <ChevronLeft size={23} />
      </button>

      <button
        className="slayers-showcase__nav slayers-showcase__nav--right"
        type="button"
        onClick={handleNext}
        aria-label="Next slayer"
      >
        <ChevronRight size={23} />
      </button>
    </section>
  );
}

export default SlayersPage;