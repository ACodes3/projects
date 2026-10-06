import {
  Crown,
  Shield,
  Swords,
  Sword,
  Heart,
  Crosshair,
  Sparkles
} from "lucide-react";

import EquipmentPanel from "./EquipmentPanel";

const STAT_CONFIG = [
  {
    key: "attack",
    label: "Attack",
    icon: Sword
  },
  {
    key: "defense",
    label: "Defense",
    icon: Shield
  },
  {
    key: "health",
    label: "Vitality",
    icon: Heart
  },
  {
    key: "crit",
    label: "Critical",
    icon: Crosshair
  }
];

function formatStat(value, key) {
  return key === "crit" ? `${value}%` : value;
}

function CharacterPanel({
  character,
  stats,
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
  const experience = Math.min(
    100,
    Math.max(0, Number(character?.experience || 0))
  );

  return (
    <section className="forge-panel forge-panel--character">
      <div className="forge-panel__heading">
        <div>
          <p>01 / HERO</p>
          <h2>Character</h2>
        </div>

        <span className="forge-panel__heading-icon">
          <Crown size={18} />
        </span>
      </div>

      <div className="hero-profile">
        <div className="hero-profile__crest">
          <div className="hero-profile__outer-ring" />
          <div className="hero-profile__inner-ring" />

          <Shield size={100} strokeWidth={0.8} />

          <Swords
            className="hero-profile__swords"
            size={55}
            strokeWidth={1.2}
          />

          {character?.image && (
            <img
              key={character.id}
              className="hero-profile__portrait"
              src={character.image}
              alt={character.name}
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          )}
        </div>

        <span className="hero-profile__class">
          {character.class || "ADVENTURER"}
        </span>

        <h3>{character.name}</h3>

        <div className="hero-profile__level">
          <span>LEVEL {character.level}</span>

          <div className="hero-profile__experience">
            <span
              style={{
                width: `${experience}%`
              }}
            />
          </div>
        </div>
      </div>

      <EquipmentPanel
        equipmentSlots={equipmentSlots}
        equipment={equipment}
        items={items}
        rarities={rarities}
        draggedId={draggedId}
        dropTarget={dropTarget}
        onSelectItem={onSelectItem}
        onEmptySlot={onEmptySlot}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragEnterSlot={onDragEnterSlot}
        onDragLeaveSlot={onDragLeaveSlot}
        onDropItem={onDropItem}
      />

      <div className="character-stats">
        <div className="character-stats__heading">
          <span>CHARACTER ATTRIBUTES</span>

          <Sparkles size={15} />
        </div>

        <div className="character-stats__grid">
          {STAT_CONFIG.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                className="character-stat"
                key={stat.key}
              >
                <Icon size={15} />

                <div>
                  <span>{stat.label}</span>

                  <strong>
                    {formatStat(
                      stats[stat.key] || 0,
                      stat.key
                    )}
                  </strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default CharacterPanel;