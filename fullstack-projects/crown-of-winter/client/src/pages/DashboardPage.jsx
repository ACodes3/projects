import {
  Snowflake,
  Crown,
  Map,
  Users,
  FileText,
  Gem,
  Archive,
  Shield,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock3,
} from "lucide-react";

import { Link } from "react-router-dom";

import "./DashboardPage.css";

const operations = [
  {
    id: 1,
    name: "Operation Pale Crown",
    region: "Fontaine",
    status: "Active",
    progress: 72,
  },
  {
    id: 2,
    name: "Northern Border Suppression",
    region: "Snezhnaya",
    status: "Complete",
    progress: 100,
  },
  {
    id: 3,
    name: "Divine Asset Acquisition",
    region: "Natlan",
    status: "Classified",
    progress: 46,
  },
];

const harbingers = [
  {
    name: "The Captain",
    status: "Deployed",
  },
  {
    name: "The Doctor",
    status: "Research",
  },
  {
    name: "The Knave",
    status: "Available",
  },
  {
    name: "The Regrator",
    status: "Palace",
  },
];

const alerts = [
  {
    title: "Foreign movement detected",
    text: "Unusual activity reported near a northern diplomatic corridor.",
    type: "warning",
  },
  {
    title: "Cryo network stable",
    text: "Winter Palace command channels remain fully operational.",
    type: "success",
  },
  {
    title: "Archive update received",
    text: "New intelligence documents have been transferred to the imperial archive.",
    type: "info",
  },
];

function DashboardPage() {
  return (
    <main className="dashboard-page">
      {/* HEADER */}
      <header className="dashboard-page__header">
        <div>
          <span className="dashboard-page__eyebrow">Winter Palace</span>

          <h1>Imperial Command</h1>

          <p>
            Central authority and strategic overview of the Crown of Snezhnaya.
          </p>
        </div>

        <div className="dashboard-page__clearance">
          <Snowflake size={18} strokeWidth={1.3} />

          <div>
            <span>Clearance</span>
            <strong>Imperial</strong>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="dashboard-page__hero">
        <img
          src="/images/hero.png"
          alt="The Tsaritsa"
          className="dashboard-page__hero-bg"
        />

        <div className="dashboard-page__hero-overlay" />

        <div className="dashboard-page__hero-content">
          <span className="dashboard-page__hero-label">Her Majesty</span>

          <h2>The Tsaritsa</h2>

          <p>
            The throne of Snezhnaya stands vigilant. All imperial operations
            remain under the authority of the Crown.
          </p>

          <Link to="/tsaritsa" className="dashboard-page__hero-link">
            Enter Royal Chamber
            <ChevronRight size={15} />
          </Link>
        </div>
      </section>

      {/* MAIN GRID */}
      <section className="dashboard-page__grid">
        {/* OPERATIONS */}
        <article className="dashboard-card dashboard-card--operations">
          <div className="dashboard-card__header">
            <div>
              <span>Command</span>
              <h2>Active Operations</h2>
            </div>

            <Map size={17} />
          </div>

          <div className="dashboard-page__operations">
            {operations.map((operation) => (
              <div key={operation.id} className="dashboard-page__operation">
                <div className="dashboard-page__operation-top">
                  <div>
                    <strong>{operation.name}</strong>
                    <span>{operation.region}</span>
                  </div>

                  <small>{operation.status}</small>
                </div>

                <div className="dashboard-page__progress">
                  <span
                    style={{
                      width: `${operation.progress}%`,
                    }}
                  />
                </div>

                <div className="dashboard-page__operation-bottom">
                  <span>Progress</span>

                  <strong>{operation.progress}%</strong>
                </div>
              </div>
            ))}
          </div>

          <Link to="/war-table" className="dashboard-card__link">
            Open War Table
            <ChevronRight size={14} />
          </Link>
        </article>

        {/* HARBINGERS */}
        <article className="dashboard-card">
          <div className="dashboard-card__header">
            <div>
              <span>Fatui Command</span>
              <h2>Harbinger Status</h2>
            </div>

            <Users size={17} />
          </div>

          <div className="dashboard-page__harbingers">
            {harbingers.map((harbinger) => (
              <div key={harbinger.name} className="dashboard-page__harbinger">
                <span className="dashboard-page__harbinger-symbol">
                  <Crown size={14} strokeWidth={1} />
                </span>

                <div>
                  <strong>{harbinger.name}</strong>
                  <span>{harbinger.status}</span>
                </div>

                <span className="dashboard-page__status-light" />
              </div>
            ))}
          </div>

          <Link to="/harbingers" className="dashboard-card__link">
            View All Harbingers
            <ChevronRight size={14} />
          </Link>
        </article>

        {/* GNOSES */}
        <article className="dashboard-card dashboard-card--gnoses">
          <div className="dashboard-card__header">
            <div>
              <span>Classified</span>
              <h2>Project: Gnoses</h2>
            </div>

            <Gem size={17} />
          </div>

          <div className="dashboard-page__gnosis-display">
            <div className="dashboard-page__gnosis-core">
              <Gem size={38} strokeWidth={1} />
            </div>

            <div className="dashboard-page__gnosis-count">
              <strong>4</strong>
              <span>/ 7 Secured</span>
            </div>
          </div>

          <div className="dashboard-page__gnosis-progress">
            <span style={{ width: "57%" }} />
          </div>

          <p>
            Four divine assets are currently held under imperial protection.
          </p>

          <Link to="/gnoses" className="dashboard-card__link">
            Open Project
            <ChevronRight size={14} />
          </Link>
        </article>

        {/* INTELLIGENCE */}
        <article className="dashboard-card dashboard-card--alerts">
          <div className="dashboard-card__header">
            <div>
              <span>Imperial Intelligence</span>
              <h2>Recent Alerts</h2>
            </div>

            <FileText size={17} />
          </div>

          <div className="dashboard-page__alerts">
            {alerts.map((alert) => {
              let Icon = Clock3;

              if (alert.type === "warning") {
                Icon = AlertTriangle;
              }

              if (alert.type === "success") {
                Icon = CheckCircle2;
              }

              return (
                <div
                  key={alert.title}
                  className={`dashboard-page__alert dashboard-page__alert--${alert.type}`}
                >
                  <Icon size={16} />

                  <div>
                    <strong>{alert.title}</strong>
                    <span>{alert.text}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <Link to="/intelligence" className="dashboard-card__link">
            Open Intelligence Archive
            <ChevronRight size={14} />
          </Link>
        </article>

        {/* LOWER STATUS */}
        <article className="dashboard-card dashboard-card--small">
          <div className="dashboard-page__small-icon">
            <Archive size={21} />
          </div>

          <div>
            <span>Relic Vault</span>
            <strong>128 Secured Items</strong>
          </div>

          <Link to="/relic-vault">
            <ChevronRight size={15} />
          </Link>
        </article>

        <article className="dashboard-card dashboard-card--small">
          <div className="dashboard-page__small-icon">
            <Shield size={21} />
          </div>

          <div>
            <span>Palace Security</span>
            <strong>All Sectors Secure</strong>
          </div>

          <Link to="/palace">
            <ChevronRight size={15} />
          </Link>
        </article>
      </section>
    </main>
  );
}

export default DashboardPage;
