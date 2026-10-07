import {
  Swords,
  Shield,
  Heart,
  Sparkles,
  Map,
  ScrollText,
  BookOpen,
  ChevronRight,
  Crown,
  PackageOpen,
  Compass,
} from 'lucide-react';

import ItemArtwork from '../components/ItemArtwork';
import './ArmoryPage.css';

export default function ArmoryPage({
  character,
  stats,
  items,
  inventory,
  rarities,
  onNavigate,
  onInspectItem,
}) {
  const equippedIds = Object.values(
    inventory?.equipment || {}
  ).filter(Boolean);

  const equippedItems = equippedIds
    .map((id) =>
      items.find((item) => item.id === id)
    )
    .filter(Boolean);

  const featuredItems = [...items]
    .filter((item) =>
      ['legendary', 'epic', 'rare'].includes(
        item.rarityId
      )
    )
    .sort((a, b) => {
      const order = {
        legendary: 3,
        epic: 2,
        rare: 1,
      };

      return (
        (order[b.rarityId] || 0) -
        (order[a.rarityId] || 0)
      );
    })
    .slice(0, 4);

  const experience =
    Number(character?.experience) || 0;

  const destinations = [
    {
      id: 'Inventory',
      title: 'Inventory',
      description:
        'Manage equipment, relics and collected items.',
      icon: PackageOpen,
    },
    {
      id: 'Skills',
      title: 'Skills',
      description:
        'Spend skill points and master new abilities.',
      icon: Sparkles,
    },
    {
      id: 'Map',
      title: 'World Map',
      description:
        'Explore the known regions of Aetherion.',
      icon: Map,
    },
    {
      id: 'Quests',
      title: 'Quests',
      description:
        'Track objectives, contracts and rewards.',
      icon: ScrollText,
    },
  ];

  return (
    <main className="armory-page">

      {/* HERO */}
      <section className="armory-page__hero panel">

        {/* LEFT INTRODUCTION */}
        <div className="armory-page__intro">

          <span className="armory-page__eyebrow">
            Relic Forge
          </span>

          <h1>
            The
            <span> Armory</span>
          </h1>

          <p className="armory-page__intro-text">
            Prepare the Ashen Knight for the
            battles ahead. Equip ancient relics,
            master forgotten disciplines and
            venture deeper into Aetherion.
          </p>

          <div className="armory-page__hero-actions">

            <button
              type="button"
              className="armory-page__primary"
              onClick={() =>
                onNavigate('Inventory')
              }
            >
              <Swords size={16} />
              Open Inventory
              <ChevronRight size={15} />
            </button>

            <button
              type="button"
              className="armory-page__secondary"
              onClick={() =>
                onNavigate('Character')
              }
            >
              View Character
            </button>

          </div>

          {/* CHARACTER SUMMARY */}
          <div className="armory-page__character-summary">

            <div>
              <span>Level</span>
              <strong>
                {character.level}
              </strong>
            </div>

            <div>
              <span>Relics Equipped</span>
              <strong>
                {equippedItems.length}
              </strong>
            </div>

            <div>
              <span>Inventory</span>
              <strong>
                {inventory?.ownedItemIds?.length || 0}
              </strong>
            </div>

          </div>

        </div>

        {/* CHARACTER */}
        <div className="armory-page__character">

          <div className="armory-page__character-glow" />

          <div className="armory-page__crest">
            <Crown
              size={28}
              strokeWidth={1}
            />
          </div>

          <img
            src={character.image}
            alt={character.name}
            className="armory-page__character-image"
          />

          <div className="armory-page__character-name">
            <span>
              {character.class || 'Warrior'}
            </span>

            <strong>
              {character.name}
            </strong>

            <small>
              {character.title ||
                'The Wandering Champion'}
            </small>
          </div>

        </div>

        {/* RIGHT STATS */}
        <aside className="armory-page__stats">

          <div className="armory-page__stats-heading">
            <span>Battle Readiness</span>
            <strong>
              Level {character.level}
            </strong>
          </div>

          <div className="armory-page__stat">
            <span>
              <Swords size={16} />
              Attack
            </span>

            <strong>
              {stats.attack.toLocaleString()}
            </strong>
          </div>

          <div className="armory-page__stat">
            <span>
              <Shield size={16} />
              Defense
            </span>

            <strong>
              {stats.defense.toLocaleString()}
            </strong>
          </div>

          <div className="armory-page__stat">
            <span>
              <Heart size={16} />
              Vitality
            </span>

            <strong>
              {stats.health.toLocaleString()}
            </strong>
          </div>

          <div className="armory-page__stat">
            <span>
              <Sparkles size={16} />
              Critical
            </span>

            <strong>
              {stats.crit}%
            </strong>
          </div>

          {/* XP */}
          <div className="armory-page__xp">

            <div>
              <span>
                Experience
              </span>

              <strong>
                {experience}%
              </strong>
            </div>

            <div className="armory-page__xp-track">
              <span
                style={{
                  width: `${Math.min(
                    100,
                    experience
                  )}%`,
                }}
              />
            </div>

            <small>
              Progress toward Level{' '}
              {character.level + 1}
            </small>

          </div>

        </aside>

      </section>

      {/* LOWER AREA */}
      <section className="armory-page__lower">

        {/* FEATURED RELICS */}
        <section className="armory-page__featured panel">

          <div className="armory-page__section-heading">

            <div>
              <span>
                Collection
              </span>

              <h2>
                Featured Relics
              </h2>
            </div>

            <button
              type="button"
              onClick={() =>
                onNavigate('Inventory')
              }
            >
              View All
              <ChevronRight size={14} />
            </button>

          </div>

          <div className="armory-page__relic-grid">

            {featuredItems.map((item) => {
              const rarity =
                rarities.find(
                  (entry) =>
                    entry.id ===
                    item.rarityId
                );

              const power =
                item.stats?.attack ||
                item.stats?.defense ||
                item.stats?.health ||
                item.stats?.crit ||
                0;

              return (
                <button
                  key={item.id}
                  type="button"
                  className="armory-page__relic"
                  style={{
                    '--relic-color':
                      rarity?.color ||
                      '#a88d63',
                  }}
                  onClick={() =>
                    onInspectItem(item.id)
                  }
                >

                  <div className="armory-page__relic-art">
                    <ItemArtwork
                      item={item}
                    />
                  </div>

                  <div className="armory-page__relic-info">

                    <span
                      style={{
                        color:
                          rarity?.color,
                      }}
                    >
                      {rarity?.name ||
                        'Relic'}
                    </span>

                    <strong>
                      {item.name}
                    </strong>

                    <small>
                      Level {item.level}
                    </small>

                  </div>

                  <div className="armory-page__relic-power">
                    {power}
                  </div>

                </button>
              );
            })}

          </div>

        </section>

        {/* QUICK NAVIGATION */}
        <section className="armory-page__navigation panel">

          <div className="armory-page__section-heading">
            <div>
              <span>
                Adventure
              </span>

              <h2>
                Continue Journey
              </h2>
            </div>
          </div>

          <div className="armory-page__destination-list">

            {destinations.map(
              (destination) => {
                const Icon =
                  destination.icon;

                return (
                  <button
                    key={destination.id}
                    type="button"
                    className="armory-page__destination"
                    onClick={() =>
                      onNavigate(
                        destination.id
                      )
                    }
                  >

                    <span className="armory-page__destination-icon">
                      <Icon
                        size={21}
                        strokeWidth={1.4}
                      />
                    </span>

                    <span className="armory-page__destination-info">
                      <strong>
                        {destination.title}
                      </strong>

                      <small>
                        {
                          destination.description
                        }
                      </small>
                    </span>

                    <ChevronRight
                      size={14}
                    />

                  </button>
                );
              }
            )}

          </div>

          {/* CODEX SHORTCUT */}
          <button
            type="button"
            className="armory-page__codex"
            onClick={() =>
              onNavigate('Codex')
            }
          >
            <BookOpen size={17} />

            <span>
              <strong>
                Ancient Codex
              </strong>

              <small>
                Review creatures, locations,
                relics and forgotten lore.
              </small>
            </span>

            <Compass size={15} />
          </button>

        </section>

      </section>

    </main>
  );
}