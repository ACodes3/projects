import { useState } from 'react';

import {
  Snowflake,
  Crown,
  Shield,
  Users,
  AlertTriangle,
  Radio,
  ChevronRight,
  Swords,
  Eye,
  Gem,
  Crosshair,
  MapPin,
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
    x: 54,
    y: 16,
    token: 'crown',
  },
  {
    id: 'mondstadt',
    name: 'Mondstadt',
    subtitle: 'Western Territory',
    influence: 42,
    threat: 'Observed',
    forces: '1,240',
    operations: 2,
    x: 24,
    y: 37,
    token: 'shield',
  },
  {
    id: 'liyue',
    name: 'Liyue',
    subtitle: 'Eastern Trade Zone',
    influence: 58,
    threat: 'Stable',
    forces: '2,810',
    operations: 4,
    x: 42,
    y: 50,
    token: 'gem',
  },
  {
    id: 'inazuma',
    name: 'Inazuma',
    subtitle: 'Eastern Archipelago',
    influence: 31,
    threat: 'Restricted',
    forces: '860',
    operations: 1,
    x: 75,
    y: 46,
    token: 'snowflake',
  },
  {
    id: 'sumeru',
    name: 'Sumeru',
    subtitle: 'Southern Intelligence Zone',
    influence: 47,
    threat: 'Observed',
    forces: '1,930',
    operations: 3,
    x: 58,
    y: 68,
    token: 'eye',
  },
  {
    id: 'fontaine',
    name: 'Fontaine',
    subtitle: 'Western Diplomatic Zone',
    influence: 67,
    threat: 'Active',
    forces: '3,460',
    operations: 5,
    x: 30,
    y: 22,
    token: 'crosshair',
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
    y: 73,
    token: 'swords',
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

const boardCells = Array.from({ length: 64 }, (_, index) => index);

function RegionIcon({ token }) {
  const props = {
    size: 19,
    strokeWidth: 1.3,
  };

  switch (token) {
    case 'crown':
      return <Crown {...props} />;

    case 'shield':
      return <Shield {...props} />;

    case 'gem':
      return <Gem {...props} />;

    case 'snowflake':
      return <Snowflake {...props} />;

    case 'eye':
      return <Eye {...props} />;

    case 'crosshair':
      return <Crosshair {...props} />;

    case 'swords':
      return <Swords {...props} />;

    default:
      return <MapPin {...props} />;
  }
}

function WarTablePage() {
  const [selectedRegion, setSelectedRegion] = useState(regions[0]);

  return (
    <main className="war-table-page">

      {/* =====================================
          HEADER
      ===================================== */}

      <header className="war-table-page__header">

        <div>
          <span className="war-table-page__eyebrow">
            Imperial Strategic Chamber
          </span>

          <h1>War Table</h1>

          <p>
            Her Majesty&apos;s strategic board for imperial deployments,
            foreign influence and classified military operations.
          </p>
        </div>

        <div className="war-table-page__network">

          <Radio size={18} />

          <div>
            <span>War Chamber</span>
            <strong>Sealed</strong>
          </div>

        </div>

      </header>

      {/* =====================================
          METRICS
      ===================================== */}

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

      {/* =====================================
          WAR CHAMBER
      ===================================== */}

      <section className="war-table-page__command">

        {/* ===================================
            IMPERIAL BOARD
        =================================== */}

        <article className="war-board-panel">

          <div className="war-board-panel__header">

            <div>
              <span>Her Majesty&apos;s Chamber</span>
              <h2>Imperial Strategy Board</h2>
            </div>

            <Crown size={18} />

          </div>

          <div className="war-board-stage">

            {/* atmospheric table glow */}
            <div className="war-board-stage__glow" />

            {/* ornate board */}
            <div className="war-board">

              {/* ornamental corners */}
              <span className="war-board__corner war-board__corner--tl" />
              <span className="war-board__corner war-board__corner--tr" />
              <span className="war-board__corner war-board__corner--bl" />
              <span className="war-board__corner war-board__corner--br" />

              {/* outer decoration */}
              <div className="war-board__frame">

                <div className="war-board__crest war-board__crest--top">
                  <Snowflake size={24} strokeWidth={1} />
                </div>

                <div className="war-board__crest war-board__crest--bottom">
                  <Crown size={22} strokeWidth={1} />
                </div>

                {/* board surface */}
                <div className="war-board__surface">

                  <div className="war-board__cells">
                    {boardCells.map((cell) => (
                      <span
                        key={cell}
                        className="war-board__cell"
                      />
                    ))}
                  </div>

                  {/* center imperial emblem */}
                  <div className="war-board__seal">
                    <div className="war-board__seal-ring">
                      <Snowflake
                        size={54}
                        strokeWidth={0.7}
                      />
                    </div>
                  </div>

                  {/* strategic tokens */}
                  {regions.map((region) => (
                    <button
                      key={region.id}
                      type="button"
                      aria-label={`Select ${region.name}`}
                      className={`war-token ${
                        selectedRegion.id === region.id
                          ? 'war-token--selected'
                          : ''
                      }`}
                      style={{
                        left: `${region.x}%`,
                        top: `${region.y}%`,
                      }}
                      onClick={() => setSelectedRegion(region)}
                    >

                      <span className="war-token__shadow" />

                      <span className="war-token__base">

                        <span className="war-token__gem">
                          <RegionIcon token={region.token} />
                        </span>

                      </span>

                      <span className="war-token__label">
                        {region.name}
                      </span>

                    </button>
                  ))}

                </div>

              </div>

            </div>

            <div className="war-board-stage__caption">

              <span>
                <Snowflake size={12} />
                Cryo Strategic Matrix
              </span>

              <span>
                Sector VII // Imperial Eyes Only
              </span>

            </div>

          </div>

        </article>

        {/* ===================================
            SELECTED REGION
        =================================== */}

        <aside className="war-region-panel">

          <div className="war-region-panel__header">

            <div>
              <span>Selected Piece</span>
              <h2>{selectedRegion.name}</h2>
            </div>

            <div className="war-region-panel__selected-icon">
              <RegionIcon token={selectedRegion.token} />
            </div>

          </div>

          <div className="war-region-panel__body">

            <span className="war-region-panel__subtitle">
              {selectedRegion.subtitle}
            </span>

            {/* influence */}

            <div className="war-region-panel__influence">

              <div>
                <span>
                  Imperial Influence
                </span>

                <strong>
                  {selectedRegion.influence}%
                </strong>
              </div>

              <div className="war-region-panel__bar">
                <span
                  style={{
                    width: `${selectedRegion.influence}%`,
                  }}
                />
              </div>

            </div>

            {/* stats */}

            <div className="war-region-panel__stats">

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
                  {String(selectedRegion.operations).padStart(2, '0')}
                </strong>
              </div>

            </div>

            {/* royal directive */}

            <div className="war-region-panel__directive">

              <div className="war-region-panel__directive-icon">
                <Crown size={17} />
              </div>

              <div>
                <span>
                  Royal Directive
                </span>

                <p>
                  Maintain strategic pressure and continue imperial
                  observation throughout {selectedRegion.name}.
                </p>
              </div>

            </div>

            {/* seal */}

            <div className="war-region-panel__seal">

              <Snowflake
                size={35}
                strokeWidth={0.8}
              />

              <div>
                <span>Authority</span>
                <strong>By Order of the Crown</strong>
              </div>

            </div>

          </div>

        </aside>

      </section>

      {/* =====================================
          OPERATIONS
      ===================================== */}

      <section className="war-table-page__operations">

        <div className="war-table-page__section-heading">

          <div>
            <span>Current Campaigns</span>
            <h2>Imperial Operations</h2>
          </div>

          <span>
            03 Priority Orders
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
                  <Swords size={19} />
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
                  <span>
                    {operation.status}
                  </span>

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
                Review Order
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