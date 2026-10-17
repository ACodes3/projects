import { useMemo, useState } from 'react';

import {
  Archive,
  Crown,
  Gem,
  Shield,
  Sword,
  Snowflake,
  LockKeyhole,
  Search,
  ChevronRight,
  Sparkles,
  Eye,
} from 'lucide-react';

import './RelicVaultPage.css';

const relics = [
  {
    id: 'winter-crown',
    name: 'Winter Crown Fragment',
    category: 'Imperial',
    rarity: 'Divine',
    status: 'Secured',
    origin: 'Snezhnaya',
    icon: Crown,
    description:
      'A ceremonial fragment connected to the oldest recorded traditions of the Winter Palace.',
  },
  {
    id: 'frostfang',
    name: 'Frostfang',
    category: 'Weapon',
    rarity: 'Legendary',
    status: 'Secured',
    origin: 'Northern Front',
    icon: Sword,
    description:
      'An ancient Cryo-forged blade recovered from a sealed military vault beneath the northern territories.',
  },
  {
    id: 'crystal-heart',
    name: 'Crystal Heart',
    category: 'Artifact',
    rarity: 'Mythic',
    status: 'Research',
    origin: 'Unknown',
    icon: Gem,
    description:
      'A crystalline core emitting a stable Cryo resonance unlike any recorded natural formation.',
  },
  {
    id: 'harbinger-seal',
    name: 'Harbinger Command Seal',
    category: 'Imperial',
    rarity: 'Legendary',
    status: 'Secured',
    origin: 'Winter Palace',
    icon: Shield,
    description:
      'A restricted command seal once used to authorize high-level Fatui deployment orders.',
  },
  {
    id: 'pale-mask',
    name: 'Pale Mask',
    category: 'Archive',
    rarity: 'Rare',
    status: 'Sealed',
    origin: 'Foreign Theatre',
    icon: Eye,
    description:
      'A recovered ceremonial mask retained as evidence within the imperial archive.',
  },
  {
    id: 'cryostasis-core',
    name: 'Cryostasis Core',
    category: 'Artifact',
    rarity: 'Mythic',
    status: 'Research',
    origin: 'Snezhnaya',
    icon: Snowflake,
    description:
      'A compressed Cryo energy core maintained inside a reinforced containment field.',
  },
  {
    id: 'celestial-shard',
    name: 'Celestial Shard',
    category: 'Divine',
    rarity: 'Divine',
    status: 'Restricted',
    origin: 'Classified',
    icon: Sparkles,
    description:
      'A fragment of uncertain origin whose material composition remains under Omega classification.',
  },
  {
    id: 'vault-key',
    name: 'Omega Vault Key',
    category: 'Imperial',
    rarity: 'Mythic',
    status: 'Restricted',
    origin: 'Winter Palace',
    icon: LockKeyhole,
    description:
      'A ceremonial and functional access key linked to the deepest restricted sectors of the palace vault.',
  },
];

const categories = [
  'All',
  'Imperial',
  'Weapon',
  'Artifact',
  'Archive',
  'Divine',
];

