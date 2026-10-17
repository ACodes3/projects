import {
  Archive,
  ChevronLeft,
  ChevronRight,
  Crown,
  Gem,
  LockKeyhole,
  Shield,
  Snowflake,
  Sparkles,
  Sword,
  AlertTriangle,
} from 'lucide-react';

import { Link } from 'react-router-dom';

import './RelicVaultChamberPage.css';

const containmentUnits = [
  {
    id: 'V-01',
    name: 'Winter Crown Fragment',
    category: 'Imperial Relic',
    status: 'Stable',
    icon: Crown,
  },
  {
    id: 'V-02',
    name: 'Frostfang',
    category: 'Cryo Weapon',
    status: 'Stable',
    icon: Sword,
  },
  {
    id: 'V-03',
    name: 'Crystal Heart',
    category: 'Unknown Artifact',
    status: 'Research',
    icon: Gem,
  },
  {
    id: 'V-04',
    name: 'Celestial Shard',
    category: 'Divine Material',
    status: 'Restricted',
    icon: Sparkles,
  },
];

const protocols = [
  {
    id: '01',
    title: 'Dual Authorization',
    text: 'Two Omega-cleared officers are required for restricted containment access.',
  },
  {
    id: '02',
    title: 'Cryo Stabilization',
    text: 'Vault temperature and resonance fields remain under continuous Cryo regulation.',
  },
  {
    id: '03',
    title: 'Emergency Seal',
    text: 'All vault sectors will automatically lock during containment instability.',
  },
];

function RelicVaultChamberPage() {
  return (
    <main className="relic-chamber-page">

      {/* NAVIGATION */}
      <div className="relic-chamber-page__navigation">

        <Link
          to="/palace"
          className="relic-chamber-page__back"
        >
          <ChevronLeft size={14} />
          Palace Directory
        </Link>

        <span>
          Sector 05 // Relic Vault
        </span>

      </div>

      {/* HERO */}
      <section className="relic-chamber-page__hero">

        <div className="relic-chamber-page__hero-background">

          <div className="relic-chamber-page__vault-door">

            <div className="relic-chamber-page__vault-door-ring">

              <LockKeyhole
                size={62}
                strokeWidth={0.7}
              />

            </div>

          </div>

        </div>

        <div className="relic-chamber-page__hero-overlay" />

        <div className="relic-chamber-page__hero-content">

          <span className="relic-chamber-page__eyebrow">
            Imperial Secure Containment
          </span>

          <h1>
            Relic Vault
          </h1>

          <p>
            A fortified repository beneath the Winter Palace,
            containing imperial artifacts, weapons and materials
            considered too valuable or dangerous for ordinary storage.
          </p>

          <div className="relic-chamber-page__hero-meta">

            <span>
              <LockKeyhole size={13} />
              Omega Seal Active
            </span>

            <span>
              <Shield size={13} />
              Containment Stable
            </span>

            <span>
              <Snowflake size={13} />
              Cryo Grid Online
            </span>

          </div>

        </div>

      </section>

      {/* METRICS */}
      <section className="relic-chamber-page__metrics">

        <article>
          <Archive size={17} />

          <div>
            <span>Contained Relics</span>
            <strong>128</strong>
          </div>
        </article>

        <article>
          <Gem size={17} />

          <div>
            <span>Divine Materials</span>
            <strong>09</strong>
          </div>
        </article>

        <article>
          <LockKeyhole size={17} />

          <div>
            <span>Restricted Units</span>
            <strong>31</strong>
          </div>
        </article>

        <article>
          <AlertTriangle size={17} />

          <div>
            <span>Containment Alerts</span>
            <strong>00</strong>
          </div>
        </article>

      </section>

      {/* MAIN GRID */}
      <section className="relic-chamber-page__grid">

        {/* CONTAINMENT FLOOR */}
        <article className="relic-chamber-card relic-chamber-card--containment">

          <div className="relic-chamber-card__header">

            <div>
              <span>Primary Vault Floor</span>
              <h2>Containment Units</h2>
            </div>

            <Archive size={18} />

          </div>

          <div className="relic-chamber-page__containment">

            {containmentUnits.map((unit) => {
              const Icon = unit.icon;

              return (
                <div
                  key={unit.id}
                  className="relic-chamber-page__unit"
                >

                  <div className="relic-chamber-page__unit-id">
                    {unit.id}
                  </div>

                  <div className="relic-chamber-page__unit-display">

                    <div className="relic-chamber-page__unit-artifact">
                      <Icon
                        size={27}
                        strokeWidth={0.9}
                      />
                    </div>

                  </div>

                  <div className="relic-chamber-page__unit-content">

                    <span>
                      {unit.category}
                    </span>

                    <strong>
                      {unit.name}
                    </strong>

                  </div>

                  <small
                    className={`relic-chamber-page__unit-status relic-chamber-page__unit-status--${unit.status.toLowerCase()}`}
                  >
                    {unit.status}
                  </small>

                </div>
              );
            })}

          </div>

          <Link
            to="/relic-vault"
            className="relic-chamber-page__vault-link"
          >
            Open Imperial Relic Registry
            <ChevronRight size={14} />
          </Link>

        </article>

        {/* VAULT DOOR */}
        <article className="relic-chamber-card relic-chamber-card--security">

          <div className="relic-chamber-card__header">

            <div>
              <span>Primary Access</span>
              <h2>Vault Security</h2>
            </div>

            <Shield size={18} />

          </div>

          <div className="relic-chamber-page__security">

            <div className="relic-chamber-page__security-ring">

              <div className="relic-chamber-page__security-core">
                <LockKeyhole
                  size={43}
                  strokeWidth={0.8}
                />
              </div>

            </div>

            <span>
              Omega Authorization
            </span>

            <strong>
              Locked
            </strong>

            <p>
              Primary vault access remains sealed under direct
              Winter Palace security authority.
            </p>

            <div className="relic-chamber-page__security-bar">
              <span />
            </div>

            <small>
              Security Integrity // 100%
            </small>

          </div>

        </article>

        {/* PROTOCOLS */}
        <article className="relic-chamber-card relic-chamber-card--protocols">

          <div className="relic-chamber-card__header">

            <div>
              <span>Containment Law</span>
              <h2>Vault Protocols</h2>
            </div>

            <Shield size={18} />

          </div>

          <div className="relic-chamber-page__protocols">

            {protocols.map((protocol) => (
              <div
                key={protocol.id}
                className="relic-chamber-page__protocol"
              >

                <span>
                  {protocol.id}
                </span>

                <div>
                  <strong>
                    {protocol.title}
                  </strong>

                  <p>
                    {protocol.text}
                  </p>
                </div>

              </div>
            ))}

          </div>

        </article>

        {/* CROWN AUTHORITY */}
        <article className="relic-chamber-card relic-chamber-card--authority">

          <div className="relic-chamber-card__header">

            <div>
              <span>Supreme Clearance</span>
              <h2>Imperial Authority</h2>
            </div>

            <Crown size={18} />

          </div>

          <div className="relic-chamber-page__authority">

            <div className="relic-chamber-page__authority-seal">

              <Snowflake
                size={41}
                strokeWidth={0.8}
              />

            </div>

            <div>

              <span>
                By Order of Her Majesty
              </span>

              <strong>
                All Artifacts Belong to the Crown
              </strong>

              <p>
                Removal, transfer or examination of restricted
                relics requires direct authorization from
                Winter Palace command.
              </p>

            </div>

          </div>

        </article>

      </section>

    </main>
  );
}

export default RelicVaultChamberPage;