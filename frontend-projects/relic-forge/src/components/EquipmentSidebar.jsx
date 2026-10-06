
import ItemArtwork from './ItemArtwork';

export default function EquipmentSidebar({
  slots,
  items,
  equipment,
  rarities,
  selectedId,
  onSelect,
}) {
  return (
    <aside
      className="equipment-panel panel"
      aria-label="Equipped items"
    >
      <h2 className="panel-title">Equipped</h2>

      <div className="equipment-list">
        {slots.map((slot) => {
          const item = items.find(
            (entry) => entry.id === equipment[slot.id]
          );

          const rarity = rarities.find(
            (entry) => entry.id === item?.rarityId
          );

          const statValue =
            item?.stats?.attack ||
            item?.stats?.defense ||
            item?.stats?.health ||
            item?.stats?.crit ||
            0;

          const isSelected = item?.id === selectedId;

          const statLabel =
            slot.id === 'weapon'
              ? 'Weapon Power'
              : slot.id === 'ring' || slot.id === 'amulet'
              ? 'Bonus'
              : 'Armor';

          return (
            <button
              key={slot.id}
              type="button"
              disabled={!item}
              className={`equipment-card ${
                isSelected ? 'equipment-card--selected' : ''
              }`}
              onClick={() => item && onSelect(item.id)}
              style={{
                '--item-accent': rarity?.color || '#6a6f72',
              }}
              title={item?.name || `Empty ${slot.name} slot`}
            >
              {/* Equipment artwork */}
              <ItemArtwork
                item={item}
                slotId={slot.id}
                className="equipment-card__art"
              />

              {/* Equipment information */}
              <span className="equipment-card__info">
                <span className="equipment-card__name">
                  {item?.name || `Empty ${slot.name}`}
                </span>

                <span
                  className="equipment-card__type"
                  style={{ color: rarity?.color }}
                >
                  {rarity?.name || 'Empty'}{' '}
                  {item ? slot.name : 'slot'}
                </span>

                <strong className="equipment-card__value">
                  {item ? statValue : '—'}
                </strong>

                <span className="equipment-card__stat">
                  {statLabel}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
