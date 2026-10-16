import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  Droplets,
  Skull,
  Users,
  Zap
} from "lucide-react";

import { getAllData } from "../services/dataService";

import {
  findById,
  findManyByIds
} from "../utils/dataHelpers";

import "./ArchiveDetails.css";

function DemonDetailsPage() {
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
        setError("Could not load Demon details.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const demon = useMemo(() => {
    return findById(data.demons, id);
  }, [data.demons, id]);

  const bloodArts = useMemo(() => {
    if (!demon) return [];

    return findManyByIds(
      data.bloodDemonArts,
      demon.bloodDemonArtIds || []
    );
  }, [demon, data.bloodDemonArts]);

  const abilities = useMemo(() => {
    if (!demon) return [];

    const directAbilities = findManyByIds(
      data.techniques,
      demon.abilityIds || []
    );

    if (directAbilities.length > 0) {
      return directAbilities;
    }

    const artAbilityIds =
      bloodArts.flatMap(
        (art) => art.abilityIds || []
      );

    return findManyByIds(
      data.techniques,
      artAbilityIds
    );
  }, [
    demon,
    bloodArts,
    data.techniques
  ]);

  const relatedCharacters = useMemo(() => {
    if (!demon) return [];

    const allCharacters = [
      ...data.slayers,
      ...data.demons
    ];

    return findManyByIds(
      allCharacters,
      demon.relatedCharacterIds || []
    );
  }, [
    demon,
    data.slayers,
    data.demons
  ]);

  if (isLoading) {
    return (
      <div className="status-screen">
        Loading Demon profile...
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

  if (!demon) {
    return (
      <div className="status-screen">
        Demon not found.
      </div>
    );
  }

  const primaryArt =
    bloodArts[0] || null;

  const accent =
    primaryArt?.theme?.primary ||
    "#df3159";

  const secondary =
    primaryArt?.theme?.secondary ||
    "#6f1d5e";

  const goToCharacter = (character) => {
    if (character.type === "demon") {
      navigate(`/demons/${character.id}`);
      return;
    }

    navigate(`/slayers/${character.id}`);
  };

  return (
    <section
      className="archive-detail archive-detail--demon"
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
          onClick={() => navigate("/demons")}
        >
          <ArrowLeft size={15} />
          <span>BACK TO DEMONS</span>
        </button>

        <div className="archive-detail__hero">

          <div className="archive-detail__content">

            <div className="archive-detail__eyebrow">
              <span />
              DEMON PROFILE
            </div>

            <h1>
              {demon.name}
            </h1>

            <p className="archive-detail__rank">
              {demon.rank}
            </p>

            <p className="archive-detail__description">
              {demon.description ||
                "A demon possessing enhanced physical abilities, regeneration and supernatural powers."}
            </p>

            <div className="archive-detail__stats">

              <div className="archive-detail-stat">
                <Skull size={15} />

                <div>
                  <strong>
                    {demon.stats?.power || 0}
                  </strong>

                  <span>POWER</span>
                </div>
              </div>

              <div className="archive-detail-stat">
                <Zap size={15} />

                <div>
                  <strong>
                    {demon.stats?.speed || 0}
                  </strong>

                  <span>SPEED</span>
                </div>
              </div>

              <div className="archive-detail-stat">
                <Activity size={15} />

                <div>
                  <strong>
                    {demon.stats?.regeneration || 0}
                  </strong>

                  <span>REGENERATION</span>
                </div>
              </div>

            </div>

          </div>

          <div className="archive-detail__visual">

            <div className="archive-detail__ring archive-detail__ring--outer" />
            <div className="archive-detail__ring archive-detail__ring--inner" />

            <img
              src={demon.image}
              alt={demon.name}
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
              <Droplets size={17} />

              <div>
                <span>SUPERNATURAL POWER</span>
                <h2>Blood Demon Arts</h2>
              </div>
            </div>

            <div className="archive-record-list">

              {bloodArts.length > 0 ? (
                bloodArts.map((art) => (
                  <button
                    key={art.id}
                    type="button"
                    className="archive-record"
                    onClick={() =>
                      navigate(
                        `/blood-arts/${art.id}`
                      )
                    }
                  >
                    <div>
                      <span>BLOOD DEMON ART</span>
                      <strong>{art.name}</strong>
                    </div>

                    <ArrowUpRight size={14} />
                  </button>
                ))
              ) : (
                <p className="archive-detail__empty">
                  No Blood Demon Arts recorded.
                </p>
              )}

            </div>

          </section>

          <section className="archive-detail-panel">

            <div className="archive-detail-panel__heading">
              <Skull size={17} />

              <div>
                <span>KNOWN POWERS</span>
                <h2>Abilities</h2>
              </div>
            </div>

            <div className="archive-record-list">

              {abilities.length > 0 ? (
                abilities.map((ability, index) => (
                  <button
                    key={ability.id}
                    type="button"
                    className="archive-record archive-record--numbered"
                    onClick={() =>
                      navigate(
                        `/techniques/${ability.id}`
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
                      <span>ABILITY</span>
                      <strong>
                        {ability.name}
                      </strong>
                    </div>

                    <ArrowUpRight size={14} />
                  </button>
                ))
              ) : (
                <p className="archive-detail__empty">
                  No abilities recorded.
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

export default DemonDetailsPage;