function RelicVaultPage() {
  const [selectedRelic, setSelectedRelic] = useState(relics[0]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');

  const filteredRelics = useMemo(() => {
    return relics.filter((relic) => {
      const matchesCategory =
        selectedCategory === 'All' ||
        relic.category === selectedCategory;

      const matchesSearch =
        `${relic.name} ${relic.category} ${relic.rarity} ${relic.origin}`
          .toLowerCase()
          .includes(search.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, search]);

  const SelectedIcon = selectedRelic.icon;

  return (
    <main className="relic-vault-page">

      {/* HEADER */}
      <header className="relic-vault-page__header">

        <div>
          <span className="relic-vault-page__eyebrow">
            Winter Palace Secure Storage
          </span>

          <h1>Imperial Relic Vault</h1>

          <p>
            Restricted repository of imperial artifacts, recovered
            weapons and classified divine materials.
          </p>
        </div>

        <div className="relic-vault-page__status">

          <LockKeyhole size={18} />

          <div>
            <span>Vault Security</span>
            <strong>Absolute</strong>
          </div>

        </div>

      </header>

      {/* METRICS */}
      <section className="relic-vault-page__metrics">

        <article>
          <Archive size={17} />

          <div>
            <span>Stored Relics</span>
            <strong>128</strong>
          </div>
        </article>

        <article>
          <Gem size={17} />

          <div>
            <span>Divine Assets</span>
            <strong>09</strong>
          </div>
        </article>

        <article>
          <Shield size={17} />

          <div>
            <span>Restricted Items</span>
            <strong>31</strong>
          </div>
        </article>

        <article>
          <Snowflake size={17} />

          <div>
            <span>Cryo Containment</span>
            <strong>Stable</strong>
          </div>
        </article>

      </section>

      {/* FILTERS */}
      <section className="relic-vault-page__tools">

        <div className="relic-vault-page__search">

          <Search size={15} />

          <input
            type="text"
            placeholder="Search imperial vault..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

        </div>

        <div className="relic-vault-page__filters">

          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={
                selectedCategory === category
                  ? 'relic-vault-page__filter relic-vault-page__filter--active'
                  : 'relic-vault-page__filter'
              }
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}

        </div>

      </section>

      {/* MAIN */}
      <section className="relic-vault-page__command">

        {/* COLLECTION */}
        <section className="relic-vault-page__collection">

          <div className="relic-vault-page__section-header">

            <div>
              <span>Secured Collection</span>
              <h2>Imperial Artifacts</h2>
            </div>

            <span>
              {String(filteredRelics.length).padStart(2, '0')}
            </span>

          </div>

          <div className="relic-vault-page__grid">

            {filteredRelics.map((relic) => {
              const Icon = relic.icon;

              return (
                <button
                  key={relic.id}
                  type="button"
                  className={`relic-card ${
                    selectedRelic.id === relic.id
                      ? 'relic-card--selected'
                      : ''
                  }`}
                  onClick={() => setSelectedRelic(relic)}
                >

                  <div className="relic-card__top">

                    <span
                      className={`relic-card__rarity relic-card__rarity--${relic.rarity.toLowerCase()}`}
                    >
                      {relic.rarity}
                    </span>

                    <span className="relic-card__status">
                      {relic.status}
                    </span>

                  </div>

                  <div className="relic-card__display">

                    <div className="relic-card__artifact">
                      <Icon
                        size={35}
                        strokeWidth={0.9}
                      />
                    </div>

                  </div>

                  <div className="relic-card__identity">

                    <span>
                      {relic.category}
                    </span>

                    <strong>
                      {relic.name}
                    </strong>

                    <small>
                      {relic.origin}
                    </small>

                  </div>

                </button>
              );
            })}

          </div>

        </section>

        {/* SELECTED RELIC */}
        <aside className="relic-dossier">

          <div className="relic-dossier__header">

            <div>
              <span>Selected Artifact</span>
              <h2>Vault Record</h2>
            </div>

            <Archive size={18} />

          </div>

          <div className="relic-dossier__display">

            <div className="relic-dossier__ring">

              <div className="relic-dossier__artifact">
                <SelectedIcon
                  size={59}
                  strokeWidth={0.8}
                />
              </div>

            </div>

            <span>
              {selectedRelic.category}
            </span>

            <h3>
              {selectedRelic.name}
            </h3>

            <small>
              {selectedRelic.origin}
            </small>

          </div>

          <div className="relic-dossier__stats">

            <div>
              <span>Rarity</span>
              <strong>{selectedRelic.rarity}</strong>
            </div>

            <div>
              <span>Status</span>
              <strong>{selectedRelic.status}</strong>
            </div>

            <div>
              <span>Classification</span>
              <strong>{selectedRelic.category}</strong>
            </div>

          </div>

          <div className="relic-dossier__description">

            <span>Imperial Record</span>

            <p>
              {selectedRelic.description}
            </p>

          </div>

          <div className="relic-dossier__security">

            <Shield size={17} />

            <div>
              <span>Containment Protocol</span>

              <p>
                Artifact access is restricted to authorized
                Winter Palace personnel.
              </p>
            </div>

          </div>

          <button
            type="button"
            className="relic-dossier__button"
          >
            Open Complete Artifact Record
            <ChevronRight size={14} />
          </button>

        </aside>

      </section>

    </main>
  );
}

export default RelicVaultPage;