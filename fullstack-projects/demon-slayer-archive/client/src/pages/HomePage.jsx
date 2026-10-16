import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Sword,
  Skull,
  Wind,
  Droplets,
  Sparkles,
  ChevronRight
} from "lucide-react";

import { getAllData } from "../services/dataService";

import "./HomePage.css";

function HomePage() {
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

        setError("Could not load archive data.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="status-screen">
        Loading archive...
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

  const featuredSlayer =
    data.slayers[0] || null;

  const featuredDemon =
    data.demons[0] || null;

  const sections = [
    {
      id: "slayers",
      title: "Demon Slayers",
      subtitle: "The Corps",
      description:
        "Explore swordsmen, Hashira, their ranks, combat statistics and the Breathing Styles they wield.",
      path: "/slayers",
      count: data.slayers.length,
      icon: Sword,
      accent: "#4f9cff",
      className: "home-category--slayers"
    },
    {
      id: "demons",
      title: "Demons",
      subtitle: "The Twelve Kizuki",
      description:
        "Discover demons, their ranks, supernatural abilities, regeneration and connected Blood Demon Arts.",
      path: "/demons",
      count: data.demons.length,
      icon: Skull,
      accent: "#df3159",
      className: "home-category--demons"
    },
    {
      id: "breathing",
      title: "Breathing Styles",
      subtitle: "Swordsmanship",
      description:
        "Trace the lineage of Breathing Styles, their known users, derived styles and combat forms.",
      path: "/breathing",
      count: data.breathingStyles.length,
      icon: Wind,
      accent: "#49b8ff",
      className: "home-category--breathing"
    },
    {
      id: "blood-arts",
      title: "Blood Demon Arts",
      subtitle: "Demonic Techniques",
      description:
        "Explore the supernatural powers manifested by demons and the abilities connected to each art.",
      path: "/blood-arts",
      count: data.bloodDemonArts.length,
      icon: Droplets,
      accent: "#c93679",
      className: "home-category--blood"
    }
  ];

  return (
    <section className="archive-home">

      <div className="archive-home__background" />
      <div className="archive-home__mist archive-home__mist--one" />
      <div className="archive-home__mist archive-home__mist--two" />

      {/* HERO */}

      <div className="archive-hero">

        <div className="archive-hero__content">

          <div className="archive-hero__eyebrow">

            <span className="archive-hero__eyebrow-line" />

            <span>
              KIMETSU NO YAIBA
            </span>

          </div>

          <h1 className="archive-hero__title">
            <span>
              DEMON SLAYER
            </span>

            <strong>
              ARCHIVE
            </strong>
          </h1>

          <p className="archive-hero__description">
            Explore the Demon Slayer Corps, the demons they hunt,
            their Breathing Styles, Blood Demon Arts and the techniques
            that connect every part of the world.
          </p>

          <div className="archive-hero__actions">

            <button
              type="button"
              className="archive-hero__primary"
              onClick={() =>
                navigate("/slayers")
              }
            >
              <Sword size={16} />

              <span>
                ENTER ARCHIVE
              </span>

              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              className="archive-hero__secondary"
              onClick={() =>
                navigate("/demons")
              }
            >
              EXPLORE DEMONS
            </button>

          </div>

          {/* ARCHIVE COUNTS */}

          <div className="archive-hero__stats">

            <div className="archive-count">

              <strong>
                {data.slayers.length}
              </strong>

              <span>
                SLAYERS
              </span>

            </div>

            <div className="archive-count">

              <strong>
                {data.demons.length}
              </strong>

              <span>
                DEMONS
              </span>

            </div>

            <div className="archive-count">

              <strong>
                {data.breathingStyles.length}
              </strong>

              <span>
                STYLES
              </span>

            </div>

            <div className="archive-count">

              <strong>
                {data.techniques.length}
              </strong>

              <span>
                TECHNIQUES
              </span>

            </div>

          </div>

        </div>

        {/* HERO VISUAL */}

        <div className="archive-hero__visual">

          <div className="archive-hero__circle archive-hero__circle--outer" />
          <div className="archive-hero__circle archive-hero__circle--middle" />
          <div className="archive-hero__circle archive-hero__circle--inner" />

          <div className="archive-hero__slash archive-hero__slash--one" />
          <div className="archive-hero__slash archive-hero__slash--two" />

          <div className="archive-hero__symbol">
            <Sword
              size={86}
              strokeWidth={0.8}
            />
          </div>

          <div className="archive-hero__visual-label">

            <span>
              CONNECTED DATABASE
            </span>

            <strong>
              CORPS × DEMONS
            </strong>

          </div>

        </div>

      </div>

      {/* MAIN CATEGORIES */}

      <div className="archive-sections">

        <div className="archive-sections__heading">

          <div>
            <span>
              EXPLORE
            </span>

            <h2>
              The Archive
            </h2>
          </div>

          <p>
            Every category is connected. Follow a Slayer into their
            Breathing Style, or a demon into the Blood Demon Art that
            defines their abilities.
          </p>

        </div>

        <div className="archive-sections__grid">

          {sections.map((section) => {
            const Icon = section.icon;

            return (
              <button
                key={section.id}
                type="button"
                className={`home-category ${section.className}`}
                style={{
                  "--category-accent":
                    section.accent
                }}
                onClick={() =>
                  navigate(section.path)
                }
              >
                <div className="home-category__glow" />

                <div className="home-category__top">

                  <span className="home-category__icon">
                    <Icon size={19} />
                  </span>

                  <span className="home-category__count">
                    {String(
                      section.count
                    ).padStart(2, "0")}
                  </span>

                </div>

                <div className="home-category__content">

                  <span className="home-category__subtitle">
                    {section.subtitle}
                  </span>

                  <h3>
                    {section.title}
                  </h3>

                  <p>
                    {section.description}
                  </p>

                </div>

                <div className="home-category__footer">

                  <span>
                    EXPLORE
                  </span>

                  <ChevronRight size={15} />

                </div>

              </button>
            );
          })}

        </div>

      </div>

      {/* FEATURED CHARACTERS */}

      <div className="archive-featured">

        <div className="archive-featured__heading">

          <span>
            FEATURED
          </span>

          <h2>
            Two Sides of the Battle
          </h2>

        </div>

        <div className="archive-featured__grid">

          {/* SLAYER */}

          <article className="featured-character featured-character--slayer">

            <div className="featured-character__background" />

            <div className="featured-character__info">

              <span className="featured-character__type">
                DEMON SLAYER
              </span>

              <h3>
                {featuredSlayer?.name ||
                  "Demon Slayer"}
              </h3>

              <span className="featured-character__rank">
                {featuredSlayer?.rank ||
                  "Demon Slayer Corps"}
              </span>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    featuredSlayer
                      ? `/slayers/${featuredSlayer.id}`
                      : "/slayers"
                  )
                }
              >
                VIEW SLAYER

                <ArrowRight size={14} />
              </button>

            </div>

            <div className="featured-character__visual">

              <div className="featured-character__ring" />

              {featuredSlayer?.image ? (
                <img
                  src={featuredSlayer.image}
                  alt={featuredSlayer.name}
                  onError={(event) => {
                    event.currentTarget.style.display =
                      "none";
                  }}
                />
              ) : (
                <Sword size={76} />
              )}

            </div>

          </article>

          {/* DEMON */}

          <article className="featured-character featured-character--demon">

            <div className="featured-character__background" />

            <div className="featured-character__info">

              <span className="featured-character__type">
                DEMON
              </span>

              <h3>
                {featuredDemon?.name ||
                  "Demon"}
              </h3>

              <span className="featured-character__rank">
                {featuredDemon?.rank ||
                  "Demon"}
              </span>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    featuredDemon
                      ? `/demons/${featuredDemon.id}`
                      : "/demons"
                  )
                }
              >
                VIEW DEMON

                <ArrowRight size={14} />
              </button>

            </div>

            <div className="featured-character__visual">

              <div className="featured-character__ring" />

              {featuredDemon?.image ? (
                <img
                  src={featuredDemon.image}
                  alt={featuredDemon.name}
                  onError={(event) => {
                    event.currentTarget.style.display =
                      "none";
                  }}
                />
              ) : (
                <Skull size={76} />
              )}

            </div>

          </article>

        </div>

      </div>

      {/* CONNECTION STRIP */}

      <div className="archive-connections">

        <div className="archive-connections__icon">
          <Sparkles size={18} />
        </div>

        <div className="archive-connections__text">

          <span>
            CONNECTED ARCHIVE
          </span>

          <strong>
            Character → Style → Technique
          </strong>

        </div>

        <div className="archive-connections__paths">

          <button
            type="button"
            onClick={() =>
              navigate("/slayers")
            }
          >
            SLAYERS
          </button>

          <ChevronRight size={13} />

          <button
            type="button"
            onClick={() =>
              navigate("/breathing")
            }
          >
            BREATHING
          </button>

          <span className="archive-connections__separator" />

          <button
            type="button"
            onClick={() =>
              navigate("/demons")
            }
          >
            DEMONS
          </button>

          <ChevronRight size={13} />

          <button
            type="button"
            onClick={() =>
              navigate("/blood-arts")
            }
          >
            BLOOD ARTS
          </button>

        </div>

      </div>

    </section>
  );
}

export default HomePage;