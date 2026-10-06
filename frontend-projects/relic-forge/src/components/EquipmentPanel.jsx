import ItemArtwork from "./ItemArtwork";

import {
  findById,
  getItemRarity
} from "../utils/inventoryHelpers";

function EquipmentPanel({
  equipmentSlots,
  equipment,
  items,
  rarities,
  draggedId,
  dropTarget,
  onSelectItem,
  onEmptySlot,
  onDragStart,
  onDragEnd,
  onDragEnterSlot,
  onDragLeaveSlot,
  onDropItem
}) {
  const equippedCount = equipmentSlots.filter(
    (slot) => Boolean(equipment?.[slot.id])
  ).length;

  return (
    <>
      <div className="equipment-heading">
        <span>EQUIPPED GEAR</span>

        <strong>
          {equippedCount}/{equipmentSlots.length}
        </strong>
      </div>

      <div className="equipment-grid">
        {equipmentSlots.map((slot) => {
          const item = findById(
            items,
            equipment?.[slot.id]
          );

          const rarity = getItemRarity(item, rarities);

          const rarityColor = rarity?.color || "#7b8593";

          const isDropTarget = dropTarget === slot.id;

          return (
            <button
              key={slot.id}
              type="button"
              draggable={Boolean(item)}
              className={[
                "equipment-slot",
                item ? "equipment-slot--filled" : "",
                isDropTarget ? "equipment-slot--drop" : "",
                draggedId === item?.id
                  ? "equipment-slot--dragging"
                  : ""
              ]
                .filter(Boolean)
                .join(" ")}
              style={{
                "--rarity-color": rarityColor
              }}
              onClick={() => {
                if (item) {
                  onSelectItem(item.id);
                } else {
                  onEmptySlot(slot);
                }
              }}
              onDragStart={(event) => {
                if (item) {
                  onDragStart(event, item.id);
                }
              }}
              onDragEnd={onDragEnd}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
              }}
              onDragEnter={(event) => {
                event.preventDefault();
                onDragEnterSlot(slot.id);
              }}
              onDragLeave={(event) => {
                if (
                  !event.currentTarget.contains(
                    event.relatedTarget
                  )
                ) {
                  onDragLeaveSlot(slot.id);
                }
              }}
              onDrop={(event) => {
                onDropItem(event, slot.id);
              }}
              aria-label={
                item
                  ? `${slot.name}: ${item.name}`
                  : `${slot.name}: empty equipment slot`
              }
            >
              <ItemArtwork
                item={item}
                slotId={slot.id}
                size={22}
                className="equipment-slot__icon"
              />

              <span className="equipment-slot__text">
                <small>{slot.name}</small>

                <strong>
                  {item?.name || "Empty slot"}
                </strong>
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}

export default EquipmentPanel;