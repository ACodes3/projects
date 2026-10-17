import {
  Map,
  Crown,
  Shield,
  Swords,
  Users,
  Radio,
  Target,
  ChevronLeft,
  ChevronRight,
  Snowflake,
  Crosshair,
  AlertTriangle,
} from 'lucide-react';

import { Link } from 'react-router-dom';

import './WarChamberPage.css';

const operations = [
  {
    id: '01',
    title: 'Operation Pale Crown',
    region: 'Fontaine',
    commander: 'Imperial Command',
    status: 'Active',
  },
  {
    id: '02',
    title: 'Operation White Silence',
    region: 'Natlan',
    commander: 'Field Division VII',
    status: 'Critical',
  },
  {
    id: '03',
    title: 'Operation Frozen Hand',
    region: 'Liyue',
    commander: 'Diplomatic Corps',
    status: 'Monitoring',
  },
];

const divisions = [
  {
    name: 'Northern Command',
    forces: '18,420',
    status: 'Ready',
  },
  {
    name: 'Foreign Operations',
    forces: '8,960',
    status: 'Deployed',
  },
  {
    name: 'Palace Guard',
    forces: '2,140',
    status: 'Active',
  },
];

function WarChamberPage() {
  return (
    <main className="war-chamber-page">

      {/* =====================================
          NAVIGATION
      ===================================== */}

      <div className="war-chamber-page__navigation">

        <Link
          to="/palace"
          className="war-chamber-page__back"
        >
          <ChevronLeft size={14} />
          Palace Directory
        </Link>

        <span>
          Sector 02 // War Chamber
        </span>

      </div>

      {/* =====================================
          HERO
      ===================================== */}

      <section className="war-chamber-page__hero">

        <div className="war-chamber-page__hero-bg">

          <div className="war-chamber-page__hero-grid" />

          <div className="war-chamber-page__hero-ring">
            <Snowflake
              size={105}
              strokeWidth={0.45}
            />
          </div>

        </div>

        <div className="war-chamber-page__hero-overlay" />

        <div className="war-chamber-page__hero-content">

          <span className="war-chamber-page__eyebrow">
            Imperial Strategic Command
          </span>

          <h1>
            War Chamber
          </h1>

          <p>
            The principal military planning chamber of the Winter Palace,
            where Fatui campaigns and regional deployments are reviewed
            beneath the authority of the Crown.
          </p>

          <div className="war-chamber-page__hero-meta">

            <span>
              <Radio size={13} />
              Command Network Live
            </span>

            <span>
              <Shield size={13} />
              Chamber Secured
            </span>

            <span>
              <Crosshair size={13} />
              Operations Active
            </span>

          </div>

        </div>

        <div className="war-chamber-page__crest">
          <Swords
            size={64}
            strokeWidth={0.65}
          />
        </div>

      </section>

      {/* =====================================
          METRICS
      ===================================== */}

      <section className="war-chamber-page__metrics">

        <article>
          <Swords size={17} />

          <div>
            <span>Active Campaigns</span>
            <strong>24</strong>
          </div>
        </article>

        <article>
          <Users size={17} />

          <div>
            <span>Deployed Forces</span>
            <strong>32,840</strong>
          </div>
        </article>

        <article>
          <Target size={17} />

          <div>
            <span>Priority Targets</span>
            <strong>07</strong>
          </div>
        </article>

        <article>
          <AlertTriangle size={17} />

          <div>
            <span>Critical Zones</span>
            <strong>02</strong>
          </div>
        </article>

      </section>

      {/* =====================================
          MAIN CONTENT
      ===================================== */}

      <section className="war-chamber-page__grid">

        {/* STRATEGY TABLE */}
        <article className="war-chamber-card war-chamber-card--table">

          <div className="war-chamber-card__header">

            <div>
              <span>Central Command</span>
              <h2>Imperial Strategy Table</h2>
            </div>

            <Map size={18} />

          </div>

          <div className="war-chamber-page__table">

            <div className="war-chamber-page__table-grid" />

            <div className="war-chamber-page__table-ring">

              <div className="war-chamber-page__table-core">
                <Snowflake
                  size={52}
                  strokeWidth={0.65}
                />
              </div>

            </div>

            <span className="war-chamber-page__table-node war-chamber-page__table-node--1" />
            <span className="war-chamber-page__table-node war-chamber-page__table-node--2" />
            <span className="war-chamber-page__table-node war-chamber-page__table-node--3" />
            <span className="war-chamber-page__table-node war-chamber-page__table-node--4" />
            <span className="war-chamber-page__table-node war-chamber-page__table-node--5" />

            <Link
              to="/war-table"
              className="war-chamber-page__table-link"
            >
              Open Strategic War Table
              <ChevronRight size={14} />
            </Link>

          </div>

        </article>

        {/* ACTIVE OPERATIONS */}
        <article className="war-chamber-card war-chamber-card--operations">

          <div className="war-chamber-card__header">

            <div>
              <span>Current Campaigns</span>
              <h2>Active Operations</h2>
            </div>

            <Crosshair size={18} />

          </div>

          <div className="war-chamber-page__operations">

            {operations.map((operation) => (
              <div
                key={operation.id}
                className="war-chamber-page__operation"
              >

                <span className="war-chamber-page__operation-number">
                  {operation.id}
                </span>

                <div className="war-chamber-page__operation-content">

                  <span>
                    {operation.region}
                  </span>

                  <strong>
                    {operation.title}
                  </strong>

                  <small>
                    {operation.commander}
                  </small>

                </div>

                <span
                  className={`war-chamber-page__operation-status war-chamber-page__operation-status--${operation.status.toLowerCase()}`}
                >
                  {operation.status}
                </span>

              </div>
            ))}

          </div>

        </article>

        {/* FORCE DEPLOYMENT */}
        <article className="war-chamber-card war-chamber-card--forces">

          <div className="war-chamber-card__header">

            <div>
              <span>Fatui Forces</span>
              <h2>Division Status</h2>
            </div>

            <Users size={18} />

          </div>

          <div className="war-chamber-page__forces">

            {divisions.map((division) => (
              <div
                key={division.name}
                className="war-chamber-page__force"
              >

                <div>

                  <strong>
                    {division.name}
                  </strong>

                  <span>
                    {division.forces} Personnel
                  </span>

                </div>

                <small>
                  {division.status}
                </small>

              </div>
            ))}

          </div>

        </article>

        {/* ROYAL COMMAND */}
        <article className="war-chamber-card war-chamber-card--directive">

          <div className="war-chamber-card__header">

            <div>
              <span>Supreme Authority</span>
              <h2>Royal Directive</h2>
            </div>

            <Crown size={18} />

          </div>

          <div className="war-chamber-page__directive">

            <div className="war-chamber-page__directive-seal">

              <Crown
                size={35}
                strokeWidth={0.8}
              />

            </div>

            <div>

              <span>
                By Order of the Crown
              </span>

              <strong>
                Maintain Imperial Readiness
              </strong>

              <p>
                All Fatui divisions are to preserve operational
                readiness while foreign campaigns remain active.
                Strategic escalation requires authorization from
                Winter Palace High Command.
              </p>

            </div>

          </div>

        </article>

      </section>

    </main>
  );
}

export default WarChamberPage;