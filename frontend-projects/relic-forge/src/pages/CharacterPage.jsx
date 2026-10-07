
import {
  Swords,
  Shield,
  Heart,
  Crosshair,
  ChevronRight,
  Crown,
  Sparkles,
} from 'lucide-react';

import ItemArtwork from '../components/ItemArtwork';

import './CharacterPage.css';

const attributes = [
  {
    key: 'attack',
    label: 'Attack Power',
    icon: Swords,
  },
  {
    key: 'defense',
    label: 'Defense',
    icon: Shield,
  },
  {
    key: 'health',
    label: 'Vitality',
    icon: Heart,
  },
  {
    key: 'crit',
    label: 'Critical Chance',
    icon: Crosshair,
  },
];

export default function CharacterPage({
  character,
  stats,
  equipment,
  items,
  slots,
  rarities,
  onInspectItem,
  onOpenInventory,
}) {
  const experience = Math.min(
    100,
    Math.max(0, Number(character.experience) || 0)
  );

  const equippedItems = slots.map((slot) => {
    const item = items.find(
      (entry) => entry.id === equipment[slot.id]
    );

    const rarity = rarities.find(
      (entry) => entry.id === item?.rarityId
    );

    return {
      slot,
      item,
      rarity,
    };
  });

  return (
    <main className="character-page">

      {/* Page heading */}
      <header className="character-page__header">
        <div>
          <span className="character-page__eyebrow">
            Hero Overview
          </span>

          <h1>Character</h1>
        </div>

        <div className="character-page__level">
          <Crown size={17} />
          <span>Level {character.level}</span>
        </div>
      </header>

      <div className="character-page__layout">

        {/* Left: Equipped gear */}
        <section className="character-page__equipment panel">
          <div className="character-page__section-heading">
            <h2>Equipped Relics</h2>
            <span>{equippedItems.filter(({ item }) => item).length} / {slots.length}</span>
          </div>

          <div className="character-page__gear-list">
            {equippedItems.map(({ slot, item, rarity }) => (
              <button
                key={slot.id}
                type="button"
                className="character-page__gear"
                disabled={!item}
                onClick={() => onInspectItem(item.id)}
                style={{
                  '--gear-color': rarity?.color || '#7b858d',
                }}
              >
                <ItemArtwork
                  item={item}
                  slotId={slot.id}
                  className="character-page__gear-art"
                />

                <div className="character-page__gear-info">
                  <span className="character-page__gear-slot">
                    {slot.name}
                  </span>

                  <strong>
                    {item?.name || 'Empty Slot'}
                  </strong>

                  {item && (
                    <span
                      className="character-page__gear-rarity"
                      style={{ color: rarity?.color }}
                    >
                      {rarity?.name || 'Common'}
                    </span>
                  )}
                </div>

                <ChevronRight size={14} />
              </button>
            ))}
          </div>

          <button
            type="button"
            className="character-page__inventory-link"
            onClick={onOpenInventory}
          >
            Manage Equipment
            <ChevronRight size={15} />
          </button>
        </section>

        {/* Center: Character portrait */}
        <section className="character-page__hero panel">
          <div className="character-page__hero-background" />

          <div className="character-page__hero-emblem">
            <Sparkles size={24} strokeWidth={1} />
          </div>

          <img
            src={character.image}
            alt={character.name}
            className="character-page__hero-image"
          />

          <div className="character-page__hero-info">
            <span className="character-page__hero-class">
              {character.class || 'Warrior'}
            </span>

            <h2>{character.name}</h2>

            <p>
              {character.title || 'The Wandering Champion'}
            </p>
          </div>
        </section>

        {/* Right: Attributes and progression */}
        <aside className="character-page__attributes">

          <section className="character-page__attribute-panel panel">
            <div className="character-page__section-heading">
              <h2>Battle Attributes</h2>
            </div>

            <div className="character-page__stat-list">
              {attributes.map(({ key, label, icon: Icon }) => {
                const total = Number(stats[key] || 0);
                const base = Number(
                  character.baseStats?.[key] || 0
                );

                const bonus = total - base;

                return (
                  <div
                    key={key}
                    className="character-page__stat"
                  >
                    <div className="character-page__stat-icon">
                      <Icon size={21} strokeWidth={1.5} />
                    </div>

                    <div className="character-page__stat-info">
                      <span>{label}</span>

                      <strong>
                        {total.toLocaleString()}
                        {key === 'crit' ? '%' : ''}
                      </strong>

                      <small>
                        Base: {base}
                        {bonus > 0 && (
                          <em> +{bonus} from gear</em>
                        )}
                      </small>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Character progression */}
          <section className="character-page__progress-panel panel">
            <div className="character-page__section-heading">
              <h2>Progression</h2>
            </div>

            <div className="character-page__progress-info">
              <span>Current Level</span>
              <strong>{character.level}</strong>
            </div>

            <div className="character-page__progress-track">
              <div
                style={{ width: `${experience}%` }}
              />
            </div>

            <div className="character-page__progress-footer">
              <span>{experience}% Experience</span>
              <span>Next: Level {character.level + 1}</span>
            </div>
          </section>

          {/* Character biography */}
          <section className="character-page__lore-panel panel">
            <div className="character-page__section-heading">
              <h2>Character Lore</h2>
            </div>

            <p>
              {character.description ||
                'A warrior whose legend has yet to be written.'}
            </p>

            <div className="character-page__lore-decoration">
              ✦ ─────── ✦
            </div>
          </section>

        </aside>
      </div>
    </main>
  );
}
