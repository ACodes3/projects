import {
  Crown,
  Shirt,
  Hand,
  Footprints,
  Swords,
  CircleDot,
  Gem
} from "lucide-react";

const SLOT_ICONS = {
  head: Crown,
  chest: Shirt,
  hands: Hand,
  feet: Footprints,
  weapon: Swords,
  ring: CircleDot,
  amulet: Gem
};

function ItemArtwork({
  item = null,
  slotId = null,
  size = 30,
  className = ""
}) {
  const currentSlot = item?.slotId || slotId;

  const Icon = SLOT_ICONS[currentSlot] || Gem;

  return (
    <span className={`item-artwork ${className}`}>
      <Icon size={size} strokeWidth={1.5} />

      {item?.image && (
        <img
          key={item.id}
          src={item.image}
          alt=""
          className="item-artwork__image"
          draggable={false}
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      )}
    </span>
  );
}

export default ItemArtwork;