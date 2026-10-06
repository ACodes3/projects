
import {
  Gem,
  Shield,
  Sword,
  FlaskConical,
  Package,
  CircleDot,
  Crown,
  Hand,
  Footprints,
} from 'lucide-react';

const icons = {
  weapon: Sword,
  chest: Shield,
  head: Crown,
  hands: Hand,
  feet: Footprints,
  ring: CircleDot,
  amulet: Gem,
  consumable: FlaskConical,
  material: Package,
};

export default function ItemArtwork({
  item,
  slotId,
  className = '',
}) {
  const Icon =
    icons[item?.slotId || item?.category || slotId] || Gem;

  return (
    <span className={`item-art ${className}`}>
      {/* Fallback icon */}
      <Icon
        className="item-art__fallback"
        aria-hidden="true"
        strokeWidth={1.25}
      />

      {/* Item artwork */}
      {item?.image && (
        <img
          src={item.image}
          alt=""
          loading="lazy"
        />
      )}
    </span>
  );
}
