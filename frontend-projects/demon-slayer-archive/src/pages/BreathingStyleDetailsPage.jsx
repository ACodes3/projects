import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  GitBranch,
  Sparkles,
  Sword,
  Users,
  Wind
} from "lucide-react";

import { getAllData } from "../services/dataService";

import {
  findById,
  findManyByIds
} from "../utils/dataHelpers";

import "./ArchiveDetails.css";

function BreathingStyleDetailsPage() {
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
          "Could not load Breathing Style details."
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const style = useMemo(() => {
    return findById(
      data.breathingStyles,
      id
    );
  }, [
    data.breathingStyles,
    id
  ]);

  const users = useMemo(() => {
    if (!style) return [];

    return findManyByIds(
      data.slayers,
      style.userIds || []
    );
  }, [
    style,
    data.slayers
  ]);

  const techniques = useMemo(() => {
    if (!style) return [];

    return findManyByIds(
      data.techniques,
      style.techniqueIds || []
    );
  }, [
    style,
    data.techniques
  ]);

  const parentStyle = useMemo(() => {
    if (
      !style ||
      !style.derivedFromId
    ) {
      return null;
    }

    return findById(
      data.breathingStyles,
      style.derivedFromId
    );
  }, [
    style,
    data.breathingStyles
  ]);

  const derivedStyles = useMemo(() => {
    if (!style) return [];

    return data.breathingStyles.filter(
      (item) =>
        item.derivedFromId === style.id
    );
  }, [
    style,
    data.breathingStyles
  ]);

  if (isLoading) {
    return (
      <div className="status-screen">
        Loading Breathing Style...
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

  if (!style) {
    return (
      <div className="status-screen">
        Breathing Style not found.
      </div>
    );
  }

  return (
    <section
      className="archive-detail"
      style={{
        "--detail-primary":
          style.theme?.primary ||
          "#4ebcff",

        "--detail-secondary":
          style.theme?.secondary ||
          "#2654b7"
      }}
    >
      <div className="archive-detail__ambient" />

      <div className="archive-detail__container">

        <button
          type="button"
          className="archive-detail__back"
          onClick={() => navigate("/breathing")}
        >
          <ArrowLeft size={15} />
          <span>BACK TO BREATHING STYLES</span>
        </button>

        <div className="archive-detail__hero">

          <div className="archive-detail__content">

            <div className="archive-detail__eyebrow">
              <span />
              BREATHING STYLE
            </div>

            <h1>
              {style.name}
            </h1>

            <p className="archive-detail__rank">
              SWORDSMANSHIP SYSTEM
            </p>

            <p className="archive-detail__description">
              {style.description ||
                "A swordsmanship system based on Total Concentration Breathing and specialized combat forms."}
            </p>

            <div className="archive-detail__stats">

              <div className="archive-detail-stat">
                <Sword size={15} />

                <div>
                  <strong>
                    {techniques.length}
                  </strong>

                  <span>TECHNIQUES</span>
                </div>
              </div>

              <div className="archive-detail-stat">
                <Users size={15} />

                <div>
                  <strong>
                    {users.length}
                  </strong>

                  <span>KNOWN USERS</span>
                </div>
              </div>

              <div className="archive-detail-stat">
                <GitBranch size={15} />

                <div>
                  <strong>
                    {derivedStyles.length}
                  </strong>

                  <span>DERIVED STYLES</span>
                </div>
              </div>

            </div>

          </div>

          <div className="archive-detail__visual archive-detail__visual--symbol">

            <div className="archive-detail__ring archive-detail__ring--outer" />
            <div className="archive-detail__ring archive-detail__ring--inner" />

            {style.image && (
              <img
                src={style.image}
                alt={style.name}
                onError={(event) => {
                  event.currentTarget.style.display =
                    "none";
                }}
              />
            )}

            <Wind
              size={82}
              strokeWidth={1}
              className="archive-detail__fallback-icon"
            />

          </div>

        </div>

        <div className="archive-detail__grid">

          <section className="archive-detail-panel">

            <div className="archive-detail-panel__heading">
              <Users size={17} />

              <div>
                <span>CHARACTERS</span>
                <h2>Known Users</h2>
              </div>
            </div>

            <div className="archive-character-grid archive-character-grid--single">

              {users.length > 0 ? (
                users.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    className="archive-character-card"
                    onClick={() =>
                      navigate(
                        `/slayers/${user.id}`
                      )
                    }
                  >
                    <div className="archive-character-card__image">

                      <img
                        src={user.image}
                        alt={user.name}
                        onError={(event) => {
                          event.currentTarget.style.display =
                            "none";
                        }}
                      />

                    </div>

                    <div>
                      <span>DEMON SLAYER</span>

                      <strong>
                        {user.name}
                      </strong>

                      <small>
                        {user.rank}
                      </small>
                    </div>

                    <ArrowUpRight size={14} />

                  </button>
                ))
              ) : (
                <p className="archive-detail__empty">
                  No known users recorded.
                </p>
              )}

            </div>

          </section>

          <section className="archive-detail-panel">

            <div className="archive-detail-panel__heading">
              <GitBranch size={17} />

              <div>
                <span>STYLE LINEAGE</span>
                <h2>Origin</h2>
              </div>
            </div>

            <div className="archive-record-list">

              {parentStyle ? (
                <button
                  type="button"
                  className="archive-record"
                  onClick={() =>
                    navigate(
                      `/breathing/${parentStyle.id}`
                    )
                  }
                >
                  <div>
                    <span>DERIVED FROM</span>
                    <strong>
                      {parentStyle.name}
                    </strong>
                  </div>

                  <ArrowUpRight size={14} />
                </button>
              ) : (
                <div className="archive-record archive-record--static">
                  <Sparkles size={15} />

                  <div>
                    <span>ORIGIN</span>
                    <strong>
                      Original Style
                    </strong>
                  </div>
                </div>
              )}

              {derivedStyles.map(
                (derivedStyle) => (
                  <button
                    key={derivedStyle.id}
                    type="button"
                    className="archive-record"
                    onClick={() =>
                      navigate(
                        `/breathing/${derivedStyle.id}`
                      )
                    }
                  >
                    <div>
                      <span>DERIVED STYLE</span>

                      <strong>
                        {derivedStyle.name}
                      </strong>
                    </div>

                    <ArrowUpRight size={14} />
                  </button>
                )
              )}

            </div>

          </section>

        </div>

        <section className="archive-detail-panel archive-detail-panel--wide">

          <div className="archive-detail-panel__heading">
            <Sword size={17} />

            <div>
              <span>COMBAT FORMS</span>
              <h2>Techniques</h2>
            </div>
          </div>

          <div className="archive-technique-grid">

            {techniques.length > 0 ? (
              techniques.map(
                (technique, index) => (
                  <button
                    key={technique.id}
                    type="button"
                    className="archive-technique-card"
                    onClick={() =>
                      navigate(
                        `/techniques/${technique.id}`
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
                      <span>FORM</span>

                      <strong>
                        {technique.name}
                      </strong>

                      <p>
                        {technique.description ||
                          "Recorded Breathing Style technique."}
                      </p>
                    </div>

                    <ArrowUpRight size={14} />

                  </button>
                )
              )
            ) : (
              <p className="archive-detail__empty">
                No techniques recorded.
              </p>
            )}

          </div>

        </section>

      </div>
    </section>
  );
}

export default BreathingStyleDetailsPage;