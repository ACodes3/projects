import {
  Activity,
  Atom,
  Beaker,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  Gauge,
  LockKeyhole,
  Microscope,
  Shield,
  Snowflake,
  Sparkles,
  TriangleAlert,
  Waves,
} from 'lucide-react';

import { Link } from 'react-router-dom';

import './CryoLaboratoryPage.css';

const experiments = [
  {
    id: 'CR-01',
    name: 'Cryo Resonance Matrix',
    type: 'Energy Research',
    status: 'Stable',
    progress: 92,
    icon: Waves,
  },
  {
    id: 'CR-02',
    name: 'Permafrost Catalyst',
    type: 'Material Science',
    status: 'Testing',
    progress: 68,
    icon: FlaskConical,
  },
  {
    id: 'CR-03',
    name: 'Frozen Core Prototype',
    type: 'Power Systems',
    status: 'Restricted',
    progress: 81,
    icon: Atom,
  },
  {
    id: 'CR-04',
    name: 'Divine Cryo Conduit',
    type: 'Classified Research',
    status: 'Critical',
    progress: 43,
    icon: Sparkles,
  },
];

const protocols = [
  {
    id: '01',
    title: 'Resonance Containment',
    text: 'All Cryo resonance tests must remain within approved containment thresholds.',
  },
  {
    id: '02',
    title: 'Prototype Isolation',
    text: 'Experimental cores are to remain physically isolated until stability is verified.',
  },
  {
    id: '03',
    title: 'Emergency Freeze',
    text: 'Critical instability triggers automatic chamber lockdown and total Cryo suppression.',
  },
];

const readings = [
  {
    label: 'Core Temperature',
    value: '-118°C',
  },
  {
    label: 'Resonance Output',
    value: '87%',
  },
  {
    label: 'Containment Field',
    value: '99.7%',
  },
  {
    label: 'Ambient Cryo',
    value: 'Stable',
  },
];

