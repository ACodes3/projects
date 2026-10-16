import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  Droplets,
  Skull,
  Sparkles,
  User
} from "lucide-react";

import { getAllData } from "../services/dataService";

import {
  findById,
  findManyByIds
} from "../utils/dataHelpers";

import "./ArchiveDetails.css";

function BloodDemonArtDetailsPage() {
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
          "Could not load Blood Demon Art details."
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const art = useMemo(() => {
    return findById(
      data.bloodDemonArts,
      id
    );
  }, [
    data.bloodDemonArts,
    id
  ]);

  const demon = useMemo(() => {
    if (!art) return null;

    return findById(
      data.demons,
      art.userId
    );
  }, [
    art,
    data.demons
  ]);

  const abilities = useMemo(() => {
    if (!art) return [];

    return findManyByIds(
      data.techniques,
      art.abilityIds || []
    );
  }, [
    art,
    data.techniques
  ]);

  if (isLoading) {
    return (
      <div className="status-screen">
        Loading Blood Demon Art...
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

  if (!art) {
    return (
      <div className="status-screen">
        Blood Demon Art not found.
      </div>
    );
  }

  return (
    <section
      className="archive-detail archive-detail--demon"
      style={{
        "--detail-primary":
          art.theme?.primary ||
          "#e33a61",

        "--detail-secondary":
          art.theme?.secondary ||
          "#7b266d"
      }}
    >
      <div className="archive-detail__ambient" />

      <div className="archive-detail__container">

        <button
          type="button"
          className="archive-detail__back"
          onClick={() =>
            navigate("/blood-arts")
          }
        >
          <ArrowLeft size={15} />

          <span>
            BACK TO BLOOD DEMON ARTS
          </span>
        </button>

        <div className="archive-detail__hero">

          <div className="archive-detail__content">

            <div className="archive-detail__eyebrow">
              <span />
              BLOOD DEMON ART
            </div>

            <h1>
              {art.name}
            </h1>

            <p className="archive-detail__rank">
              DEMONIC TECHNIQUE
            </p>

            <p className="archive-detail__description">
              {art.description ||
                "A supernatural power produced through demonic blood and unique to its user."}
            </p>

            <div className="archive-detail__stats">

              <div className="archive-detail-stat">
                <Sparkles size={15} />

                <div>
                  <strong>
                    {abilities.length}
                  </strong>

                  <span>ABILITIES</span>
                </div>
              </div>

              <div className="archive-detail-stat">
                <User size={15} />

                <div>
                  <strong>
                    {demon ? 1 : 0}
                  </strong>

                  <span>KNOWN USER</span>
                </div>
              </div>

              <div className="archive-detail-stat">
                <Skull size={15} />

                <div>
                  <strong>
                    {demon?.stats?.power || 0}
                  </strong>

                  <span>USER POWER</span>
                </div>
              </div>

            </div>

          </div>

          <div className="archive-detail__visual archive-detail__visual--symbol">

            <div className="archive-detail__ring archive-detail__ring--outer" />
            <div className="archive-detail__ring archive-detail__ring--inner" />

            {art.image && (
              <img
                src={art.image}
                alt={art.name}
                onError={(event) => {
                  event.currentTarget.style.display =
                    "none";
                }}
              />
            )}

            <Droplets
              size={82}
              strokeWidth={1}
              className="archive-detail__fallback-icon"
            />

          </div>

        </div>

        <div className="archive-detail__grid">

          <section className="archive-detail-panel">

            <div className="archive-detail-panel__heading">
              <Skull size={17} />

              <div>
                <span>CONNECTED CHARACTER</span>
                <h2>Demon User</h2>
              </div>
            </div>

            {demon ? (
              <div className="archive-character-grid archive-character-grid--single">

                <button
                  type="button"
                  className="archive-character-card"
                  onClick={() =>
                    navigate(
                      `/demons/${demon.id}`
                    )
                  }
                >
                  <div className="archive-character-card__image">

                    <img
                      src={demon.image}
                      alt={demon.name}
                      onError={(event) => {
                        event.currentTarget.style.display =
                          "none";
                      }}
                    />

                  </div>

                  <div>
                    <span>DEMON</span>

                    <strong>
                      {demon.name}
                    </strong>

                    <small>
                      {demon.rank}
                    </small>
                  </div>

                  <ArrowUpRight size={14} />

                </button>

              </div>
            ) : (
              <p className="archive-detail__empty">
                No user recorded.
              </p>
            )}

          </section>

          <section className="archive-detail-panel">

            <div className="archive-detail-panel__heading">
              <Droplets size={17} />

              <div>
                <span>CLASSIFICATION</span>
                <h2>Archive Record</h2>
              </div>
            </div>

            <div className="archive-metadata">

              <div>
                <span>TYPE</span>
                <strong>
                  Blood Demon Art
                </strong>
              </div>

              <div>
                <span>USER</span>
                <strong>
                  {demon?.name ||
                    "Unknown"}
                </strong>
              </div>

              <div>
                <span>ABILITIES</span>
                <strong>
                  {abilities.length}
                </strong>
              </div>

            </div>

          </section>

        </div>

        <section className="archive-detail-panel archive-detail-panel--wide">

          <div className="archive-detail-panel__heading">
            <Sparkles size={17} />

            <div>
              <span>MANIFESTATIONS</span>
              <h2>Abilities</h2>
            </div>
          </div>

          <div className="archive-technique-grid">

            {abilities.length > 0 ? (
              abilities.map(
                (ability, index) => (
                  <button
                    key={ability.id}
                    type="button"
                    className="archive-technique-card"
                    onClick={() =>
                      navigate(
                        `/techniques/${ability.id}`
                      )
                    }
                  >
                    <span className="archive-technique-card__number">
                      {String(index + 1).padStart(
                        2,
                        "0"
                      )}
                    </span>

                    <div>
                      <span>
                        DEMON TECHNIQUE
                      </span>

                      <strong>
                        {ability.name}
                      </strong>

                      <p>
                        {ability.description ||
                          "Recorded manifestation of this Blood Demon Art."}
                      </p>
                    </div>

                    <ArrowUpRight size={14} />

                  </button>
                )
              )
            ) : (
              <p className="archive-detail__empty">
                No abilities recorded.
              </p>
            )}

          </div>

        </section>

      </div>
    </section>
  );
}

export default BloodDemonArtDetailsPage;