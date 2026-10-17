import {
  ChevronLeft,
  ChevronRight,
  Crown,
  Feather,
  FileSignature,
  LockKeyhole,
  ScrollText,
  Shield,
  Snowflake,
  Stamp,
  Users,
} from 'lucide-react';

import { Link } from 'react-router-dom';

import './RoyalRecordsPage.css';

const decrees = [
  {
    id: 'RR-001',
    title: 'Imperial Sovereignty Act',
    category: 'Royal Decree',
    issued: 'Winter Cycle 118',
    status: 'Active',
  },
  {
    id: 'RR-002',
    title: 'Northern Defense Mandate',
    category: 'Military Directive',
    issued: 'Winter Cycle 121',
    status: 'Active',
  },
  {
    id: 'RR-003',
    title: 'Foreign Operations Charter',
    category: 'Diplomatic Order',
    issued: 'Winter Cycle 124',
    status: 'Sealed',
  },
  {
    id: 'RR-004',
    title: 'Divine Acquisition Directive',
    category: 'Omega Decree',
    issued: 'Winter Cycle 125',
    status: 'Restricted',
  },
];

const signatures = [
  {
    name: 'The Tsaritsa',
    authority: 'Sovereign Authority',
    status: 'Verified',
  },
  {
    name: 'Imperial Chancellery',
    authority: 'Administrative Seal',
    status: 'Verified',
  },
  {
    name: 'Fatui High Command',
    authority: 'Military Authentication',
    status: 'Verified',
  },
];

const registry = [
  {
    id: '01',
    title: 'Imperial Decrees',
    count: '428',
  },
  {
    id: '02',
    title: 'Diplomatic Orders',
    count: '196',
  },
  {
    id: '03',
    title: 'Military Mandates',
    count: '371',
  },
  {
    id: '04',
    title: 'Sealed Directives',
    count: '089',
  },
];

