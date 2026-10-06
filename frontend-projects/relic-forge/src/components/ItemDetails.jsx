import {
  Backpack,
  Sparkles,
  Shield,
  Check,
  ChevronRight
} from "lucide-react";

import ItemArtwork from "./ItemArtwork";

const STAT_CONFIG = [
  { key: "attack", label: "Attack" },
  { key: "defense", label: "Defense" },
  { key: "health", label: "Vitality" },
  { key: "crit", label: "Critical" }
];

function formatStat(value, key) {
  return key === "crit" ? `${value}%` : value;
}

function ItemDetails({
  item,
  rarity,
  slot,
  comparison,
  equippedItem,
  equippedSlotId,
  onEquip,
  onUnequip
}) {
  if (!item) {
    return (
      <aside className="forge-panel forge-panel--details">
        <div className="forge-panel__heading">
          <div>
            <p>03 / INSPECTION</p>
            <h2>Item Details</h2>
          </div>
        </div>

        <p className="item-details__hint">
          Select an item to inspect its attributes.
        </p>
      </aside>
    );
  }

  const isEquipped = Boolean(equippedSlotId);

  return (
    <aside className="forge-panel forge-panel--details">
      <div className="forge-panel__heading">
        <div>
          <p>03 / INSPECTION</p>
          <h2>Item Details</h2>
        </div>

        <span className="forge-panel__heading-icon">
          <Sparkles size={18} />
        </span>
      </div>

      <div
        className="item-details"
        style={{
          "--rarity-color": rarity?.color || "#9ba3ad"
        }}
      >
        <div className="item-details__visual">
          <div className="item-details__glow" />
          <div className="item-details__ring" />

          <ItemArtwork
            item={item}
            size={78}
            className="item-details__artwork"
          />

          <span className="item-details__level">
            LVL {item.level}
          </span>
        </div>

        <div className="item-details__rarity">
          <Sparkles size={13} />

          {(rarity?.name || "Common").toUpperCase()}
        </div>

        <h3>{item.name}</h3>

        <span className="item-details__slot">
          {(slot?.name || item.slotId).toUpperCase()}
          {" · "}
          {item.category.toUpperCase()}
        </span>

        <p className="item-details__description">
          {item.description}
        </p>

        <div className="item-details__divider" />

        <div className="item-details__section-title">
          <span>ITEM ATTRIBUTES</span>

          <span>
            {isEquipped ? "EQUIPPED" : "VS EQUIPPED"}
          </span>
        </div>

        <div className="item-attributes">
          {STAT_CONFIG.map((stat) => {
            const value = Number(
              item.stats?.[stat.key] || 0
            );

            const difference =
              comparison?.[stat.key]?.difference || 0;

            let differenceLabel = "—";

            if (isEquipped) {
              differenceLabel = "ACTIVE";
            } else if (difference > 0) {
              differenceLabel =
                `+${formatStat(difference, stat.key)}`;
            } else if (difference < 0) {
              differenceLabel =
                formatStat(difference, stat.key);
            }

            return (
              <div
                key={stat.key}
                className="item-attribute"
              >
                <span>{stat.label}</span>

                <strong>
                  {value > 0 ? "+" : ""}
                  {formatStat(value, stat.key)}
                </strong>

                <small
                  className={
                    !isEquipped && difference > 0
                      ? "positive"
                      : !isEquipped && difference < 0
                        ? "negative"
                        : ""
                  }
                >
                  {differenceLabel}
                </small>
              </div>
            );
          })}
        </div>

        {equippedItem && !isEquipped && (
          <div className="item-comparison-note">
            <Shield size={14} />

            <span>
              Comparing against{" "}
              <strong>{equippedItem.name}</strong>
            </span>
          </div>
        )}

        <button
          type="button"
          className="item-details__equip"
          onClick={() => {
            if (isEquipped) {
              onUnequip(equippedSlotId);
            } else {
              onEquip(item.id);
            }
          }}
        >
          {isEquipped ? (
            <>
              <Backpack size={17} />
              UNEQUIP ITEM
            </>
          ) : (
            <>
              <Check size={17} />
              EQUIP ITEM
            </>
          )}

          <ChevronRight size={17} />
        </button>

        <p className="item-details__hint">
          {isEquipped
            ? "Unequipping returns this item to the backpack."
            : "Equipping replaces the item currently occupying this slot."}
        </p>
      </div>
    </aside>
  );
}

export default ItemDetails;