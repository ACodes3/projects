import {
  AlertTriangle,
  Atom,
  ChevronLeft,
  ChevronRight,
  Crown,
  Gem,
  LockKeyhole,
  Shield,
  Snowflake,
  Sparkles,
  Waves,
} from 'lucide-react';

import { Link } from 'react-router-dom';

import './GnosisChamberPage.css';

const conduits = [
  {
    id: 'I',
    element: 'Anemo',
    status: 'Secured',
    resonance: '72%',
  },
  {
    id: 'II',
    element: 'Geo',
    status: 'Secured',
    resonance: '81%',
  },
  {
    id: 'III',
    element: 'Electro',
    status: 'Secured',
    resonance: '68%',
  },
  {
    id: 'IV',
    element: 'Dendro',
    status: 'Secured',
    resonance: '76%',
  },
  {
    id: 'V',
    element: 'Hydro',
    status: 'Acquisition',
    resonance: '41%',
  },
  {
    id: 'VI',
    element: 'Pyro',
    status: 'Contested',
    resonance: '19%',
  },
  {
    id: 'VII',
    element: 'Cryo',
    status: 'Sovereign',
    resonance: '100%',
  },
];

const protocols = [
  {
    id: '01',
    title: 'Absolute Clearance',
    text: 'Entry beyond the primary seal requires direct authorization from the Crown.',
  },
  {
    id: '02',
    title: 'Divine Isolation',
    text: 'All contained divine signatures remain separated by independent Cryo barriers.',
  },
  {
    id: '03',
    title: 'Catastrophic Seal',
    text: 'Any containment breach triggers full chamber isolation from the Winter Palace.',
  },
];

