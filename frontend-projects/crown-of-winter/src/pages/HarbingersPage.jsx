import { useState } from 'react';

import {
  Crown,
  Users,
  Shield,
  Snowflake,
  Eye,
  Sword,
  FlaskConical,
  Gem,
  Banknote,
  Theater,
  Crosshair,
  Feather,
  ChevronRight,
} from 'lucide-react';

import './HarbingersPage.css';

const harbingers = [
  {
    id: 'jester',
    title: 'The Jester',
    codename: 'Pierro',
    division: 'Directorate',
    status: 'Imperial Command',
    clearance: 'Omega',
    icon: Crown,
    image: '/images/pierro.png',
    description:
      'Highest executive authority within the Fatui command structure beneath the Crown.',
    directive:
      'Coordinate the Harbingers and maintain execution of Her Majesty’s highest strategic objectives.',
  },
  {
    id: 'captain',
    title: 'The Captain',
    codename: 'Capitano',
    division: 'Military Command',
    status: 'Deployed',
    clearance: 'Crimson',
    icon: Sword,
    image: '/images/capitano.png',
    description:
      'A commanding military presence entrusted with operations requiring overwhelming force.',
    directive:
      'Maintain battlefield superiority and secure strategic objectives without compromise.',
  },
  {
    id: 'doctor',
    title: 'The Doctor',
    codename: 'Dottore',
    division: 'Research',
    status: 'Classified',
    clearance: 'Omega',
    icon: FlaskConical,
    image: '/images/dottore.png',
    description:
      'Oversees experimental research and projects beyond conventional scientific restrictions.',
    directive:
      'Continue classified research under direct imperial authorization.',
  },
  {
    id: 'damselette',
    title: 'Damselette',
    codename: 'Columbina',
    division: 'Special Operations',
    status: 'Palace',
    clearance: 'Crimson',
    icon: Feather,
    image: '/images/columbina.png',
    description:
      'An enigmatic Harbinger whose operational capabilities remain heavily classified.',
    directive:
      'Remain available for assignments requiring absolute discretion.',
  },
  {
    id: 'knave',
    title: 'The Knave',
    codename: 'Arlecchino',
    division: 'Intelligence',
    status: 'Active',
    clearance: 'Crimson',
    icon: Eye,
    image: '/images/arlecchino.png',
    description:
      'Directs covert assets and maintains an extensive network of operatives beyond Snezhnaya.',
    directive:
      'Preserve foreign intelligence channels and secure long-term imperial influence.',
  },
  {
    id: 'rooster',
    title: 'The Rooster',
    codename: 'Pulcinella',
    division: 'Internal Affairs',
    status: 'Snezhnaya',
    clearance: 'Imperial',
    icon: Shield,
    image: '/images/pulcinella.png',
    description:
      'Maintains political and administrative stability throughout the northern homeland.',
    directive:
      'Ensure domestic continuity and protect the interests of the Winter Palace.',
  },
  {
    id: 'balladeer',
    title: 'The Balladeer',
    codename: 'Scaramouche',
    division: 'Archive Record',
    status: 'Archived',
    clearance: 'Restricted',
    icon: Theater,
    image: '/images/scaramouche.png',
    description:
      'A former operational asset retained within sealed imperial records.',
    directive:
      'Historical dossier retained under restricted archive authority.',
  },
  {
    id: 'marionette',
    title: 'Marionette',
    codename: 'Sandrone',
    division: 'Engineering',
    status: 'Research',
    clearance: 'Crimson',
    icon: Gem,
    image: '/images/sandrone.png',
    description:
      'Oversees mechanical development, autonomous constructs and specialized imperial engineering.',
    directive:
      'Advance technological assets available to the Crown and Fatui command.',
  },
  {
    id: 'fair-lady',
    title: 'The Fair Lady',
    codename: 'Signora',
    division: 'Archive Record',
    status: 'Fallen',
    clearance: 'Sealed',
    icon: Snowflake,
    image: '/images/signora.png',
    description:
      'A former diplomatic and combat operative whose imperial record remains preserved.',
    directive:
      'Dossier sealed by order of the Winter Palace.',
  },
  {
    id: 'regrator',
    title: 'The Regrator',
    codename: 'Pantalone',
    division: 'Economic Command',
    status: 'Palace',
    clearance: 'Imperial',
    icon: Banknote,
    image: '/images/pantalone.png',
    description:
      'Controls financial networks, trade influence and economic resources supporting imperial operations.',
    directive:
      'Maintain economic leverage across foreign markets and preserve Fatui financial dominance.',
  },
  {
    id: 'childe',
    title: 'Childe',
    codename: 'Tartaglia',
    division: 'Field Operations',
    status: 'Deployed',
    clearance: 'Imperial',
    icon: Crosshair,
    image: '/images/tartaglia.png',
    description:
      'A highly mobile combat operative frequently assigned to direct field engagements.',
    directive:
      'Remain combat-ready and respond immediately to high-priority imperial deployments.',
  },
];