function RoyalRecordsPage() {
  return (
    <main className="royal-records-page">

      {/* =====================================
          NAVIGATION
      ===================================== */}

      <div className="royal-records-page__navigation">

        <Link
          to="/palace"
          className="royal-records-page__back"
        >
          <ChevronLeft size={14} />
          Palace Directory
        </Link>

        <span>
          Sector 08 // Royal Records
        </span>

      </div>

      {/* =====================================
          HERO
      ===================================== */}

      <section className="royal-records-page__hero">

        <div className="royal-records-page__hero-background">

          <div className="royal-records-page__document-lines" />

          <div className="royal-records-page__royal-seal">

            <Crown
              size={58}
              strokeWidth={0.65}
            />

          </div>

        </div>

        <div className="royal-records-page__hero-overlay" />

        <div className="royal-records-page__hero-content">

          <span className="royal-records-page__eyebrow">
            Imperial Chancellery
          </span>

          <h1>
            Royal Records
          </h1>

          <p>
            The official registry of the Crown, preserving imperial
            decrees, military mandates, diplomatic orders and sealed
            directives issued under the authority of Her Majesty.
          </p>

          <div className="royal-records-page__hero-meta">

            <span>
              <Crown size={13} />
              Crown Authority Active
            </span>

            <span>
              <FileSignature size={13} />
              Registry Verified
            </span>

            <span>
              <LockKeyhole size={13} />
              Restricted Records Sealed
            </span>

          </div>

        </div>

      </section>

      {/* =====================================
          METRICS
      ===================================== */}

      <section className="royal-records-page__metrics">

        <article>
          <ScrollText size={17} />

          <div>
            <span>Total Directives</span>
            <strong>1,084</strong>
          </div>
        </article>

        <article>
          <Stamp size={17} />

          <div>
            <span>Active Decrees</span>
            <strong>247</strong>
          </div>
        </article>

        <article>
          <LockKeyhole size={17} />

          <div>
            <span>Sealed Records</span>
            <strong>089</strong>
          </div>
        </article>

        <article>
          <Shield size={17} />

          <div>
            <span>Registry Integrity</span>
            <strong>100%</strong>
          </div>
        </article>

      </section>

      {/* =====================================
          MAIN GRID
      ===================================== */}

      <section className="royal-records-page__grid">

        {/* =====================================
            ACTIVE DECREES
        ===================================== */}

        <article className="royal-records-card royal-records-card--decrees">

          <div className="royal-records-card__header">

            <div>
              <span>Current Authority</span>
              <h2>Imperial Decrees</h2>
            </div>

            <ScrollText size={18} />

          </div>

          <div className="royal-records-page__decrees">

            {decrees.map((decree) => (
              <div
                key={decree.id}
                className="royal-records-page__decree"
              >

                <span className="royal-records-page__decree-id">
                  {decree.id}
                </span>

                <div className="royal-records-page__decree-content">

                  <span>
                    {decree.category}
                  </span>

                  <strong>
                    {decree.title}
                  </strong>

                  <small>
                    Issued // {decree.issued}
                  </small>

                </div>

                <span
                  className={`royal-records-page__decree-status royal-records-page__decree-status--${decree.status.toLowerCase()}`}
                >
                  {decree.status}
                </span>

              </div>
            ))}

          </div>

        </article>

        {/* =====================================
            ROYAL SEAL
        ===================================== */}

        <article className="royal-records-card royal-records-card--seal">

          <div className="royal-records-card__header">

            <div>
              <span>Sovereign Authentication</span>
              <h2>Royal Seal</h2>
            </div>

            <Crown size={18} />

          </div>

          <div className="royal-records-page__seal">

            <div className="royal-records-page__seal-ring">

              <div className="royal-records-page__seal-core">

                <Snowflake
                  size={48}
                  strokeWidth={0.75}
                />

              </div>

            </div>

            <span>
              Sovereign Authentication
            </span>

            <strong>
              Verified
            </strong>

            <p>
              Documents bearing the Royal Seal are recognized as
              direct instruments of imperial authority.
            </p>

            <div className="royal-records-page__seal-bar">
              <span />
            </div>

            <small>
              Seal Integrity // 100%
            </small>

          </div>

        </article>

        {/* =====================================
            REGISTRY
        ===================================== */}

        <article className="royal-records-card royal-records-card--registry">

          <div className="royal-records-card__header">

            <div>
              <span>Document Registry</span>
              <h2>Record Categories</h2>
            </div>

            <FileSignature size={18} />

          </div>

          <div className="royal-records-page__registry">

            {registry.map((record) => (
              <div
                key={record.id}
                className="royal-records-page__registry-item"
              >

                <span>
                  {record.id}
                </span>

                <div>
                  <strong>
                    {record.title}
                  </strong>

                  <small>
                    Registered Documents
                  </small>
                </div>

                <strong>
                  {record.count}
                </strong>

              </div>
            ))}

          </div>

        </article>

        {/* =====================================
            SIGNATURE AUTHORITY
        ===================================== */}

        <article className="royal-records-card royal-records-card--signatures">

          <div className="royal-records-card__header">

            <div>
              <span>Authentication Chain</span>
              <h2>Authorized Signatures</h2>
            </div>

            <Feather size={18} />

          </div>

          <div className="royal-records-page__signatures">

            {signatures.map((signature) => (
              <div
                key={signature.name}
                className="royal-records-page__signature"
              >

                <div className="royal-records-page__signature-icon">
                  <FileSignature
                    size={18}
                    strokeWidth={0.9}
                  />
                </div>

                <div>

                  <strong>
                    {signature.name}
                  </strong>

                  <span>
                    {signature.authority}
                  </span>

                </div>

                <small>
                  {signature.status}
                </small>

              </div>
            ))}

          </div>

        </article>

        {/* =====================================
            CROWN DIRECTIVE
        ===================================== */}

        <article className="royal-records-card royal-records-card--authority">

          <div className="royal-records-card__header">

            <div>
              <span>Highest Authority</span>
              <h2>Imperial Mandate</h2>
            </div>

            <Crown size={18} />

          </div>

          <div className="royal-records-page__authority">

            <div className="royal-records-page__authority-seal">

              <Crown
                size={42}
                strokeWidth={0.75}
              />

            </div>

            <div>

              <span>
                By Sovereign Command
              </span>

              <strong>
                The Written Will of the Crown Is Law
              </strong>

              <p>
                Every authenticated directive issued through
                the Imperial Chancellery carries the full authority
                of the Winter Throne throughout Snezhnaya.
              </p>

              <Link
                to="/tsaritsa"
                className="royal-records-page__authority-link"
              >
                View Sovereign Profile
                <ChevronRight size={14} />
              </Link>

            </div>

          </div>

        </article>

        {/* =====================================
            CHANCELLERY
        ===================================== */}

        <article className="royal-records-card royal-records-card--chancellery">

          <div className="royal-records-card__header">

            <div>
              <span>Administrative Office</span>
              <h2>Imperial Chancellery</h2>
            </div>

            <Users size={18} />

          </div>

          <div className="royal-records-page__chancellery">

            <div>

              <span>
                Clerks on Duty
              </span>

              <strong>
                24
              </strong>

            </div>

            <div>

              <span>
                Pending Review
              </span>

              <strong>
                17
              </strong>

            </div>

            <div>

              <span>
                Awaiting Seal
              </span>

              <strong>
                06
              </strong>

            </div>

            <div>

              <span>
                Dispatch Queue
              </span>

              <strong>
                31
              </strong>

            </div>

          </div>

        </article>

      </section>

    </main>
  );
}

export default RoyalRecordsPage;