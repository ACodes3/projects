import { useState } from 'react';

import {
  Map,
  Crosshair,
  Shield,
  Users,
  AlertTriangle,
  Radio,
  ChevronRight,
  Snowflake,
  Target,
  Swords,
  Eye,
  Crown,
} from 'lucide-react';

import './WarTablePage.css';

const regions = [
  {
    id: 'snezhnaya',
    name: 'Snezhnaya',
    subtitle: 'Imperial Homeland',
    influence: 100,
    threat: 'Secure',
    forces: '18,420',
    operations: 3,
    x: 50,
    y: 20,
  },
  {
    id: 'mondstadt',
    name: 'Mondstadt',
    subtitle: 'Western Territory',
    influence: 42,
    threat: 'Observed',
    forces: '1,240',
    operations: 2,
    x: 20,
    y: 44,
  },
  {
    id: 'liyue',
    name: 'Liyue',
    subtitle: 'Eastern Trade Zone',
    influence: 58,
    threat: 'Stable',
    forces: '2,810',
    operations: 4,
    x: 39,
    y: 58,
  },
  {
    id: 'inazuma',
    name: 'Inazuma',
    subtitle: 'Eastern Archipelago',
    influence: 31,
    threat: 'Restricted',
    forces: '860',
    operations: 1,
    x: 78,
    y: 62,
  },
  {
    id: 'sumeru',
    name: 'Sumeru',
    subtitle: 'Southern Intelligence Zone',
    influence: 47,
    threat: 'Observed',
    forces: '1,930',
    operations: 3,
    x: 52,
    y: 72,
  },
  {
    id: 'fontaine',
    name: 'Fontaine',
    subtitle: 'Western Diplomatic Zone',
    influence: 67,
    threat: 'Active',
    forces: '3,460',
    operations: 5,
    x: 29,
    y: 31,
  },
  {
    id: 'natlan',
    name: 'Natlan',
    subtitle: 'Southern War Zone',
    influence: 36,
    threat: 'Critical',
    forces: '4,120',
    operations: 6,
    x: 28,
    y: 78,
  },
];

const operations = [
  {
    id: 'pale-crown',
    name: 'Operation Pale Crown',
    region: 'Fontaine',
    commander: 'Imperial Command',
    status: 'Active',
    priority: 'High',
    progress: 72,
  },
  {
    id: 'white-silence',
    name: 'Operation White Silence',
    region: 'Natlan',
    commander: 'Field Division VII',
    status: 'Active',
    priority: 'Critical',
    progress: 46,
  },
  {
    id: 'frozen-hand',
    name: 'Operation Frozen Hand',
    region: 'Liyue',
    commander: 'Diplomatic Corps',
    status: 'Monitoring',
    priority: 'Medium',
    progress: 64,
  },
];