function CryoLaboratoryPage() {
  return (
    <main className="cryo-lab-page">

      {/* =====================================
          NAVIGATION
      ===================================== */}

      <div className="cryo-lab-page__navigation">

        <Link
          to="/palace"
          className="cryo-lab-page__back"
        >
          <ChevronLeft size={14} />
          Palace Directory
        </Link>

        <span>
          Sector 06 // Cryo Laboratory
        </span>

      </div>

      {/* =====================================
          HERO
      ===================================== */}

      <section className="cryo-lab-page__hero">

        <div className="cryo-lab-page__hero-background">

          <div className="cryo-lab-page__hero-grid" />

          <div className="cryo-lab-page__reactor">

            <div className="cryo-lab-page__reactor-ring cryo-lab-page__reactor-ring--outer" />

            <div className="cryo-lab-page__reactor-ring cryo-lab-page__reactor-ring--inner" />

            <div className="cryo-lab-page__reactor-core">
              <Snowflake
                size={66}
                strokeWidth={0.55}
              />
            </div>

          </div>

        </div>

        <div className="cryo-lab-page__hero-overlay" />

        <div className="cryo-lab-page__hero-content">

          <span className="cryo-lab-page__eyebrow">
            Imperial Cryogenic Research Division
          </span>

          <h1>
            Cryo Laboratory
          </h1>

          <p>
            The Winter Palace&apos;s primary research facility for
            Cryo energy, experimental materials and classified
            technologies developed under imperial authority.
          </p>

          <div className="cryo-lab-page__hero-meta">

            <span>
              <Activity size={13} />
              Reactor Stable
            </span>

            <span>
              <LockKeyhole size={13} />
              Restricted Access
            </span>

            <span>
              <Snowflake size={13} />
              Cryo Field Online
            </span>

          </div>

        </div>

      </section>

      {/* =====================================
          METRICS
      ===================================== */}

      <section className="cryo-lab-page__metrics">

        <article>
          <FlaskConical size={17} />

          <div>
            <span>Active Experiments</span>
            <strong>12</strong>
          </div>
        </article>

        <article>
          <Microscope size={17} />

          <div>
            <span>Research Units</span>
            <strong>08</strong>
          </div>
        </article>

        <article>
          <Gauge size={17} />

          <div>
            <span>Core Stability</span>
            <strong>99.7%</strong>
          </div>
        </article>

        <article>
          <TriangleAlert size={17} />

          <div>
            <span>Critical Tests</span>
            <strong>01</strong>
          </div>
        </article>

      </section>

      {/* =====================================
          MAIN GRID
      ===================================== */}

      <section className="cryo-lab-page__grid">

        {/* RESEARCH FLOOR */}
        <article className="cryo-lab-card cryo-lab-card--experiments">

          <div className="cryo-lab-card__header">

            <div>
              <span>Laboratory Network</span>
              <h2>Active Experiments</h2>
            </div>

            <Beaker size={18} />

          </div>

          <div className="cryo-lab-page__experiments">

            {experiments.map((experiment) => {
              const Icon = experiment.icon;

              return (
                <div
                  key={experiment.id}
                  className="cryo-lab-page__experiment"
                >

                  <div className="cryo-lab-page__experiment-icon">
                    <Icon
                      size={22}
                      strokeWidth={0.9}
                    />
                  </div>

                  <div className="cryo-lab-page__experiment-content">

                    <span>
                      {experiment.id} // {experiment.type}
                    </span>

                    <strong>
                      {experiment.name}
                    </strong>

                    <div className="cryo-lab-page__experiment-bar">
                      <span
                        style={{
                          width: `${experiment.progress}%`,
                        }}
                      />
                    </div>

                    <small>
                      Research Progress // {experiment.progress}%
                    </small>

                  </div>

                  <span
                    className={`cryo-lab-page__experiment-status cryo-lab-page__experiment-status--${experiment.status.toLowerCase()}`}
                  >
                    {experiment.status}
                  </span>

                </div>
              );
            })}

          </div>

        </article>

        {/* REACTOR CORE */}
        <article className="cryo-lab-card cryo-lab-card--reactor">

          <div className="cryo-lab-card__header">

            <div>
              <span>Primary Energy System</span>
              <h2>Cryo Reactor</h2>
            </div>

            <Snowflake size={18} />

          </div>

          <div className="cryo-lab-page__core">

            <div className="cryo-lab-page__core-ring">

              <div className="cryo-lab-page__core-inner">
                <Snowflake
                  size={48}
                  strokeWidth={0.7}
                />
              </div>

            </div>

            <span>
              Imperial Cryo Core
            </span>

            <strong>
              Stable
            </strong>

            <div className="cryo-lab-page__core-bar">
              <span />
            </div>

            <small>
              Containment Integrity // 99.7%
            </small>

          </div>

        </article>

        {/* SENSOR READINGS */}
        <article className="cryo-lab-card cryo-lab-card--readings">

          <div className="cryo-lab-card__header">

            <div>
              <span>Live Telemetry</span>
              <h2>Laboratory Readings</h2>
            </div>

            <Activity size={18} />

          </div>

          <div className="cryo-lab-page__readings">

            {readings.map((reading) => (
              <div
                key={reading.label}
                className="cryo-lab-page__reading"
              >

                <span>
                  {reading.label}
                </span>

                <strong>
                  {reading.value}
                </strong>

              </div>
            ))}

          </div>

          <div className="cryo-lab-page__waveform">

            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />

          </div>

        </article>

        {/* SAFETY PROTOCOLS */}
        <article className="cryo-lab-card cryo-lab-card--protocols">

          <div className="cryo-lab-card__header">

            <div>
              <span>Research Security</span>
              <h2>Containment Protocols</h2>
            </div>

            <Shield size={18} />

          </div>

          <div className="cryo-lab-page__protocols">

            {protocols.map((protocol) => (
              <div
                key={protocol.id}
                className="cryo-lab-page__protocol"
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

        {/* CLASSIFIED RESEARCH */}
        <article className="cryo-lab-card cryo-lab-card--classified">

          <div className="cryo-lab-card__header">

            <div>
              <span>Omega Research Wing</span>
              <h2>Classified Project</h2>
            </div>

            <LockKeyhole size={18} />

          </div>

          <div className="cryo-lab-page__classified">

            <div className="cryo-lab-page__classified-seal">

              <Atom
                size={43}
                strokeWidth={0.75}
              />

            </div>

            <div>

              <span>
                Project Designation
              </span>

              <strong>
                Absolute Zero
              </strong>

              <p>
                Experimental research concerning extreme Cryo
                resonance and divine-energy containment.
                Details remain restricted under Omega clearance.
              </p>

              <Link
                to="/gnoses"
                className="cryo-lab-page__classified-link"
              >
                View Related Divine Research
                <ChevronRight size={14} />
              </Link>

            </div>

          </div>

        </article>

      </section>

    </main>
  );
}

export default CryoLaboratoryPage;