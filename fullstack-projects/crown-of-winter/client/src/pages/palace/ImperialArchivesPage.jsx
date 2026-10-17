import {
  Archive,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  LockKeyhole,
  ScrollText,
  Shield,
  Snowflake,
} from 'lucide-react';

import { Link } from 'react-router-dom';

import './ImperialArchivesPage.css';

const collections = [
  {
    id: '01',
    title: 'Imperial Chronicles',
    subtitle: 'Historical Records',
    records: '4,821',
    clearance: 'Open',
    icon: BookOpen,
  },
  {
    id: '02',
    title: 'Fatui Operations',
    subtitle: 'Military Archives',
    records: '2,460',
    clearance: 'Imperial',
    icon: Shield,
  },
  {
    id: '03',
    title: 'Foreign Intelligence',
    subtitle: 'Surveillance Records',
    records: '8,194',
    clearance: 'Crimson',
    icon: FileText,
  },
  {
    id: '04',
    title: 'Divine Records',
    subtitle: 'Restricted Theology',
    records: '317',
    clearance: 'Omega',
    icon: Snowflake,
  },
];

const retrievals = [
  {
    id: 'AR-8291',
    title: 'Fontaine Political Dossier',
    requestedBy: 'Imperial Intelligence',
    status: 'Approved',
  },
  {
    id: 'AR-8292',
    title: 'Northern Campaign Records',
    requestedBy: 'Military Command',
    status: 'Retrieving',
  },
  {
    id: 'AR-8293',
    title: 'Divine Artifact Index',
    requestedBy: 'Project: Gnoses',
    status: 'Restricted',
  },
];

const sealedRecords = [
  {
    title: 'Pre-Imperial Snezhnaya',
    classification: 'Crimson',
  },
  {
    title: 'First Harbinger Directives',
    classification: 'Omega',
  },
  {
    title: 'Celestial Contact Records',
    classification: 'Absolute',
  },
];

