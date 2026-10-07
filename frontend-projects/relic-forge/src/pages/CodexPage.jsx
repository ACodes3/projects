import { useEffect, useMemo, useState } from 'react';

import {
  BookOpen,
  Search,
  Skull,
  MapPin,
  Gem,
  ScrollText,
  Lock,
  Eye,
  Shield,
  Swords,
  Sparkles,
  ChevronRight,
  Check,
} from 'lucide-react';

import './CodexPage.css';

const categories = [
  {
    id: 'creatures',
    label: 'Creatures',
    icon: Skull,
  },
  {
    id: 'locations',
    label: 'Locations',
    icon: MapPin,
  },
  {
    id: 'relics',
    label: 'Relics',
    icon: Gem,
  },
  {
    id: 'lore',
    label: 'Lore',
    icon: ScrollText,
  },
];

const entryIcons = {
  creature: Skull,
  location: MapPin,
  relic: Gem,
  lore: ScrollText,
};

export default function CodexPage() {
  const [codexData, setCodexData] = useState(null);
  const [activeCategory, setActiveCategory] =
    useState('creatures');

  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  // =========================================
  // LOAD CODEX DATA
  // =========================================

  useEffect(() => {
    let active = true;

    async function loadCodex() {
      try {
        const response = await fetch(
          `${import.meta.env.BASE_URL}data/codex.json`
        );

        if (!response.ok) {
          throw new Error('Could not load codex.json');
        }

        const result = await response.json();

        if (!active) return;

        setCodexData(result);

        const firstEntry = result.entries.find(
          (entry) =>
            entry.category === 'creatures' &&
            entry.discovered
        );

        setSelectedId(
          firstEntry?.id ||
          result.entries[0]?.id ||
          null
        );
      } catch (err) {
        if (active) {
          setError(err.message);
        }
      }
    }

    loadCodex();

    return () => {
      active = false;
    };
  }, []);

  const entries = useMemo(
    () => codexData?.entries || [],
    [codexData]
  );

  const filteredEntries = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return entries.filter((entry) => {
      const matchesCategory =
        entry.category === activeCategory;

      const matchesSearch =
        !normalizedSearch ||
        entry.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        entry.subtitle
          ?.toLowerCase()
          .includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [entries, activeCategory, search]);

  const selectedEntry = entries.find(
    (entry) => entry.id === selectedId
  );

  const discoveredTotal = entries.filter(
    (entry) => entry.discovered
  ).length;

  const discoveryPercentage =
    entries.length > 0
      ? Math.round(
          (discoveredTotal / entries.length) * 100
        )
      : 0;

  const changeCategory = (categoryId) => {
    setActiveCategory(categoryId);

    const nextEntry = entries.find(
      (entry) =>
        entry.category === categoryId &&
        entry.discovered
    );

    const fallback = entries.find(
      (entry) => entry.category === categoryId
    );

    setSelectedId(
      nextEntry?.id || fallback?.id || null
    );
  };

  if (error) {
    return (
      <main className="codex-page">
        <div className="codex-page__feedback">
          <BookOpen size={40} />
          <h2>Codex Unavailable</h2>
          <p>{error}</p>
        </div>
      </main>
    );
  }

  if (!codexData) {
    return (
      <main className="codex-page">
        <div className="codex-page__feedback">
          <BookOpen size={40} />
          <p>Opening the ancient codex...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="codex-page">

      {/* HEADER */}
      <header className="codex-page__header">

        <div>
          <span className="codex-page__eyebrow">
            Archive of Aetherion
          </span>

          <h1>Codex</h1>
        </div>

        <div className="codex-page__progress">
          <BookOpen size={19} />

          <div>
            <strong>
              {discoveredTotal} / {entries.length}
            </strong>

            <span>
              {discoveryPercentage}% Discovered
            </span>
          </div>
        </div>

      </header>

      <div className="codex-page__layout">

        {/* LEFT SIDEBAR */}
        <aside className="codex-page__sidebar panel">

          <div className="codex-page__section-heading">
            <h2>Knowledge</h2>
          </div>

          <div className="codex-page__categories">
            {categories.map((category) => {
              const Icon = category.icon;

              const total = entries.filter(
                (entry) =>
                  entry.category === category.id
              ).length;

              const discovered = entries.filter(
                (entry) =>
                  entry.category === category.id &&
                  entry.discovered
              ).length;

              return (
                <button
                  key={category.id}
                  type="button"
                  className={`
                    codex-page__category
                    ${
                      activeCategory === category.id
                        ? 'codex-page__category--active'
                        : ''
                    }
                  `}
                  onClick={() =>
                    changeCategory(category.id)
                  }
                >
                  <span className="codex-page__category-icon">
                    <Icon
                      size={22}
                      strokeWidth={1.4}
                    />
                  </span>

                  <span className="codex-page__category-info">
                    <strong>
                      {category.label}
                    </strong>

                    <small>
                      {discovered} / {total} Discovered
                    </small>
                  </span>

                  <ChevronRight size={14} />
                </button>
              );
            })}
          </div>

          <div className="codex-page__overall-progress">
            <div>
              <span>Codex Completion</span>
              <strong>
                {discoveryPercentage}%
              </strong>
            </div>

            <div className="codex-page__progress-track">
              <span
                style={{
                  width: `${discoveryPercentage}%`,
                }}
              />
            </div>
          </div>

        </aside>

        {/* CENTER ENTRY LIST */}
        <section className="codex-page__entries panel">

          <div className="codex-page__entries-header">

            <div>
              <span>
                {
                  categories.find(
                    (category) =>
                      category.id === activeCategory
                  )?.label
                }
              </span>

              <h2>Codex Entries</h2>
            </div>

            <label className="codex-page__search">
              <Search size={14} />

              <input
                type="text"
                placeholder="Search codex..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </label>

          </div>

          <div className="codex-page__entry-list">

            {filteredEntries.map((entry) => {
              const Icon =
                entryIcons[entry.type] || BookOpen;

              const selected =
                entry.id === selectedId;

              return (
                <button
                  key={entry.id}
                  type="button"
                  className={`
                    codex-page__entry
                    ${
                      selected
                        ? 'codex-page__entry--selected'
                        : ''
                    }
                    ${
                      !entry.discovered
                        ? 'codex-page__entry--locked'
                        : ''
                    }
                  `}
                  onClick={() =>
                    setSelectedId(entry.id)
                  }
                >

                  <span className="codex-page__entry-icon">
                    {entry.discovered ? (
                      <Icon
                        size={27}
                        strokeWidth={1.3}
                      />
                    ) : (
                      <Lock size={22} />
                    )}
                  </span>

                  <span className="codex-page__entry-info">

                    <strong>
                      {entry.discovered
                        ? entry.name
                        : 'Undiscovered Entry'}
                    </strong>

                    <small>
                      {entry.discovered
                        ? entry.subtitle
                        : 'Continue exploring to reveal this entry.'}
                    </small>

                    {entry.discovered && (
                      <span>
                        {entry.region ||
                          entry.type}
                      </span>
                    )}

                  </span>

                  {entry.discovered ? (
                    <Eye size={14} />
                  ) : (
                    <Lock size={13} />
                  )}

                </button>
              );
            })}

            {filteredEntries.length === 0 && (
              <div className="codex-page__empty">
                No codex entries match your search.
              </div>
            )}

          </div>

        </section>

        {/* RIGHT DETAILS */}
        <aside className="codex-page__details panel">

          {selectedEntry ? (
            selectedEntry.discovered ? (
              <>
                <div className="codex-page__details-body">

                  <div className="codex-page__details-icon">
                    {(() => {
                      const Icon =
                        entryIcons[selectedEntry.type] ||
                        BookOpen;

                      return (
                        <Icon
                          size={44}
                          strokeWidth={1.2}
                        />
                      );
                    })()}
                  </div>

                  <span className="codex-page__details-type">
                    {selectedEntry.type}
                  </span>

                  <h2>
                    {selectedEntry.name}
                  </h2>

                  <p className="codex-page__subtitle">
                    {selectedEntry.subtitle}
                  </p>

                  <div className="codex-page__divider" />

                  <p className="codex-page__description">
                    {selectedEntry.description}
                  </p>

                  {/* INFORMATION */}
                  <div className="codex-page__information">

                    <h3>Entry Information</h3>

                    {selectedEntry.region && (
                      <div>
                        <span>
                          <MapPin size={13} />
                          Region
                        </span>

                        <strong>
                          {selectedEntry.region}
                        </strong>
                      </div>
                    )}

                    {selectedEntry.threat && (
                      <div>
                        <span>
                          <Swords size={13} />
                          Threat Level
                        </span>

                        <strong>
                          {selectedEntry.threat}
                        </strong>
                      </div>
                    )}

                    {selectedEntry.rarity && (
                      <div>
                        <span>
                          <Gem size={13} />
                          Rarity
                        </span>

                        <strong>
                          {selectedEntry.rarity}
                        </strong>
                      </div>
                    )}

                    {selectedEntry.faction && (
                      <div>
                        <span>
                          <Shield size={13} />
                          Faction
                        </span>

                        <strong>
                          {selectedEntry.faction}
                        </strong>
                      </div>
                    )}

                  </div>

                  {/* NOTES */}
                  {selectedEntry.notes?.length > 0 && (
                    <div className="codex-page__notes">

                      <h3>Scholar's Notes</h3>

                      {selectedEntry.notes.map(
                        (note, index) => (
                          <div
                            key={`${note}-${index}`}
                          >
                            <Sparkles size={12} />
                            <span>{note}</span>
                          </div>
                        )
                      )}

                    </div>
                  )}

                  {/* LORE */}
                  {selectedEntry.lore && (
                    <blockquote className="codex-page__lore">
                      “{selectedEntry.lore}”
                    </blockquote>
                  )}

                </div>

                <div className="codex-page__discovered">
                  <Check size={13} />
                  Entry Discovered
                </div>
              </>
            ) : (
              <div className="codex-page__locked-details">

                <div>
                  <Lock
                    size={47}
                    strokeWidth={1}
                  />
                </div>

                <span>Undiscovered</span>

                <h2>Unknown Entry</h2>

                <p>
                  Explore the world, defeat enemies,
                  complete quests, and recover ancient
                  relics to reveal this codex entry.
                </p>

              </div>
            )
          ) : (
            <div className="codex-page__locked-details">
              Select an entry from the codex.
            </div>
          )}

        </aside>

      </div>
    </main>
  );
}