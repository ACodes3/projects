import { useState } from 'react';

import {
  Settings,
  Shield,
  Snowflake,
  Radio,
  Database,
  Server,
  LockKeyhole,
  Activity,
  Power,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Crown,
  Eye,
} from 'lucide-react';

import './SystemPage.css';

const modules = [
  {
    id: 'cryo-network',
    name: 'Cryo Network',
    subtitle: 'Palace Energy Grid',
    status: 'Operational',
    health: 100,
    icon: Snowflake,
    description:
      'Maintains Cryo barriers, internal energy systems and environmental stabilization throughout the Winter Palace.',
  },
  {
    id: 'security',
    name: 'Imperial Security',
    subtitle: 'Defense Grid',
    status: 'Operational',
    health: 98,
    icon: Shield,
    description:
      'Controls palace security sectors, restricted access points and automated defensive systems.',
  },
  {
    id: 'archives',
    name: 'Archive Core',
    subtitle: 'Intelligence Storage',
    status: 'Operational',
    health: 96,
    icon: Database,
    description:
      'Encrypted storage network containing imperial intelligence, Fatui records and classified palace documentation.',
  },
  {
    id: 'communications',
    name: 'Command Relay',
    subtitle: 'Fatui Communications',
    status: 'Operational',
    health: 94,
    icon: Radio,
    description:
      'Secure long-range communication infrastructure connecting Winter Palace command with foreign Fatui divisions.',
  },
  {
    id: 'vault-control',
    name: 'Vault Control',
    subtitle: 'Artifact Containment',
    status: 'Restricted',
    health: 100,
    icon: LockKeyhole,
    description:
      'Controls containment systems and access authorization for the Imperial Relic Vault.',
  },
  {
    id: 'gnosis-containment',
    name: 'Gnosis Containment',
    subtitle: 'Omega Sector',
    status: 'Sealed',
    health: 100,
    icon: Crown,
    description:
      'Highest-security containment system reserved for divine assets under direct authority of the Crown.',
  },
];

const systemEvents = [
  {
    id: 1,
    type: 'success',
    title: 'Cryo network synchronized',
    time: '17:22',
  },
  {
    id: 2,
    type: 'success',
    title: 'Archive integrity scan complete',
    time: '17:14',
  },
  {
    id: 3,
    type: 'warning',
    title: 'Foreign relay interference detected',
    time: '16:48',
  },
  {
    id: 4,
    type: 'success',
    title: 'Vault containment verified',
    time: '16:31',
  },
];