function HarbingersPage() {
  const [selectedHarbinger, setSelectedHarbinger] = useState(
    harbingers[1]
  );

  const SelectedIcon = selectedHarbinger.icon;

  return (
    <main className="harbingers-page">

      {/* HEADER */}
      <header className="harbingers-page__header">
        <div>
          <span className="harbingers-page__eyebrow">
            Fatui High Command
          </span>

          <h1>Eleven Harbingers</h1>

          <p>
            The highest-ranking officers of the Fatui,
            operating directly beneath the authority of the Crown.
          </p>
        </div>

        <div className="harbingers-page__status">
          <Users size={18} />

          <div>
            <span>Command Roster</span>
            <strong>Restricted</strong>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="harbingers-page__hero">

        <div className="harbingers-page__hero-decoration">
          <Crown size={110} strokeWidth={0.45} />
        </div>

        <div className="harbingers-page__hero-content">
          <span>
            Her Majesty&apos;s Executors
          </span>

          <h2>
            The Fatui Harbingers
          </h2>

          <p>
            Eleven figures entrusted with the most dangerous,
            secretive and consequential duties of the Snezhnayan Empire.
          </p>

          <div className="harbingers-page__hero-meta">
            <span>
              <Shield size={13} />
              Imperial Authority
            </span>

            <span>
              <Snowflake size={13} />
              Crown Allegiance
            </span>
          </div>
        </div>

      </section>

      {/* COMMAND AREA */}
      <section className="harbingers-page__command">

        {/* ROSTER */}
        <div className="harbingers-page__roster">

          <div className="harbingers-page__section-header">
            <div>
              <span>Imperial Roster</span>
              <h2>Command Members</h2>
            </div>

            <span>XI</span>
          </div>

          <div className="harbingers-page__roster-grid">

            {harbingers.map((harbinger, index) => {
              const Icon = harbinger.icon;

              return (
                <button
                  key={harbinger.id}
                  type="button"
                  className={`harbinger-card ${
                    selectedHarbinger.id === harbinger.id
                      ? 'harbinger-card--selected'
                      : ''
                  }`}
                  onClick={() => setSelectedHarbinger(harbinger)}
                >

                  {/* PORTRAIT */}
                  <img
                    src={harbinger.image}
                    alt={harbinger.codename}
                    className="harbinger-card__image"
                  />

                  <div className="harbinger-card__image-overlay" />

                  {/* NUMBER */}
                  <div className="harbinger-card__number">
                    {String(index + 1).padStart(2, '0')}
                  </div>

                  {/* STATUS */}
                  <div
                    className={`harbinger-card__status harbinger-card__status--${harbinger.status
                      .toLowerCase()
                      .replace(' ', '-')}`}
                  >
                    {harbinger.status}
                  </div>

                  {/* SMALL INSIGNIA */}
                  <div className="harbinger-card__crest">
                    <Icon
                      size={17}
                      strokeWidth={1}
                    />
                  </div>

                  {/* TEXT */}
                  <div className="harbinger-card__identity">
                    <span>
                      {harbinger.codename}
                    </span>

                    <strong>
                      {harbinger.title}
                    </strong>

                    <small>
                      {harbinger.division}
                    </small>
                  </div>

                </button>
              );
            })}

          </div>

        </div>

        {/* DOSSIER */}
        <aside className="harbinger-dossier">

          <div className="harbinger-dossier__header">
            <div>
              <span>Selected Harbinger</span>
              <h2>{selectedHarbinger.title}</h2>
            </div>

            <Crown size={18} />
          </div>

          {/* LARGE PORTRAIT */}
          <div className="harbinger-dossier__portrait">

            <img
              src={selectedHarbinger.image}
              alt={selectedHarbinger.codename}
              className="harbinger-dossier__portrait-image"
            />

            <div className="harbinger-dossier__portrait-overlay" />

            <div className="harbinger-dossier__portrait-content">

              <div className="harbinger-dossier__portrait-icon">
                <SelectedIcon
                  size={22}
                  strokeWidth={1}
                />
              </div>

              <span>
                {selectedHarbinger.codename}
              </span>

              <h3>
                {selectedHarbinger.title}
              </h3>

              <small>
                {selectedHarbinger.division}
              </small>

            </div>

          </div>

          {/* STATS */}
          <div className="harbinger-dossier__stats">

            <div>
              <span>Status</span>
              <strong>{selectedHarbinger.status}</strong>
            </div>

            <div>
              <span>Clearance</span>
              <strong>{selectedHarbinger.clearance}</strong>
            </div>

            <div>
              <span>Authority</span>
              <strong>Harbinger</strong>
            </div>

          </div>

          {/* DESCRIPTION */}
          <div className="harbinger-dossier__description">

            <span>
              Imperial Dossier
            </span>

            <p>
              {selectedHarbinger.description}
            </p>

          </div>

          {/* DIRECTIVE */}
          <div className="harbinger-dossier__directive">

            <Crown size={17} />

            <div>
              <span>
                Current Directive
              </span>

              <p>
                {selectedHarbinger.directive}
              </p>
            </div>

          </div>

          <button
            type="button"
            className="harbinger-dossier__button"
          >
            Open Complete Dossier
            <ChevronRight size={14} />
          </button>

        </aside>

      </section>

    </main>
  );
}

export default HarbingersPage;