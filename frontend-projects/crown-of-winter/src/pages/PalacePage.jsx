import {
  Crown,
  Castle,
  Map,
  Archive,
  Gem,
  Shield,
  Snowflake,
  ScrollText,
  FlaskConical,
  ChevronRight,
} from "lucide-react";

import { Link } from "react-router-dom";

import "./PalacePage.css";

const chambers = [
  {
    id: "throne",
    name: "Throne Chamber",
    subtitle: "Seat of the Tsaritsa",
    icon: Crown,
    status: "Open",
    path: "/palace/throne",
    description:
      "The central seat of imperial authority and the ceremonial heart of the Winter Palace.",
  },
  {
    id: "war",
    name: "War Chamber",
    subtitle: "Strategic Command",
    icon: Map,
    status: "Open",
    path: "/palace/war",
    description:
      "Military operations, regional deployments and strategic Fatui planning are coordinated here.",
  },
  {
    id: "harbingers",
    name: "Harbinger Hall",
    subtitle: "Council Chamber",
    icon: Shield,
    status: "Open",
    path: "/palace/harbingers",
    description:
      "A restricted council chamber reserved for the Eleven Fatui Harbingers.",
  },
  {
    id: "archive",
    name: "Imperial Archives",
    subtitle: "Classified Records",
    icon: Archive,
    status: "Open",
    path: "/palace/archives",
    description:
      "Historic records, intelligence dossiers and restricted imperial documentation.",
  },
  {
    id: "vault",
    name: "Relic Vault",
    subtitle: "Secured Artifacts",
    icon: Gem,
    status: "Restricted",
    path: "/palace/relic-vault",
    description:
      "A heavily protected chamber containing relics, weapons and captured divine artifacts.",
  },
  {
    id: "laboratory",
    name: "Cryo Laboratory",
    subtitle: "Research Division",
    icon: FlaskConical,
    status: "Restricted",
    path: "/palace/cryo-laboratory",
    description:
      "Experimental Cryo research and classified technological development.",
  },
  {
    id: "gnosis",
    name: "Gnosis Chamber",
    subtitle: "Omega Clearance",
    icon: Snowflake,
    status: "Omega",
    path: "/palace/gnosis",
    description:
      "The most secure chamber beneath the palace. Access is limited to the highest imperial authority.",
  },
  {
    id: "records",
    name: "Royal Records",
    subtitle: "Imperial Directives",
    icon: ScrollText,
    status: "Open",
    description:
      "Official decrees, diplomatic orders and directives issued under the authority of the Crown.",
  },
];

function PalacePage() {
  return (
    <main className="palace-page">
      {/* HEADER */}
      <header className="palace-page__header">
        <div>
          <span className="palace-page__eyebrow">Winter Palace</span>

          <h1>Palace of Ice</h1>

          <p>
            Navigate the secured chambers and operational sectors of the
            imperial residence.
          </p>
        </div>

        <div className="palace-page__status">
          <Castle size={19} />

          <div>
            <span>Palace Status</span>
            <strong>Secure</strong>
          </div>
        </div>
      </header>

      {/* PALACE HERO */}
      <section className="palace-page__hero">
        <img
          src="/images/palace.png"
          alt="The Winter Palace"
          className="palace-page__hero-bg"
        />

        <div className="palace-page__hero-overlay" />

        <div className="palace-page__hero-content">
          <span>Imperial Residence</span>

          <h2>The Winter Palace</h2>

          <p>
            A fortress of ice, crystal and imperial power. Every chamber serves
            the authority of the Crown.
          </p>

          <div className="palace-page__hero-meta">
            <span>
              <Snowflake size={13} />
              Cryo Network Active
            </span>

            <span>
              <Shield size={13} />
              Imperial Security
            </span>
          </div>
        </div>
      </section>

      {/* SECTION TITLE */}
      <div className="palace-page__section-heading">
        <div>
          <span>Palace Directory</span>
          <h2>Imperial Chambers</h2>
        </div>

        <span className="palace-page__section-count">08 Sectors</span>
      </div>

      {/* CHAMBERS */}
      <section className="palace-page__grid">
        {chambers.map((chamber) => {
          const Icon = chamber.icon;

          return (
            <article key={chamber.id} className="palace-card">
              <div className="palace-card__top">
                <div className="palace-card__icon">
                  <Icon size={24} strokeWidth={1.2} />
                </div>

                <span
                  className={`palace-card__status palace-card__status--${chamber.status.toLowerCase()}`}
                >
                  {chamber.status}
                </span>
              </div>

              <div className="palace-card__content">
                <span>{chamber.subtitle}</span>

                <h2>{chamber.name}</h2>

                <p>{chamber.description}</p>
              </div>

              <div className="palace-card__footer">
                <span>Sector {chambers.indexOf(chamber) + 1}</span>

                <Link to={chamber.path} className="palace-card__enter">
                  Enter
                  <ChevronRight size={14} />
                </Link>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}

export default PalacePage;