function WarTablePage() {
  const [selectedRegion, setSelectedRegion] = useState(regions[5]);

  return (
    <main className="war-table-page">

      {/* HEADER */}
      <header className="war-table-page__header">

        <div>
          <span className="war-table-page__eyebrow">
            Imperial Strategic Command
          </span>

          <h1>War Table</h1>

          <p>
            Global Fatui deployments, regional influence and
            active imperial operations.
          </p>
        </div>

        <div className="war-table-page__network">

          <Radio size={18} />

          <div>
            <span>Strategic Network</span>
            <strong>Live</strong>
          </div>

        </div>

      </header>

      {/* TOP METRICS */}
      <section className="war-table-page__metrics">

        <article>
          <Crosshair size={17} />

          <div>
            <span>Active Operations</span>
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
          <Shield size={17} />

          <div>
            <span>Secured Regions</span>
            <strong>03</strong>
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

      {/* MAIN COMMAND AREA */}
      <section className="war-table-page__command">

        {/* MAP */}
        <article className="war-table-page__map-panel">

          <div className="war-table-page__panel-header">

            <div>
              <span>Global Theatre</span>
              <h2>Imperial Influence Map</h2>
            </div>

            <Map size={18} />

          </div>

          <div className="war-table-page__map">

            <div className="war-table-page__map-grid" />

            <div className="war-table-page__map-center">
              <Snowflake size={170} strokeWidth={0.3} />
            </div>

            {regions.map((region) => (
              <button
                key={region.id}
                type="button"
                className={`war-table-page__marker ${
                  selectedRegion.id === region.id
                    ? 'war-table-page__marker--active'
                    : ''
                }`}
                style={{
                  left: `${region.x}%`,
                  top: `${region.y}%`,
                }}
                onClick={() => setSelectedRegion(region)}
              >
                <span className="war-table-page__marker-ring" />

                <span className="war-table-page__marker-dot" />

                <small>{region.name}</small>
              </button>
            ))}

            <div className="war-table-page__map-label">
              <Crown size={13} />

              <span>
                Crown of Winter Strategic Network
              </span>
            </div>

          </div>

        </article>

        {/* REGION INTELLIGENCE */}
        <aside className="war-table-page__region">

          <div className="war-table-page__panel-header">

            <div>
              <span>Selected Territory</span>
              <h2>{selectedRegion.name}</h2>
            </div>

            <Target size={18} />

          </div>

          <div className="war-table-page__region-body">

            <span className="war-table-page__region-subtitle">
              {selectedRegion.subtitle}
            </span>

            <div className="war-table-page__influence">

              <div>
                <span>Imperial Influence</span>
                <strong>
                  {selectedRegion.influence}%
                </strong>
              </div>

              <div className="war-table-page__influence-bar">
                <span
                  style={{
                    width: `${selectedRegion.influence}%`,
                  }}
                />
              </div>

            </div>

            <div className="war-table-page__region-stats">

              <div>
                <span>Threat Status</span>
                <strong>
                  {selectedRegion.threat}
                </strong>
              </div>

              <div>
                <span>Fatui Forces</span>
                <strong>
                  {selectedRegion.forces}
                </strong>
              </div>

              <div>
                <span>Operations</span>
                <strong>
                  {selectedRegion.operations}
                </strong>
              </div>

            </div>

            <div className="war-table-page__region-order">

              <Eye size={16} />

              <div>
                <span>Current Directive</span>

                <p>
                  Maintain surveillance and continue
                  strategic influence operations throughout
                  {` ${selectedRegion.name}`}.
                </p>
              </div>

            </div>

          </div>

        </aside>

      </section>

      {/* OPERATIONS */}
      <section className="war-table-page__operations">

        <div className="war-table-page__section-heading">

          <div>
            <span>Imperial Command</span>
            <h2>Priority Operations</h2>
          </div>

          <span>
            03 Classified Missions
          </span>

        </div>

        <div className="war-table-page__operation-grid">

          {operations.map((operation) => (
            <article
              key={operation.id}
              className="war-operation"
            >

              <div className="war-operation__top">

                <div className="war-operation__icon">
                  <Swords size={20} />
                </div>

                <span
                  className={`war-operation__priority war-operation__priority--${operation.priority.toLowerCase()}`}
                >
                  {operation.priority}
                </span>

              </div>

              <div className="war-operation__content">

                <span>
                  {operation.region}
                </span>

                <h3>
                  {operation.name}
                </h3>

                <p>
                  Commanded by {operation.commander}
                </p>

              </div>

              <div className="war-operation__progress">

                <div>
                  <span>{operation.status}</span>

                  <strong>
                    {operation.progress}%
                  </strong>
                </div>

                <div className="war-operation__bar">
                  <span
                    style={{
                      width: `${operation.progress}%`,
                    }}
                  />
                </div>

              </div>

              <button type="button">
                Open Operation
                <ChevronRight size={14} />
              </button>

            </article>
          ))}

        </div>

      </section>

    </main>
  );
}

export default WarTablePage;