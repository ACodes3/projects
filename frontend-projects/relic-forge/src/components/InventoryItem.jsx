import { GripVertical } from "lucide-react";
import ItemArtwork from "./ItemArtwork";

function InventoryItem({
  item,
  rarity,
  selected,
  dragging,
  onSelect,
  onEquip,
  onDragStart,
  onDragEnd
}) {
  return (
    <button
      type="button"
      draggable
      className={[
        "inventory-item",
        selected ? "inventory-item--selected" : "",
        dragging ? "inventory-item--dragging" : ""
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        "--rarity-color": rarity?.color || "#9ba3ad"
      }}
      onClick={() => onSelect(item.id)}
      onDoubleClick={() => onEquip(item.id)}
      onDragStart={(event) => {
        onDragStart(event, item.id);
      }}
      onDragEnd={onDragEnd}
      aria-label={`${item.name}, ${rarity?.name || "Common"}, level ${item.level}`}
    >
      <ItemArtwork
        item={item}
        size={30}
        className="inventory-item__icon"
      />

      <span className="inventory-item__content">
        <span className="inventory-item__rarity">
          {rarity?.name || "Common"}
        </span>

        <strong>{item.name}</strong>

        <small>LVL {item.level}</small>
      </span>

      <GripVertical
        className="inventory-item__grip"
        size={14}
      />
    </button>
  );
}

export default InventoryItem;