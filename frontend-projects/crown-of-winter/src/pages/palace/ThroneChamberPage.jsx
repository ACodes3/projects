import {
  Crown,
  Snowflake,
  Shield,
  ScrollText,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Gem,
  Users,
} from 'lucide-react';

import { Link } from 'react-router-dom';

import './ThroneChamberPage.css';

const decrees = [
  {
    id: '01',
    title: 'Imperial Sovereignty',
    text: 'All Fatui operations remain subject to the absolute authority of the Crown.',
  },
  {
    id: '02',
    title: 'Northern Security',
    text: 'The borders and internal stability of Snezhnaya are to be preserved without compromise.',
  },
  {
    id: '03',
    title: 'Divine Acquisition',
    text: 'Strategic divine assets remain the highest priority of imperial foreign operations.',
  },
];

const audiences = [
  {
    name: 'Fatui High Command',
    purpose: 'Strategic briefing',
    status: 'Authorized',
  },
  {
    name: 'Imperial Intelligence',
    purpose: 'Classified report',
    status: 'Pending',
  },
  {
    name: 'Northern Military Command',
    purpose: 'Deployment review',
    status: 'Authorized',
  },
];

function ThroneChamberPage() {
  return (
    <main className="throne-page">

      {/* =====================================
          TOP NAVIGATION
      ===================================== */}

      <div className="throne-page__navigation">

        <Link
          to="/palace"
          className="throne-page__back"
        >
          <ChevronLeft size={14} />
          Palace Directory
        </Link>

        <span>
          Sector 01 // Throne Chamber
        </span>

      </div>

      {/* =====================================
          HERO
      ===================================== */}

      <section className="throne-page__hero">

        <img
          src="/images/throne-room.png"
          alt="Imperial throne chamber"
          className="throne-page__hero-image"
        />

        <div className="throne-page__hero-overlay" />

        <div className="throne-page__hero-content">

          <span className="throne-page__eyebrow">
            Seat of Imperial Authority
          </span>

          <h1>
            Throne Chamber
          </h1>

          <p>
            The ceremonial heart of the Winter Palace and
            the supreme seat of the Tsaritsa&apos;s authority.
          </p>

          <div className="throne-page__hero-meta">

            <span>
              <Crown size={13} />
              Her Majesty Present
            </span>

            <span>
              <Shield size={13} />
              Imperial Guard Active
            </span>

            <span>
              <Snowflake size={13} />
              Cryo Seal Stable
            </span>

          </div>

        </div>

        <div className="throne-page__crest">
          <Crown
            size={74}
            strokeWidth={0.65}
          />
        </div>

      </section>

      {/* =====================================
          CHAMBER STATUS
      ===================================== */}

      <section className="throne-page__metrics">

        <article>
          <Crown size={17} />

          <div>
            <span>Royal Presence</span>
            <strong>Confirmed</strong>
          </div>
        </article>

        <article>
          <Shield size={17} />

          <div>
            <span>Guard Detail</span>
            <strong>12 Active</strong>
          </div>
        </article>

        <article>
          <Users size={17} />

          <div>
            <span>Audience Queue</span>
            <strong>03</strong>
          </div>
        </article>

        <article>
          <Gem size={17} />

          <div>
            <span>Throne Seal</span>
            <strong>Absolute</strong>
          </div>
        </article>

      </section>

      {/* =====================================
          MAIN GRID
      ===================================== */}

      <section className="throne-page__grid">

        {/* ROYAL AUTHORITY */}
        <article className="throne-card throne-card--authority">

          <div className="throne-card__header">

            <div>
              <span>Imperial Authority</span>
              <h2>The Crown</h2>
            </div>

            <Crown size={18} />

          </div>

          <div className="throne-page__authority">

            <div className="throne-page__authority-seal">

              <div className="throne-page__authority-inner">
                <Snowflake
                  size={49}
                  strokeWidth={0.8}
                />
              </div>

            </div>

            <span>
              Sovereign of Snezhnaya
            </span>

            <h3>
              The Tsaritsa
            </h3>

            <p>
              Supreme authority of the Winter Palace,
              the Fatui and all imperial operations
              conducted under the Crown of Winter.
            </p>

            <Link
              to="/tsaritsa"
              className="throne-page__authority-link"
            >
              View Royal Profile
              <ChevronRight size={14} />
            </Link>

          </div>

        </article>

        {/* IMPERIAL DECREES */}
        <article className="throne-card throne-card--decrees">

          <div className="throne-card__header">

            <div>
              <span>By Royal Command</span>
              <h2>Active Decrees</h2>
            </div>

            <ScrollText size={18} />

          </div>

          <div className="throne-page__decrees">

            {decrees.map((decree) => (
              <div
                key={decree.id}
                className="throne-page__decree"
              >

                <span>
                  {decree.id}
                </span>

                <div>
                  <strong>
                    {decree.title}
                  </strong>

                  <p>
                    {decree.text}
                  </p>
                </div>

              </div>
            ))}

          </div>

        </article>

        {/* AUDIENCES */}
        <article className="throne-card throne-card--audiences">

          <div className="throne-card__header">

            <div>
              <span>Royal Schedule</span>
              <h2>Audience Register</h2>
            </div>

            <Users size={18} />

          </div>

          <div className="throne-page__audiences">

            {audiences.map((audience) => (
              <div
                key={audience.name}
                className="throne-page__audience"
              >

                <div>
                  <strong>
                    {audience.name}
                  </strong>

                  <span>
                    {audience.purpose}
                  </span>
                </div>

                <small
                  className={
                    audience.status === 'Authorized'
                      ? 'throne-page__audience-status throne-page__audience-status--authorized'
                      : 'throne-page__audience-status throne-page__audience-status--pending'
                  }
                >
                  {audience.status}
                </small>

              </div>
            ))}

          </div>

        </article>

        {/* CHAMBER SEAL */}
        <article className="throne-card throne-card--seal">

          <div className="throne-card__header">

            <div>
              <span>Palace Protection</span>
              <h2>Royal Cryo Seal</h2>
            </div>

            <Sparkles size={18} />

          </div>

          <div className="throne-page__seal">

            <div className="throne-page__seal-symbol">
              <Snowflake
                size={45}
                strokeWidth={0.8}
              />
            </div>

            <strong>
              Absolute
            </strong>

            <span>
              Chamber protection active
            </span>

            <div className="throne-page__seal-bar">
              <span />
            </div>

            <small>
              Integrity // 100%
            </small>

          </div>

        </article>

      </section>

    </main>
  );
}

export default ThroneChamberPage;