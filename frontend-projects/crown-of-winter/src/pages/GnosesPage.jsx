import { useState } from 'react';

import {
  Gem,
  Snowflake,
  Flame,
  Wind,
  Waves,
  Zap,
  Leaf,
  Mountain,
  Crown,
  LockKeyhole,
  Shield,
  ChevronRight,
  Activity,
} from 'lucide-react';

import './GnosesPage.css';

const gnoses = [
  {
    id: 'anemo',
    name: 'Anemo Gnosis',
    region: 'Mondstadt',
    element: 'Anemo',
    status: 'Secured',
    progress: 100,
    icon: Wind,
    classification: 'Imperial',
    description:
      'An acquired divine asset linked to the authority of Mondstadt.',
  },
  {
    id: 'geo',
    name: 'Geo Gnosis',
    region: 'Liyue',
    element: 'Geo',
    status: 'Secured',
    progress: 100,
    icon: Mountain,
    classification: 'Imperial',
    description:
      'A divine contract asset obtained through high-level negotiation.',
  },
  {
    id: 'electro',
    name: 'Electro Gnosis',
    region: 'Inazuma',
    element: 'Electro',
    status: 'Secured',
    progress: 100,
    icon: Zap,
    classification: 'Crimson',
    description:
      'A secured electro-aligned divine artifact transferred into Fatui custody.',
  },
  {
    id: 'dendro',
    name: 'Dendro Gnosis',
    region: 'Sumeru',
    element: 'Dendro',
    status: 'Secured',
    progress: 100,
    icon: Leaf,
    classification: 'Crimson',
    description:
      'A divine research asset now retained under imperial authority.',
  },
  {
    id: 'hydro',
    name: 'Hydro Gnosis',
    region: 'Fontaine',
    element: 'Hydro',
    status: 'Acquisition',
    progress: 74,
    icon: Waves,
    classification: 'Omega',
    description:
      'Current priority asset tied to Fontaine and ongoing imperial operations.',
  },
  {
    id: 'pyro',
    name: 'Pyro Gnosis',
    region: 'Natlan',
    element: 'Pyro',
    status: 'Contested',
    progress: 41,
    icon: Flame,
    classification: 'Omega',
    description:
      'High-risk target currently associated with active southern campaigns.',
  },
  {
    id: 'cryo',
    name: 'Cryo Gnosis',
    region: 'Snezhnaya',
    element: 'Cryo',
    status: 'Sovereign',
    progress: 100,
    icon: Snowflake,
    classification: 'Absolute',
    description:
      'The divine authority of Her Majesty and the central artifact of the Winter Palace.',
  },
];

function GnosesPage() {
  const [selectedGnosis, setSelectedGnosis] = useState(gnoses[6]);

  const SelectedIcon = selectedGnosis.icon;

  const securedCount = gnoses.filter(
    (gnosis) =>
      gnosis.status === 'Secured' ||
      gnosis.status === 'Sovereign'
  ).length;

  return (
    <main className="gnoses-page">

      {/* HEADER */}
      <header className="gnoses-page__header">

        <div>
          <span className="gnoses-page__eyebrow">
            Highest Imperial Classification
          </span>

          <h1>Project: Gnoses</h1>

          <p>
            Divine asset acquisition program under direct authority
            of the Winter Palace.
          </p>
        </div>

        <div className="gnoses-page__status">

          <LockKeyhole size={18} />

          <div>
            <span>Project Access</span>
            <strong>Omega</strong>
          </div>

        </div>

      </header>

      {/* SUMMARY */}
      <section className="gnoses-page__summary">

        <article>
          <Gem size={17} />

          <div>
            <span>Secured Assets</span>
            <strong>{securedCount} / 7</strong>
          </div>
        </article>

        <article>
          <Activity size={17} />

          <div>
            <span>Active Acquisition</span>
            <strong>02</strong>
          </div>
        </article>

        <article>
          <Shield size={17} />

          <div>
            <span>Vault Security</span>
            <strong>Absolute</strong>
          </div>
        </article>

        <article>
          <Crown size={17} />

          <div>
            <span>Authority</span>
            <strong>Her Majesty</strong>
          </div>
        </article>

      </section>

      {/* MAIN */}
      <section className="gnoses-page__command">

        {/* GNOSIS CHAMBER */}
        <section className="gnoses-chamber">

          <div className="gnoses-chamber__header">

            <div>
              <span>Divine Asset Array</span>
              <h2>Seven Gnoses</h2>
            </div>

            <Snowflake size={18} />

          </div>

          <div className="gnoses-chamber__stage">

            <div className="gnoses-chamber__ring" />

            <div className="gnoses-chamber__core">
              <Crown
                size={44}
                strokeWidth={0.8}
              />

              <span>
                Crown Authority
              </span>
            </div>

            {gnoses.map((gnosis, index) => {
              const Icon = gnosis.icon;

              return (
                <button
                  key={gnosis.id}
                  type="button"
                  className={`gnosis-node gnosis-node--${index + 1} ${
                    selectedGnosis.id === gnosis.id
                      ? 'gnosis-node--selected'
                      : ''
                  }`}
                  onClick={() => setSelectedGnosis(gnosis)}
                >
                  <span className="gnosis-node__outer">

                    <span className="gnosis-node__inner">
                      <Icon
                        size={24}
                        strokeWidth={1}
                      />
                    </span>

                  </span>

                  <span className="gnosis-node__label">
                    {gnosis.element}
                  </span>
                </button>
              );
            })}

          </div>

        </section>

        {/* DOSSIER */}
        <aside className="gnosis-dossier">

          <div className="gnosis-dossier__header">

            <div>
              <span>Selected Divine Asset</span>
              <h2>{selectedGnosis.element}</h2>
            </div>

            <Gem size={18} />

          </div>

          <div className="gnosis-dossier__artifact">

            <div className="gnosis-dossier__artifact-ring">

              <div className="gnosis-dossier__artifact-inner">
                <SelectedIcon
                  size={54}
                  strokeWidth={0.8}
                />
              </div>

            </div>

            <span>
              {selectedGnosis.region}
            </span>

            <h3>
              {selectedGnosis.name}
            </h3>

            <small>
              Divine Authority
            </small>

          </div>

          <div className="gnosis-dossier__progress">

            <div>
              <span>Acquisition Progress</span>

              <strong>
                {selectedGnosis.progress}%
              </strong>
            </div>

            <div className="gnosis-dossier__bar">
              <span
                style={{
                  width: `${selectedGnosis.progress}%`,
                }}
              />
            </div>

          </div>

          <div className="gnosis-dossier__stats">

            <div>
              <span>Status</span>
              <strong>{selectedGnosis.status}</strong>
            </div>

            <div>
              <span>Region</span>
              <strong>{selectedGnosis.region}</strong>
            </div>

            <div>
              <span>Classification</span>
              <strong>{selectedGnosis.classification}</strong>
            </div>

          </div>

          <div className="gnosis-dossier__description">

            <span>Imperial Analysis</span>

            <p>
              {selectedGnosis.description}
            </p>

          </div>

          <div className="gnosis-dossier__directive">

            <Crown size={17} />

            <div>
              <span>Project Directive</span>

              <p>
                Maintain absolute secrecy and preserve all divine
                assets under authority of the Winter Palace.
              </p>
            </div>

          </div>

          <button
            type="button"
            className="gnosis-dossier__button"
          >
            Open Divine Asset Record
            <ChevronRight size={14} />
          </button>

        </aside>

      </section>

    </main>
  );
}

export default GnosesPage;