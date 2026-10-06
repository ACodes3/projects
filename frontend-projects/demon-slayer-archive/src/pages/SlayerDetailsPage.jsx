import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  Shield,
  Sword,
  Wind,
  Zap,
  Users
} from "lucide-react";

import { getAllData } from "../services/dataService";

import {
  findById,
  findManyByIds
} from "../utils/dataHelpers";

import "./ArchiveDetails.css";

function SlayerDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState({
    slayers: [],
    demons: [],
    breathingStyles: [],
    bloodDemonArts: [],
    techniques: []
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const archiveData = await getAllData();
        setData(archiveData);
      } catch (error) {
        console.error(error);
        setError("Could not load Slayer details.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const slayer = useMemo(() => {
    return findById(data.slayers, id);
  }, [data.slayers, id]);

  const breathingStyles = useMemo(() => {
    if (!slayer) return [];

    return findManyByIds(
      data.breathingStyles,
      slayer.breathingStyleIds || []
    );
  }, [slayer, data.breathingStyles]);

  const techniques = useMemo(() => {
    if (!slayer) return [];

    return findManyByIds(
      data.techniques,
      slayer.techniqueIds || []
    );
  }, [slayer, data.techniques]);

  const relatedCharacters = useMemo(() => {
    if (!slayer) return [];

    const allCharacters = [
      ...data.slayers,
      ...data.demons
    ];

    return findManyByIds(
      allCharacters,
      slayer.relatedCharacterIds || []
    );
  }, [slayer, data.slayers, data.demons]);

  if (isLoading) {
    return (
      <div className="status-screen">
        Loading Slayer profile...
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

  if (!slayer) {
    return (
      <div className="status-screen">
        Slayer not found.
      </div>
    );
  }

  const primaryStyle =
    breathingStyles[0] || null;

  const accent =
    primaryStyle?.theme?.primary ||
    "#5b9dff";

  const secondary =
    primaryStyle?.theme?.secondary ||
    "#284fa8";

  const goToCharacter = (character) => {
    if (character.type === "demon") {
      navigate(`/demons/${character.id}`);
      return;
    }

    navigate(`/slayers/${character.id}`);
  };

  return (
    <section
      className="archive-detail"
      style={{
        "--detail-primary": accent,
        "--detail-secondary": secondary
      }}
    >
      <div className="archive-detail__ambient" />

      <div className="archive-detail__container">

        <button
          type="button"
          className="archive-detail__back"
          onClick={() => navigate("/slayers")}
        >
          <ArrowLeft size={15} />
          <span>BACK TO SLAYERS</span>
        </button>

        <div className="archive-detail__hero">

          <div className="archive-detail__content">

            <div className="archive-detail__eyebrow">
              <span />
              DEMON SLAYER PROFILE
            </div>

            <h1>
              {slayer.name}
            </h1>

            <p className="archive-detail__rank">
              {slayer.rank}
            </p>

            <p className="archive-detail__description">
              {slayer.description ||
                "A member of the Demon Slayer Corps trained to battle demons through swordsmanship and Breathing Styles."}
            </p>

            <div className="archive-detail__stats">

              <div className="archive-detail-stat">
                <Sword size={15} />

                <div>
                  <strong>
                    {slayer.stats?.power || 0}
                  </strong>

                  <span>POWER</span>
                </div>
              </div>

              <div className="archive-detail-stat">
                <Zap size={15} />

                <div>
                  <strong>
                    {slayer.stats?.speed || 0}
                  </strong>

                  <span>SPEED</span>
                </div>
              </div>

              <div className="archive-detail-stat">
                <Shield size={15} />

                <div>
                  <strong>
                    {slayer.stats?.defense || 0}
                  </strong>

                  <span>DEFENSE</span>
                </div>
              </div>

            </div>

          </div>

          <div className="archive-detail__visual">

            <div className="archive-detail__ring archive-detail__ring--outer" />
            <div className="archive-detail__ring archive-detail__ring--inner" />

            <img
              src={slayer.image}
              alt={slayer.name}
              onError={(event) => {
                event.currentTarget.style.display =
                  "none";
              }}
            />

          </div>

        </div>

        <div className="archive-detail__grid">

          <section className="archive-detail-panel">

            <div className="archive-detail-panel__heading">
              <Wind size={17} />

              <div>
                <span>COMBAT SYSTEM</span>
                <h2>Breathing Styles</h2>
              </div>
            </div>

            <div className="archive-record-list">

              {breathingStyles.length > 0 ? (
                breathingStyles.map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    className="archive-record"
                    onClick={() =>
                      navigate(
                        `/breathing/${style.id}`
                      )
                    }
                  >
                    <div>
                      <span>BREATHING STYLE</span>
                      <strong>{style.name}</strong>
                    </div>

                    <ArrowUpRight size={14} />
                  </button>
                ))
              ) : (
                <p className="archive-detail__empty">
                  No Breathing Styles recorded.
                </p>
              )}

            </div>

          </section>

          <section className="archive-detail-panel">

            <div className="archive-detail-panel__heading">
              <Sword size={17} />

              <div>
                <span>KNOWN FORMS</span>
                <h2>Techniques</h2>
              </div>
            </div>

            <div className="archive-record-list">

              {techniques.length > 0 ? (
                techniques.map((technique, index) => (
                  <button
                    key={technique.id}
                    type="button"
                    className="archive-record archive-record--numbered"
                    onClick={() =>
                      navigate(
                        `/techniques/${technique.id}`
                      )
                    }
                  >
                    <span className="archive-record__number">
                      {String(index + 1).padStart(
                        2,
                        "0"
                      )}
                    </span>

                    <div>
                      <span>TECHNIQUE</span>
                      <strong>
                        {technique.name}
                      </strong>
                    </div>

                    <ArrowUpRight size={14} />
                  </button>
                ))
              ) : (
                <p className="archive-detail__empty">
                  No techniques recorded.
                </p>
              )}

            </div>

          </section>

        </div>

        <section className="archive-detail-panel archive-detail-panel--wide">

          <div className="archive-detail-panel__heading">
            <Users size={17} />

            <div>
              <span>RELATIONSHIPS</span>
              <h2>Related Characters</h2>
            </div>
          </div>

          <div className="archive-character-grid">

            {relatedCharacters.length > 0 ? (
              relatedCharacters.map((character) => (
                <button
                  key={character.id}
                  type="button"
                  className="archive-character-card"
                  onClick={() =>
                    goToCharacter(character)
                  }
                >
                  <div className="archive-character-card__image">

                    <img
                      src={character.image}
                      alt={character.name}
                      onError={(event) => {
                        event.currentTarget.style.display =
                          "none";
                      }}
                    />

                  </div>

                  <div>
                    <span>
                      {character.type === "demon"
                        ? "DEMON"
                        : "DEMON SLAYER"}
                    </span>

                    <strong>
                      {character.name}
                    </strong>

                    <small>
                      {character.rank}
                    </small>
                  </div>

                  <ArrowUpRight size={14} />

                </button>
              ))
            ) : (
              <p className="archive-detail__empty">
                No related characters recorded.
              </p>
            )}

          </div>

        </section>

      </div>
    </section>
  );
}

export default SlayerDetailsPage;