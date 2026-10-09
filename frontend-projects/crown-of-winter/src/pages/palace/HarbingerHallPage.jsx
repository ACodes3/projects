import {
  Crown,
  Users,
  Shield,
  Snowflake,
  ChevronLeft,
  ChevronRight,
  ScrollText,
  Eye,
  Swords,
  Gem,
} from 'lucide-react';

import { Link } from 'react-router-dom';

import './HarbingerHallPage.css';

const seats = [
  {
    number: '01',
    title: 'The Jester',
    codename: 'Pierro',
    status: 'Present',
  },
  {
    number: '02',
    title: 'The Captain',
    codename: 'Capitano',
    status: 'Deployed',
  },
  {
    number: '03',
    title: 'The Doctor',
    codename: 'Dottore',
    status: 'Classified',
  },
  {
    number: '04',
    title: 'Damselette',
    codename: 'Columbina',
    status: 'Present',
  },
  {
    number: '05',
    title: 'The Knave',
    codename: 'Arlecchino',
    status: 'Active',
  },
  {
    number: '06',
    title: 'The Rooster',
    codename: 'Pulcinella',
    status: 'Present',
  },
  {
    number: '07',
    title: 'The Balladeer',
    codename: 'Scaramouche',
    status: 'Archived',
  },
  {
    number: '08',
    title: 'Marionette',
    codename: 'Sandrone',
    status: 'Research',
  },
  {
    number: '09',
    title: 'The Fair Lady',
    codename: 'Signora',
    status: 'Sealed',
  },
  {
    number: '10',
    title: 'The Regrator',
    codename: 'Pantalone',
    status: 'Present',
  },
  {
    number: '11',
    title: 'Childe',
    codename: 'Tartaglia',
    status: 'Deployed',
  },
];

const agenda = [
  {
    id: '01',
    title: 'Southern Theatre',
    description:
      'Review ongoing military escalation and resource allocation in Natlan.',
    classification: 'Crimson',
  },
  {
    id: '02',
    title: 'Divine Asset Acquisition',
    description:
      'Assess current progress of Project: Gnoses and foreign operations.',
    classification: 'Omega',
  },
  {
    id: '03',
    title: 'Palace Security',
    description:
      'Evaluate internal security protocols and intelligence integrity.',
    classification: 'Imperial',
  },
];