function SystemPage() {
  const [selectedModule, setSelectedModule] = useState(modules[0]);

  const SelectedIcon = selectedModule.icon;

  return (
    <main className="system-page">

      {/* HEADER */}
      <header className="system-page__header">

        <div>
          <span className="system-page__eyebrow">
            Winter Palace Operating System
          </span>

          <h1>System Control</h1>

          <p>
            Internal palace infrastructure, security systems and
            imperial command network diagnostics.
          </p>
        </div>

        <div className="system-page__status">

          <Activity size={18} />

          <div>
            <span>System State</span>
            <strong>Nominal</strong>
          </div>

        </div>

      </header>

      {/* SYSTEM SUMMARY */}
      <section className="system-page__metrics">

        <article>
          <Server size={17} />

          <div>
            <span>Core Systems</span>
            <strong>06 / 06</strong>
          </div>
        </article>

        <article>
          <Shield size={17} />

          <div>
            <span>Security Integrity</span>
            <strong>99%</strong>
          </div>
        </article>

        <article>
          <Snowflake size={17} />

          <div>
            <span>Cryo Output</span>
            <strong>100%</strong>
          </div>
        </article>

        <article>
          <Radio size={17} />

          <div>
            <span>Command Relays</span>
            <strong>Online</strong>
          </div>
        </article>

      </section>

      {/* MAIN CONTROL */}
      <section className="system-page__command">

        {/* MODULES */}
        <section className="system-page__modules">

          <div className="system-page__section-header">

            <div>
              <span>Palace Infrastructure</span>
              <h2>System Modules</h2>
            </div>

            <Settings size={18} />

          </div>

          <div className="system-page__module-grid">

            {modules.map((module) => {
              const Icon = module.icon;

              return (
                <button
                  key={module.id}
                  type="button"
                  className={`system-module ${
                    selectedModule.id === module.id
                      ? 'system-module--selected'
                      : ''
                  }`}
                  onClick={() => setSelectedModule(module)}
                >

                  <div className="system-module__top">

                    <div className="system-module__icon">
                      <Icon
                        size={22}
                        strokeWidth={1}
                      />
                    </div>

                    <span
                      className={`system-module__status system-module__status--${module.status.toLowerCase()}`}
                    >
                      {module.status}
                    </span>

                  </div>

                  <div className="system-module__content">

                    <span>
                      {module.subtitle}
                    </span>

                    <strong>
                      {module.name}
                    </strong>

                  </div>

                  <div className="system-module__health">

                    <div>
                      <span>Integrity</span>

                      <strong>
                        {module.health}%
                      </strong>
                    </div>

                    <div className="system-module__bar">
                      <span
                        style={{
                          width: `${module.health}%`,
                        }}
                      />
                    </div>

                  </div>

                </button>
              );
            })}

          </div>

        </section>

        {/* SELECTED MODULE */}
        <aside className="system-dossier">

          <div className="system-dossier__header">

            <div>
              <span>Selected Module</span>
              <h2>{selectedModule.name}</h2>
            </div>

            <Settings size={17} />

          </div>

          <div className="system-dossier__display">

            <div className="system-dossier__ring">

              <div className="system-dossier__icon">
                <SelectedIcon
                  size={54}
                  strokeWidth={0.8}
                />
              </div>

            </div>

            <span>
              {selectedModule.subtitle}
            </span>

            <h3>
              {selectedModule.name}
            </h3>

            <small>
              Winter Palace Infrastructure
            </small>

          </div>

          <div className="system-dossier__health">

            <div>
              <span>System Integrity</span>

              <strong>
                {selectedModule.health}%
              </strong>
            </div>

            <div className="system-dossier__bar">
              <span
                style={{
                  width: `${selectedModule.health}%`,
                }}
              />
            </div>

          </div>

          <div className="system-dossier__stats">

            <div>
              <span>Status</span>
              <strong>{selectedModule.status}</strong>
            </div>

            <div>
              <span>Authority</span>
              <strong>Imperial</strong>
            </div>

            <div>
              <span>Network</span>
              <strong>Winter Palace</strong>
            </div>

          </div>

          <div className="system-dossier__description">

            <span>Module Information</span>

            <p>
              {selectedModule.description}
            </p>

          </div>

          <div className="system-dossier__controls">

            <button type="button">
              <RefreshCw size={14} />
              Run Diagnostic
            </button>

            <button type="button">
              <Eye size={14} />
              View Logs
            </button>

          </div>

        </aside>

      </section>

      {/* LOWER SECTION */}
      <section className="system-page__lower">

        {/* EVENT LOG */}
        <article className="system-events">

          <div className="system-page__section-header">

            <div>
              <span>System Activity</span>
              <h2>Recent Events</h2>
            </div>

            <Activity size={17} />

          </div>

          <div className="system-events__list">

            {systemEvents.map((event) => {
              const Icon =
                event.type === 'warning'
                  ? AlertTriangle
                  : CheckCircle2;

              return (
                <div
                  key={event.id}
                  className={`system-event system-event--${event.type}`}
                >

                  <Icon size={15} />

                  <span>
                    {event.title}
                  </span>

                  <small>
                    {event.time}
                  </small>

                </div>
              );
            })}

          </div>

        </article>

        {/* ADMIN */}
        <article className="system-admin">

          <div className="system-page__section-header">

            <div>
              <span>Restricted Controls</span>
              <h2>Imperial Administration</h2>
            </div>

            <LockKeyhole size={17} />

          </div>

          <div className="system-admin__body">

            <div className="system-admin__seal">

              <Crown
                size={35}
                strokeWidth={0.8}
              />

            </div>

            <div>
              <span>
                Crown Authorization Required
              </span>

              <p>
                Administrative overrides and palace-wide system
                controls require supreme imperial clearance.
              </p>
            </div>

          </div>

          <button
            type="button"
            className="system-admin__button"
          >
            Request Imperial Access
            <ChevronRight size={14} />
          </button>

        </article>

        {/* POWER */}
        <article className="system-power">

          <div className="system-page__section-header">

            <div>
              <span>Core Control</span>
              <h2>Palace Power</h2>
            </div>

            <Power size={17} />

          </div>

          <div className="system-power__body">

            <Snowflake
              size={41}
              strokeWidth={0.8}
            />

            <div>
              <strong>ONLINE</strong>

              <span>
                Cryo Core Stable
              </span>
            </div>

          </div>

        </article>

      </section>

    </main>
  );
}

export default SystemPage;