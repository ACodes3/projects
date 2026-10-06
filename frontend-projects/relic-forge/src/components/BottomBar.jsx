
import {
  ArrowLeft,
  ShieldOff,
  Star,
  Hammer,
  Coins,
  Info,
} from 'lucide-react';

export default function BottomBar({
  notice,
  isEquipped,
  canDismantle,
  favorite,
  salvage,
  onBack,
  onUnequip,
  onFavorite,
  onDismantle,
}) {
  return (
    <footer className="bottom-bar">

      {/* Left side: Controls */}
      <div className="bottom-bar__controls">

        {/* Back */}
        <button
          type="button"
          className="bottom-action"
          onClick={onBack}
        >
          <kbd>ESC</kbd>
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>

        {/* Unequip */}
        <button
          type="button"
          className="bottom-action"
          disabled={!isEquipped}
          onClick={onUnequip}
        >
          <kbd>R</kbd>
          <ShieldOff size={14} />
          <span>Unequip</span>
        </button>

        {/* Favorite */}
        <button
          type="button"
          className={`bottom-action ${
            favorite ? 'bottom-action--active' : ''
          }`}
          onClick={onFavorite}
        >
          <kbd>F</kbd>
          <Star
            size={14}
            fill={favorite ? 'currentColor' : 'none'}
          />
          <span>
            {favorite ? 'Unfavorite' : 'Favorite'}
          </span>
        </button>

        {/* Dismantle */}
        <button
          type="button"
          className="bottom-action bottom-action--danger"
          disabled={!canDismantle}
          onClick={onDismantle}
        >
          <Hammer size={14} />
          <span>Dismantle</span>
        </button>

      </div>

      {/* Middle: Status message */}
      <div className="bottom-bar__status">
        <Info size={13} />
        <span>{notice || 'Inventory ready.'}</span>
      </div>

      {/* Right side: Salvage currency */}
      <div className="bottom-bar__currency">
        <Coins size={17} />

        <span className="bottom-bar__currency-label">
          Salvage
        </span>

        <strong>
          {salvage.toLocaleString()}
        </strong>
      </div>

    </footer>
  );
}