function HarbingerHallPage() {
  return (
    <main className="harbinger-hall-page">

      {/* =====================================
          NAVIGATION
      ===================================== */}

      <div className="harbinger-hall-page__navigation">

        <Link
          to="/palace"
          className="harbinger-hall-page__back"
        >
          <ChevronLeft size={14} />
          Palace Directory
        </Link>

        <span>
          Sector 03 // Harbinger Hall
        </span>

      </div>

      {/* =====================================
          HERO
      ===================================== */}

      <section className="harbinger-hall-page__hero">

        <div className="harbinger-hall-page__hero-background">

          <div className="harbinger-hall-page__hero-ring" />

          <div className="harbinger-hall-page__hero-center">
            <Crown
              size={68}
              strokeWidth={0.6}
            />
          </div>

        </div>

        <div className="harbinger-hall-page__hero-overlay" />

        <div className="harbinger-hall-page__hero-content">

          <span className="harbinger-hall-page__eyebrow">
            Fatui High Council
          </span>

          <h1>
            Harbinger Hall
          </h1>

          <p>
            The sealed council chamber reserved for the Eleven
            Fatui Harbingers and matters of supreme imperial importance.
          </p>

          <div className="harbinger-hall-page__hero-meta">

            <span>
              <Shield size={13} />
              Council Seal Active
            </span>

            <span>
              <Users size={13} />
              XI Seats Registered
            </span>

            <span>
              <Snowflake size={13} />
              Crown Authority
            </span>

          </div>

        </div>

      </section>

      {/* =====================================
          METRICS
      ===================================== */}

      <section className="harbinger-hall-page__metrics">

        <article>
          <Users size={17} />

          <div>
            <span>Registered Seats</span>
            <strong>XI</strong>
          </div>
        </article>

        <article>
          <Crown size={17} />

          <div>
            <span>Present Members</span>
            <strong>04</strong>
          </div>
        </article>

        <article>
          <Swords size={17} />

          <div>
            <span>Deployed</span>
            <strong>02</strong>
          </div>
        </article>

        <article>
          <ScrollText size={17} />

          <div>
            <span>Active Agenda</span>
            <strong>03</strong>
          </div>
        </article>

      </section>

      {/* =====================================
          MAIN AREA
      ===================================== */}

      <section className="harbinger-hall-page__grid">

        {/* COUNCIL CHAMBER */}
        <article className="harbinger-hall-card harbinger-hall-card--council">

          <div className="harbinger-hall-card__header">

            <div>
              <span>Council Chamber</span>
              <h2>The Eleven Seats</h2>
            </div>

            <Users size={18} />

          </div>

          <div className="harbinger-hall-page__council">

            <div className="harbinger-hall-page__council-ring">

              <div className="harbinger-hall-page__council-center">

                <div className="harbinger-hall-page__crown-seat">
                  <Crown
                    size={36}
                    strokeWidth={0.8}
                  />
                </div>

                <span>
                  Crown
                </span>

              </div>

              {seats.map((seat, index) => (
                <div
                  key={seat.codename}
                  className={`harbinger-hall-page__seat harbinger-hall-page__seat--${index + 1}`}
                >

                  <div className="harbinger-hall-page__seat-icon">
                    <Gem
                      size={14}
                      strokeWidth={1}
                    />
                  </div>

                  <span>
                    {seat.number}
                  </span>

                </div>
              ))}

            </div>

            <Link
              to="/harbingers"
              className="harbinger-hall-page__council-link"
            >
              Open Harbinger Command Roster
              <ChevronRight size={14} />
            </Link>

          </div>

        </article>

        {/* ATTENDANCE */}
        <article className="harbinger-hall-card harbinger-hall-card--attendance">

          <div className="harbinger-hall-card__header">

            <div>
              <span>Council Register</span>
              <h2>Seat Status</h2>
            </div>

            <Eye size={18} />

          </div>

          <div className="harbinger-hall-page__attendance">

            {seats.map((seat) => (
              <div
                key={seat.number}
                className="harbinger-hall-page__member"
              >

                <span className="harbinger-hall-page__member-number">
                  {seat.number}
                </span>

                <div>
                  <strong>
                    {seat.codename}
                  </strong>

                  <span>
                    {seat.title}
                  </span>
                </div>

                <small
                  className={`harbinger-hall-page__member-status harbinger-hall-page__member-status--${seat.status
                    .toLowerCase()
                    .replace(' ', '-')}`}
                >
                  {seat.status}
                </small>

              </div>
            ))}

          </div>

        </article>

        {/* AGENDA */}
        <article className="harbinger-hall-card harbinger-hall-card--agenda">

          <div className="harbinger-hall-card__header">

            <div>
              <span>Current Session</span>
              <h2>Council Agenda</h2>
            </div>

            <ScrollText size={18} />

          </div>

          <div className="harbinger-hall-page__agenda">

            {agenda.map((item) => (
              <div
                key={item.id}
                className="harbinger-hall-page__agenda-item"
              >

                <span className="harbinger-hall-page__agenda-number">
                  {item.id}
                </span>

                <div>
                  <strong>
                    {item.title}
                  </strong>

                  <p>
                    {item.description}
                  </p>
                </div>

                <small
                  className={`harbinger-hall-page__classification harbinger-hall-page__classification--${item.classification.toLowerCase()}`}
                >
                  {item.classification}
                </small>

              </div>
            ))}

          </div>

        </article>

        {/* AUTHORITY */}
        <article className="harbinger-hall-card harbinger-hall-card--authority">

          <div className="harbinger-hall-card__header">

            <div>
              <span>Supreme Authority</span>
              <h2>Council Mandate</h2>
            </div>

            <Crown size={18} />

          </div>

          <div className="harbinger-hall-page__authority">

            <div className="harbinger-hall-page__authority-seal">

              <Snowflake
                size={42}
                strokeWidth={0.8}
              />

            </div>

            <div>
              <span>
                By Authority of Her Majesty
              </span>

              <strong>
                The Harbingers Execute the Will of the Crown
              </strong>

              <p>
                Council decisions remain subordinate to the
                sovereign authority of the Tsaritsa and may
                be overridden by direct imperial command.
              </p>
            </div>

          </div>

        </article>

      </section>

    </main>
  );
}

export default HarbingerHallPage;