function GnosisChamberPage() {
  return (
    <main className="gnosis-chamber-page">

      {/* =====================================
          NAVIGATION
      ===================================== */}

      <div className="gnosis-chamber-page__navigation">

        <Link
          to="/palace"
          className="gnosis-chamber-page__back"
        >
          <ChevronLeft size={14} />
          Palace Directory
        </Link>

        <span>
          Sector 07 // Gnosis Chamber
        </span>

      </div>

      {/* =====================================
          HERO
      ===================================== */}

      <section className="gnosis-chamber-page__hero">

        <div className="gnosis-chamber-page__hero-background">

          <div className="gnosis-chamber-page__hero-orbit">

            <span className="gnosis-chamber-page__hero-node gnosis-chamber-page__hero-node--1" />
            <span className="gnosis-chamber-page__hero-node gnosis-chamber-page__hero-node--2" />
            <span className="gnosis-chamber-page__hero-node gnosis-chamber-page__hero-node--3" />
            <span className="gnosis-chamber-page__hero-node gnosis-chamber-page__hero-node--4" />
            <span className="gnosis-chamber-page__hero-node gnosis-chamber-page__hero-node--5" />
            <span className="gnosis-chamber-page__hero-node gnosis-chamber-page__hero-node--6" />
            <span className="gnosis-chamber-page__hero-node gnosis-chamber-page__hero-node--7" />

            <div className="gnosis-chamber-page__hero-core">
              <Crown
                size={54}
                strokeWidth={0.65}
              />
            </div>

          </div>

        </div>

        <div className="gnosis-chamber-page__hero-overlay" />

        <div className="gnosis-chamber-page__hero-content">

          <span className="gnosis-chamber-page__eyebrow">
            Omega Clearance // Divine Containment
          </span>

          <h1>
            Gnosis Chamber
          </h1>

          <p>
            The deepest sealed chamber beneath the Winter Palace,
            dedicated to the containment, study and synchronization
            of divine elemental authority.
          </p>

          <div className="gnosis-chamber-page__hero-meta">

            <span>
              <LockKeyhole size={13} />
              Omega Seal Active
            </span>

            <span>
              <Shield size={13} />
              Divine Isolation Stable
            </span>

            <span>
              <Snowflake size={13} />
              Crown Authority Only
            </span>

          </div>

        </div>

      </section>

      {/* =====================================
          METRICS
      ===================================== */}

      <section className="gnosis-chamber-page__metrics">

        <article>
          <Gem size={17} />

          <div>
            <span>Elemental Conduits</span>
            <strong>07</strong>
          </div>
        </article>

        <article>
          <Shield size={17} />

          <div>
            <span>Secured Signatures</span>
            <strong>04</strong>
          </div>
        </article>

        <article>
          <Waves size={17} />

          <div>
            <span>Chamber Resonance</span>
            <strong>81%</strong>
          </div>
        </article>

        <article>
          <AlertTriangle size={17} />

          <div>
            <span>Unstable Conduits</span>
            <strong>02</strong>
          </div>
        </article>

      </section>

      {/* =====================================
          MAIN GRID
      ===================================== */}

      <section className="gnosis-chamber-page__grid">

        {/* DIVINE ARRAY */}
        <article className="gnosis-chamber-card gnosis-chamber-card--array">

          <div className="gnosis-chamber-card__header">

            <div>
              <span>Divine Synchronization</span>
              <h2>Sevenfold Array</h2>
            </div>

            <Atom size={18} />

          </div>

          <div className="gnosis-chamber-page__array">

            <div className="gnosis-chamber-page__array-ring">

              <div className="gnosis-chamber-page__array-center">

                <div className="gnosis-chamber-page__array-core">
                  <Crown
                    size={38}
                    strokeWidth={0.75}
                  />
                </div>

                <span>
                  Crown Nexus
                </span>

              </div>

              {conduits.map((conduit, index) => (
                <div
                  key={conduit.id}
                  className={`gnosis-chamber-page__array-node gnosis-chamber-page__array-node--${index + 1}`}
                >

                  <div>
                    <Sparkles
                      size={14}
                      strokeWidth={1}
                    />
                  </div>

                  <span>
                    {conduit.id}
                  </span>

                </div>
              ))}

            </div>

            <Link
              to="/gnoses"
              className="gnosis-chamber-page__array-link"
            >
              Open Project: Gnoses
              <ChevronRight size={14} />
            </Link>

          </div>

        </article>

        {/* CONDUIT STATUS */}
        <article className="gnosis-chamber-card gnosis-chamber-card--conduits">

          <div className="gnosis-chamber-card__header">

            <div>
              <span>Elemental Network</span>
              <h2>Conduit Status</h2>
            </div>

            <Gem size={18} />

          </div>

          <div className="gnosis-chamber-page__conduits">

            {conduits.map((conduit) => (
              <div
                key={conduit.id}
                className="gnosis-chamber-page__conduit"
              >

                <span className="gnosis-chamber-page__conduit-id">
                  {conduit.id}
                </span>

                <div>

                  <strong>
                    {conduit.element}
                  </strong>

                  <span>
                    Resonance // {conduit.resonance}
                  </span>

                </div>

                <small
                  className={`gnosis-chamber-page__conduit-status gnosis-chamber-page__conduit-status--${conduit.status.toLowerCase()}`}
                >
                  {conduit.status}
                </small>

              </div>
            ))}

          </div>

        </article>

        {/* CENTRAL CONTAINMENT */}
        <article className="gnosis-chamber-card gnosis-chamber-card--containment">

          <div className="gnosis-chamber-card__header">

            <div>
              <span>Primary Seal</span>
              <h2>Divine Containment</h2>
            </div>

            <LockKeyhole size={18} />

          </div>

          <div className="gnosis-chamber-page__containment">

            <div className="gnosis-chamber-page__containment-ring">

              <div className="gnosis-chamber-page__containment-core">
                <Snowflake
                  size={49}
                  strokeWidth={0.7}
                />
              </div>

            </div>

            <span>
              Chamber State
            </span>

            <strong>
              Absolute Seal
            </strong>

            <p>
              Divine resonance remains isolated beneath
              continuous Cryo suppression.
            </p>

            <div className="gnosis-chamber-page__containment-bar">
              <span />
            </div>

            <small>
              Integrity // 100%
            </small>

          </div>

        </article>

        {/* PROTOCOLS */}
        <article className="gnosis-chamber-card gnosis-chamber-card--protocols">

          <div className="gnosis-chamber-card__header">

            <div>
              <span>Omega Security</span>
              <h2>Containment Protocols</h2>
            </div>

            <Shield size={18} />

          </div>

          <div className="gnosis-chamber-page__protocols">

            {protocols.map((protocol) => (
              <div
                key={protocol.id}
                className="gnosis-chamber-page__protocol"
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

        {/* ROYAL AUTHORITY */}
        <article className="gnosis-chamber-card gnosis-chamber-card--authority">

          <div className="gnosis-chamber-card__header">

            <div>
              <span>Supreme Directive</span>
              <h2>Authority of the Crown</h2>
            </div>

            <Crown size={18} />

          </div>

          <div className="gnosis-chamber-page__authority">

            <div className="gnosis-chamber-page__authority-seal">

              <Crown
                size={40}
                strokeWidth={0.75}
              />

            </div>

            <div>

              <span>
                Omega Directive
              </span>

              <strong>
                Divine Authority Serves the Crown
              </strong>

              <p>
                All acquisitions, containment procedures and
                divine research conducted within this chamber
                remain under the exclusive authority of Her Majesty.
              </p>

            </div>

          </div>

        </article>

      </section>

    </main>
  );
}

export default GnosisChamberPage;