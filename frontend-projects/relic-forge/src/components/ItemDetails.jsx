
import {
  Shield,
  Sword,
  Heart,
  Sparkles,
  Diamond,
  Star,
} from 'lucide-react';

import ItemArtwork from './ItemArtwork';

const statLabels = [
  { key: 'attack', label: 'Attack', icon: Sword },
  { key: 'defense', label: 'Defense', icon: Shield },
  { key: 'health', label: 'Health', icon: Heart },
  { key: 'crit', label: 'Critical Chance', icon: Sparkles },
];

export default function ItemDetails({
  item,
  rarity,
  characterLevel,
  equipped,
  comparedItem,
  favorite,
  onEquip,
  onUnequip,
  onFavorite,
}) {
  if (!item) {
    return (
      <aside className="details-panel panel">
        <div className="details-empty">
          Select an item to inspect its details.
        </div>
      </aside>
    );
  }

  const canEquip = Boolean(item.slotId);
  const levelLocked = canEquip && item.level > characterLevel;

  const power = Math.round(
    (item.stats?.attack || 0) * 12 +
    (item.stats?.defense || 0) * 8 +
    (item.stats?.health || 0) * 1.5 +
    (item.stats?.crit || 0) * 15
  );

  const statLines = statLabels.filter(
    (stat) => (item.stats?.[stat.key] || 0) !== 0
  );

  const displayPower =
    power || (item.category === 'consumable' ? 10 : 5);

  return (
    <aside
      className="details-panel panel"
      aria-label="Selected item details"
      style={{
        '--detail-accent': rarity?.color || '#c9a677',
      }}
    >
      <div className="details-panel__body">

        {/* Item heading */}
        <div className="details-heading">
          <div>
            <h2>{item.name}</h2>

            <p style={{ color: rarity?.color }}>
              {rarity?.name || 'Common'}{' '}
              {item.slotId || item.category}
            </p>
          </div>

          <button
            type="button"
            className={`details-favorite ${
              favorite ? 'details-favorite--on' : ''
            }`}
            onClick={() => onFavorite(item.id)}
            title="Toggle favorite"
            aria-label={
              favorite ? 'Remove favorite' : 'Mark favorite'
            }
          >
            <Star
              size={18}
              fill={favorite ? 'currentColor' : 'none'}
            />
          </button>
        </div>

        {/* Item artwork and power */}
        <div className="details-hero">
          <div className="details-hero__power">
            <strong>{displayPower}</strong>

            <span>
              {item.slotId === 'weapon'
                ? 'Weapon Power'
                : item.slotId
                ? 'Item Power'
                : 'Item Value'}
            </span>
          </div>

          <ItemArtwork
            item={item}
            className="details-hero__art"
          />
        </div>

        {/* Main attributes */}
        <div className="details-statblock">
          <h3>
            {item.slotId === 'weapon'
              ? `${Math.round(power * 1.14)} – ${Math.round(
                  power * 1.39
                )} Damage`
              : item.category === 'consumable'
              ? 'Restorative Alchemy'
              : item.category === 'material'
              ? 'Crafting Material'
              : 'Equipment Attributes'}
          </h3>

          {item.slotId === 'weapon' && (
            <p>1.20 Attacks per Second</p>
          )}
        </div>

        <div className="details-divider" />

        {/* Item bonuses */}
        <div className="details-bonuses">
          {statLines.length > 0 ? (
            statLines.map((stat) => {
              const Icon = stat.icon;

              const currentValue = item.stats[stat.key];
              const previousValue =
                comparedItem?.stats?.[stat.key] || 0;

              const difference = currentValue - previousValue;

              const showComparison =
                comparedItem &&
                comparedItem.id !== item.id;

              return (
                <div key={stat.key}>
                  <Icon size={13} />

                  <span>
                    +{currentValue} {stat.label}
                    {stat.key === 'crit' ? '%' : ''}
                  </span>

                  {showComparison && (
                    <small
                      className={
                        difference >= 0
                          ? 'bonus-up'
                          : 'bonus-down'
                      }
                    >
                      {difference > 0 ? '+' : ''}
                      {difference !== 0 ? difference : '—'}
                    </small>
                  )}
                </div>
              );
            })
          ) : (
            <p className="details-bonuses__empty">
              A rare find from the outer kingdoms.
            </p>
          )}
        </div>

        {/* Item description */}
        <p className="details-flavor">
          <Diamond size={14} />
          {item.description}
        </p>

        {/* Requirements */}
        <div className="details-requirements">
          <span>Required Level: {item.level}</span>

          <span>
            Durability:{' '}
            {item.category === 'material'
              ? '—'
              : '98 / 100'}
          </span>
        </div>

        {/* Lore text */}
        <p className="details-lore">
          “Every relic carries a story, and every story begins
          with a single flame.”
        </p>
      </div>

      {/* Equip / Unequip */}
      <div className="details-actions">
        <button
          type="button"
          className={`main-action ${
            levelLocked ? 'main-action--disabled' : ''
          }`}
          disabled={!canEquip || levelLocked}
          onClick={() =>
            equipped
              ? onUnequip(item.slotId)
              : onEquip(item.id)
          }
        >
          {equipped
            ? 'Unequip'
            : !canEquip
            ? 'Not equippable'
            : levelLocked
            ? `Requires level ${item.level}`
            : 'Equip item'}
        </button>

        {equipped && (
          <span className="details-actions__equipped">
            ◆ Currently Equipped
          </span>
        )}
      </div>

    </aside>
  );
}
