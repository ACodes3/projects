import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  Droplets,
  Sword,
  User,
  Wind
} from "lucide-react";

import { getAllData } from "../services/dataService";

import {
  findById,
  findManyByIds
} from "../utils/dataHelpers";

import "./ArchiveDetails.css";

function TechniqueDetailsPage() {
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
        setError(
          "Could not load technique details."
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const technique = useMemo(() => {
    return findById(
      data.techniques,
      id
    );
  }, [
    data.techniques,
    id
  ]);

  const parent = useMemo(() => {
    if (!technique) return null;

    if (
      technique.category ===
      "blood-demon-art"
    ) {
      return findById(
        data.bloodDemonArts,
        technique.parentId
      );
    }

    return findById(
      data.breathingStyles,
      technique.parentId
    );
  }, [
    technique,
    data.bloodDemonArts,
    data.breathingStyles
  ]);

  const users = useMemo(() => {
    if (!technique) return [];

    const allCharacters = [
      ...data.slayers,
      ...data.demons
    ];

    return findManyByIds(
      allCharacters,
      technique.userIds || []
    );
  }, [
    technique,
    data.slayers,
    data.demons
  ]);

  if (isLoading) {
    return (
      <div className="status-screen">
        Loading technique...
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

  if (!technique) {
    return (
      <div className="status-screen">
        Technique not found.
      </div>
    );
  }

  const isBloodArt =
    technique.category ===
    "blood-demon-art";

  const accent =
    parent?.theme?.primary ||
    (isBloodArt
      ? "#df3159"
      : "#4fa9ff");

  const secondary =
    parent?.theme?.secondary ||
    (isBloodArt
      ? "#711d65"
      : "#2850ad");

  const goToParent = () => {
    if (!parent) return;

    if (isBloodArt) {
      navigate(
        `/blood-arts/${parent.id}`
      );
      return;
    }

    navigate(
      `/breathing/${parent.id}`
    );
  };

  const goToCharacter = (character) => {
    if (character.type === "demon") {
      navigate(`/demons/${character.id}`);
      return;
    }

    navigate(`/slayers/${character.id}`);
  };

  return (
    <section
      className={
        isBloodArt
          ? "archive-detail archive-detail--demon"
          : "archive-detail"
      }
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
          onClick={() =>
            navigate(-1)
          }
        >
          <ArrowLeft size={15} />
          <span>BACK</span>
        </button>

        <div className="archive-technique-hero">

          <div className="archive-technique-hero__icon">

            {isBloodArt ? (
              <Droplets size={42} />
            ) : (
              <Sword size={42} />
            )}

          </div>

          <div className="archive-technique-hero__content">

            <div className="archive-detail__eyebrow">
              <span />

              {isBloodArt
                ? "BLOOD DEMON ART ABILITY"
                : "BREATHING TECHNIQUE"}
            </div>

            <h1>
              {technique.name}
            </h1>

            <p>
              {technique.description ||
                "A recorded combat technique within the Kimetsu Archive."}
            </p>

          </div>

        </div>

        <div className="archive-detail__grid">

          <section className="archive-detail-panel">

            <div className="archive-detail-panel__heading">

              {isBloodArt ? (
                <Droplets size={17} />
              ) : (
                <Wind size={17} />
              )}

              <div>
                <span>PARENT SYSTEM</span>
                <h2>
                  {isBloodArt
                    ? "Blood Demon Art"
                    : "Breathing Style"}
                </h2>
              </div>

            </div>

            {parent ? (
              <button
                type="button"
                className="archive-parent-card"
                onClick={goToParent}
              >
                <div className="archive-parent-card__icon">

                  {isBloodArt ? (
                    <Droplets size={20} />
                  ) : (
                    <Wind size={20} />
                  )}

                </div>

                <div>
                  <span>
                    {isBloodArt
                      ? "BLOOD DEMON ART"
                      : "BREATHING STYLE"}
                  </span>

                  <strong>
                    {parent.name}
                  </strong>
                </div>

                <ArrowUpRight size={15} />

              </button>
            ) : (
              <p className="archive-detail__empty">
                Parent system not recorded.
              </p>
            )}

          </section>

          <section className="archive-detail-panel">

            <div className="archive-detail-panel__heading">
              <User size={17} />

              <div>
                <span>CLASSIFICATION</span>
                <h2>Technique Record</h2>
              </div>
            </div>

            <div className="archive-metadata">

              <div>
                <span>CATEGORY</span>

                <strong>
                  {isBloodArt
                    ? "Blood Demon Art"
                    : "Breathing"}
                </strong>
              </div>

              <div>
                <span>TYPE</span>

                <strong>
                  {technique.type ||
                    "Technique"}
                </strong>
              </div>

              <div>
                <span>KNOWN USERS</span>

                <strong>
                  {users.length}
                </strong>
              </div>

            </div>

          </section>

        </div>

        <section className="archive-detail-panel archive-detail-panel--wide">

          <div className="archive-detail-panel__heading">
            <User size={17} />

            <div>
              <span>CONNECTED CHARACTERS</span>
              <h2>Known Users</h2>
            </div>
          </div>

          <div className="archive-character-grid">

            {users.length > 0 ? (
              users.map((character) => (
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
                No users recorded.
              </p>
            )}

          </div>

        </section>

      </div>
    </section>
  );
}

export default TechniqueDetailsPage;