function ImperialArchivesPage() {
  return (
    <main className="imperial-archives-page">

      {/* =====================================
          NAVIGATION
      ===================================== */}

      <div className="imperial-archives-page__navigation">

        <Link
          to="/palace"
          className="imperial-archives-page__back"
        >
          <ChevronLeft size={14} />
          Palace Directory
        </Link>

        <span>
          Sector 04 // Imperial Archives
        </span>

      </div>

      {/* =====================================
          HERO
      ===================================== */}

      <section className="imperial-archives-page__hero">

        <div className="imperial-archives-page__hero-background">

          <div className="imperial-archives-page__archive-lines" />

          <div className="imperial-archives-page__archive-seal">
            <Archive
              size={74}
              strokeWidth={0.6}
            />
          </div>

        </div>

        <div className="imperial-archives-page__hero-overlay" />

        <div className="imperial-archives-page__hero-content">

          <span className="imperial-archives-page__eyebrow">
            Winter Palace Historical Repository
          </span>

          <h1>
            Imperial Archives
          </h1>

          <p>
            The preserved memory of Snezhnaya: imperial decrees,
            intelligence records, campaign histories and sealed
            documents maintained beneath the Winter Palace.
          </p>

          <div className="imperial-archives-page__hero-meta">

            <span>
              <Archive size={13} />
              Archive Core Online
            </span>

            <span>
              <LockKeyhole size={13} />
              Restricted Sectors Sealed
            </span>

            <span>
              <Snowflake size={13} />
              Preservation Stable
            </span>

          </div>

        </div>

      </section>

      {/* =====================================
          METRICS
      ===================================== */}

      <section className="imperial-archives-page__metrics">

        <article>
          <FileText size={17} />

          <div>
            <span>Total Records</span>
            <strong>15,792</strong>
          </div>
        </article>

        <article>
          <LockKeyhole size={17} />

          <div>
            <span>Restricted Files</span>
            <strong>1,248</strong>
          </div>
        </article>

        <article>
          <Clock3 size={17} />

          <div>
            <span>Retrieval Queue</span>
            <strong>03</strong>
          </div>
        </article>

        <article>
          <Shield size={17} />

          <div>
            <span>Archive Integrity</span>
            <strong>100%</strong>
          </div>
        </article>

      </section>

      {/* =====================================
          MAIN GRID
      ===================================== */}

      <section className="imperial-archives-page__grid">

        {/* ARCHIVE COLLECTIONS */}
        <article className="imperial-archives-card imperial-archives-card--collections">

          <div className="imperial-archives-card__header">

            <div>
              <span>Primary Repository</span>
              <h2>Archive Collections</h2>
            </div>

            <Archive size={18} />

          </div>

          <div className="imperial-archives-page__collections">

            {collections.map((collection) => {
              const Icon = collection.icon;

              return (
                <div
                  key={collection.id}
                  className="imperial-archives-page__collection"
                >

                  <div className="imperial-archives-page__collection-icon">
                    <Icon
                      size={22}
                      strokeWidth={1}
                    />
                  </div>

                  <div className="imperial-archives-page__collection-content">

                    <span>
                      {collection.subtitle}
                    </span>

                    <strong>
                      {collection.title}
                    </strong>

                    <small>
                      {collection.records} Records
                    </small>

                  </div>

                  <span
                    className={`imperial-archives-page__clearance imperial-archives-page__clearance--${collection.clearance.toLowerCase()}`}
                  >
                    {collection.clearance}
                  </span>

                </div>
              );
            })}

          </div>

          <Link
            to="/intelligence"
            className="imperial-archives-page__archive-link"
          >
            Open Intelligence Archive
            <ChevronRight size={14} />
          </Link>

        </article>

        {/* RETRIEVAL QUEUE */}
        <article className="imperial-archives-card imperial-archives-card--retrievals">

          <div className="imperial-archives-card__header">

            <div>
              <span>Archivist Network</span>
              <h2>Retrieval Queue</h2>
            </div>

            <ScrollText size={18} />

          </div>

          <div className="imperial-archives-page__retrievals">

            {retrievals.map((request) => (
              <div
                key={request.id}
                className="imperial-archives-page__retrieval"
              >

                <span className="imperial-archives-page__retrieval-id">
                  {request.id}
                </span>

                <div>

                  <strong>
                    {request.title}
                  </strong>

                  <span>
                    {request.requestedBy}
                  </span>

                </div>

                <small
                  className={`imperial-archives-page__retrieval-status imperial-archives-page__retrieval-status--${request.status.toLowerCase()}`}
                >
                  {request.status}
                </small>

              </div>
            ))}

          </div>

        </article>

        {/* SEALED RECORDS */}
        <article className="imperial-archives-card imperial-archives-card--sealed">

          <div className="imperial-archives-card__header">

            <div>
              <span>Restricted Repository</span>
              <h2>Sealed Records</h2>
            </div>

            <LockKeyhole size={18} />

          </div>

          <div className="imperial-archives-page__sealed">

            <div className="imperial-archives-page__sealed-symbol">

              <LockKeyhole
                size={38}
                strokeWidth={0.8}
              />

            </div>

            <div className="imperial-archives-page__sealed-list">

              {sealedRecords.map((record) => (
                <div
                  key={record.title}
                  className="imperial-archives-page__sealed-record"
                >

                  <span>
                    {record.title}
                  </span>

                  <strong
                    className={`imperial-archives-page__sealed-classification imperial-archives-page__sealed-classification--${record.classification.toLowerCase()}`}
                  >
                    {record.classification}
                  </strong>

                </div>
              ))}

            </div>

          </div>

        </article>

        {/* PRESERVATION CORE */}
        <article className="imperial-archives-card imperial-archives-card--preservation">

          <div className="imperial-archives-card__header">

            <div>
              <span>Cryo Preservation</span>
              <h2>Archive Integrity</h2>
            </div>

            <Snowflake size={18} />

          </div>

          <div className="imperial-archives-page__preservation">

            <div className="imperial-archives-page__preservation-ring">

              <Snowflake
                size={44}
                strokeWidth={0.8}
              />

            </div>

            <div>

              <span>
                Preservation Network
              </span>

              <strong>
                Stable
              </strong>

              <p>
                Cryo-regulated chambers maintain precise
                temperature and humidity conditions across
                all historical repositories.
              </p>

            </div>

            <div className="imperial-archives-page__preservation-bar">
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

export default ImperialArchivesPage;