import { useEffect, useMemo, useState } from "react";
import {
  Sword,
  Shield,
  Sparkles,
  Search,
  ChevronDown,
  Crown,
  Shirt,
  Hand,
  Footprints,
  CircleDot,
  Gem,
  Coins,
  Droplets,
  X,
  User
} from "lucide-react";

import { getAllGameData } from "./services/dataService";
import {
  findById,
  getItemRarity,
  getBackpackItems,
  getCharacterStats,
  getItemComparison,
  getEquippedItem,
  filterAndSortItems,
  loadInventoryState,
  saveInventoryState,
  equipItem,
  unequipItem
} from "./utils/inventoryHelpers";

const SLOT_ICONS = {
  head: Crown,
  chest: Shirt,
  hands: Hand,
  feet: Footprints,
  weapon: Sword,
  ring: CircleDot,
  amulet: Gem
};

const TOP_MENU = [
  "Inventory",
  "Character",
  "Skills",
  "Map",
  "Quests",
  "Codex",
  "System"
];

const INITIAL_FILTERS = {
  search: "",
  category: "all",
  rarity: "all",
  sortBy: "rarity"
};

function formatStat(value, key) {
  return key === "crit" ? `${value}%` : value;
}

function getItemPower(item) {
  if (!item) return 0;

  const attack = Number(item.stats?.attack || 0);
  const defense = Number(item.stats?.defense || 0);
  const health = Number(item.stats?.health || 0);
  const crit = Number(item.stats?.crit || 0);

  return Math.round(
    attack * 12 + defense * 8 + health * 1.5 + crit * 15
  );
}

function getSlotLabel(slotId) {
  const labels = {
    weapon: "Weapon",
    head: "Head",
    chest: "Chest",
    hands: "Hands",
    feet: "Feet",
    ring: "Ring",
    amulet: "Amulet"
  };

  return labels[slotId] || slotId;
}

function ItemThumb({
  item = null,
  slotId = null,
  size = "small"
}) {
  const currentSlot = item?.slotId || slotId;
  const Icon = SLOT_ICONS[currentSlot] || Sword;

  return (
    <div className={`rf-thumb rf-thumb--${size}`}>
      <Icon
        className="rf-thumb__icon"
        size={size === "large" ? 64 : size === "detail" ? 92 : 24}
        strokeWidth={1.65}
      />

      {item?.image && (
        <img
          src={item.image}
          alt={item.name}
          className="rf-thumb__image"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      )}
    </div>
  );
}

function App() {
  const [gameData, setGameData] = useState(null);
  const [inventoryState, setInventoryState] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [notice, setNotice] = useState(
    "Select an item to inspect, equip, or unequip it."
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        const data = await getAllGameData();

        if (!active) return;

        const character = data.characters[0];

        if (!character) {
          throw new Error("No character found in characters.json.");
        }

        const savedState = loadInventoryState(
          character,
          data.items,
          data.equipmentSlots
        );

        const firstSelectedId =
          savedState.ownedItemIds.includes("duskreaver")
            ? "duskreaver"
            : savedState.ownedItemIds[0] || null;

        setGameData(data);
        setInventoryState(savedState);
        setSelectedItemId(firstSelectedId);
      } catch (loadError) {
        console.error(loadError);
        setError("Could not load Relic Forge data.");
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (inventoryState) {
      saveInventoryState(inventoryState);
    }
  }, [inventoryState]);

  const character = gameData?.characters?.[0] || null;
  const items = gameData?.items || [];
  const equipmentSlots = gameData?.equipmentSlots || [];
  const rarities = gameData?.rarities || [];

  const selectedItem = useMemo(() => {
    return findById(items, selectedItemId);
  }, [items, selectedItemId]);

  const selectedRarity = useMemo(() => {
    return getItemRarity(selectedItem, rarities);
  }, [selectedItem, rarities]);

  const backpackItems = useMemo(() => {
    if (!inventoryState) return [];
    return getBackpackItems(inventoryState, items);
  }, [inventoryState, items]);

  const visibleItems = useMemo(() => {
    return filterAndSortItems(backpackItems, filters, rarities);
  }, [backpackItems, filters, rarities]);

  const characterStats = useMemo(() => {
    if (!character || !inventoryState) {
      return {
        attack: 0,
        defense: 0,
        health: 0,
        crit: 0
      };
    }

    return getCharacterStats(character, inventoryState, items);
  }, [character, inventoryState, items]);

  const equippedSlotId = useMemo(() => {
    if (!selectedItem || !inventoryState) return null;

    const entry = Object.entries(inventoryState.equipment || {}).find(
      ([, itemId]) => itemId === selectedItem.id
    );

    return entry?.[0] || null;
  }, [selectedItem, inventoryState]);

  const currentlyEquippedItem = useMemo(() => {
    if (!selectedItem || !inventoryState) return null;

    return getEquippedItem(
      inventoryState,
      selectedItem.slotId,
      items
    );
  }, [selectedItem, inventoryState, items]);

  const comparison = useMemo(() => {
    if (!selectedItem) return null;
    return getItemComparison(selectedItem, currentlyEquippedItem);
  }, [selectedItem, currentlyEquippedItem]);

  const equippedItems = useMemo(() => {
    return equipmentSlots.map((slot) => {
      const itemId = inventoryState?.equipment?.[slot.id] || null;
      const item = findById(items, itemId);
      const rarity = getItemRarity(item, rarities);

      return {
        slot,
        item,
        rarity
      };
    });
  }, [equipmentSlots, inventoryState, items, rarities]);

  const handleFilterChange = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value
    }));
  };

  const handleEquip = (itemId) => {
    if (!inventoryState) return;

    const result = equipItem(
      inventoryState,
      itemId,
      items,
      equipmentSlots
    );

    setNotice(result.message);

    if (result.success) {
      setInventoryState(result.state);
      setSelectedItemId(itemId);
    }
  };

  const handleUnequip = (slotId) => {
    if (!inventoryState) return;

    const currentItemId = inventoryState.equipment?.[slotId];

    const result = unequipItem(
      inventoryState,
      slotId,
      items,
      equipmentSlots
    );

    setNotice(result.message);

    if (result.success) {
      setInventoryState(result.state);

      if (currentItemId) {
        setSelectedItemId(currentItemId);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="rf-app">
        <div className="rf-state-screen">
          <h1>Loading Armory...</h1>
          <p>Preparing Relic Forge.</p>
        </div>
      </div>
    );
  }

  if (error || !gameData || !character || !inventoryState) {
    return (
      <div className="rf-app">
        <div className="rf-state-screen">
          <h1>Archive Error</h1>
          <p>{error || "Could not initialize the inventory."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rf-app">
      {/* TOP BAR */}
      <header className="rf-topbar">
        <div className="rf-player">
          <div className="rf-player__portrait">
            {character.image ? (
              <img
                src={character.image}
                alt={character.name}
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <User size={22} />
            )}
          </div>

          <div className="rf-player__meta">
            <strong>{character.name.toUpperCase()}</strong>

            <div className="rf-player__subline">
              <span>Level {character.level}</span>
              <span>{Math.round((character.experience || 68) * 270)}/27,000</span>
            </div>

            <div className="rf-player__xp">
              <span
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(0, character.experience || 68)
                  )}%`
                }}
              />
            </div>
          </div>
        </div>

        <nav className="rf-nav">
          {TOP_MENU.map((item) => (
            <button
              key={item}
              type="button"
              className={`rf-nav__button ${
                item === "Inventory" ? "active" : ""
              }`}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="rf-topbar__right">
          <div className="rf-currency">
            <span>
              <Coins size={13} />
              128,467
            </span>
            <span>
              <Gem size={13} />
              2,850
            </span>
            <span>
              <Droplets size={13} />
              640
            </span>
          </div>

          <button type="button" className="rf-close">
            <X size={14} />
          </button>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <main className="rf-layout">
        {/* EQUIPPED */}
        <aside className="rf-panel rf-equipped">
          <div className="rf-panel__title">Equipped</div>

          <div className="rf-equipped__list">
            {equippedItems.map(({ slot, item, rarity }) => (
              <button
                key={slot.id}
                type="button"
                className={`rf-equipped-card ${
                  selectedItemId === item?.id ? "selected" : ""
                }`}
                onClick={() => {
                  if (item) setSelectedItemId(item.id);
                }}
              >
                <div
                  className="rf-equipped-card__thumb"
                  style={{
                    "--rarity-color": rarity?.color || "#7c725f"
                  }}
                >
                  <ItemThumb item={item} slotId={slot.id} size="small" />
                </div>

                <div className="rf-equipped-card__content">
                  <strong>{item?.name || `Empty ${slot.name}`}</strong>
                  <small>
                    {item
                      ? `${rarity?.name || "Common"} ${item.category}`
                      : getSlotLabel(slot.id)}
                  </small>
                  <span>
                    {item
                      ? `${
                          item.slotId === "weapon"
                            ? item.stats?.attack || 0
                            : item.stats?.defense ||
                              item.stats?.health ||
                              item.stats?.crit ||
                              0
                        } ${item.slotId === "weapon" ? "Power" : "Armor"}`
                      : "—"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* CHARACTER */}
        <section className="rf-panel rf-character">
          <div className="rf-character__stage">
            {character.image ? (
              <img
                src={character.image}
                alt={character.name}
                className="rf-character__image"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="rf-character__placeholder">
                <User size={92} />
              </div>
            )}
          </div>

          <div className="rf-character__stats">
            <div className="rf-primary-stats">
              <div>
                <span>
                  <Sword size={13} />
                  Attack
                </span>
                <strong>{characterStats.attack}</strong>
              </div>

              <div>
                <span>
                  <Shield size={13} />
                  Defense
                </span>
                <strong>{characterStats.defense}</strong>
              </div>

              <div>
                <span>
                  <Sparkles size={13} />
                  Magic
                </span>
                <strong>{Math.round(characterStats.crit * 42)}</strong>
              </div>
            </div>

            <div className="rf-secondary-stats">
              <div><span>Strength</span><strong>{Math.round(characterStats.attack / 5)}</strong></div>
              <div><span>Dexterity</span><strong>{Math.round(characterStats.crit + 18)}</strong></div>
              <div><span>Intelligence</span><strong>{Math.round(characterStats.defense / 4)}</strong></div>
              <div><span>Vitality</span><strong>{Math.round(characterStats.health / 3)}</strong></div>
              <div><span>Luck</span><strong>{Math.max(10, characterStats.crit * 2)}</strong></div>
            </div>
          </div>
        </section>

        {/* INVENTORY */}
        <section className="rf-panel rf-inventory">
          <div className="rf-panel__title rf-panel__title--inventory">
            <span>Inventory</span>

            <div className="rf-panel__filters">
              <div className="rf-select">
                <select
                  value={filters.category}
                  onChange={(event) =>
                    handleFilterChange("category", event.target.value)
                  }
                >
                  <option value="all">All</option>
                  <option value="weapon">Weapons</option>
                  <option value="armor">Armor</option>
                  <option value="accessory">Accessories</option>
                </select>
                <ChevronDown size={14} />
              </div>

              <div className="rf-select">
                <select
                  value={filters.rarity}
                  onChange={(event) =>
                    handleFilterChange("rarity", event.target.value)
                  }
                >
                  <option value="all">All Rarities</option>
                  {rarities.map((rarity) => (
                    <option key={rarity.id} value={rarity.id}>
                      {rarity.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} />
              </div>

              <div className="rf-select">
                <select
                  value={filters.sortBy}
                  onChange={(event) =>
                    handleFilterChange("sortBy", event.target.value)
                  }
                >
                  <option value="rarity">Sort Rarity</option>
                  <option value="level">Sort Level</option>
                  <option value="name">Sort Name</option>
                </select>
                <ChevronDown size={14} />
              </div>
            </div>
          </div>

          <div className="rf-searchbar">
            <Search size={15} />
            <input
              type="text"
              placeholder="Search inventory..."
              value={filters.search}
              onChange={(event) =>
                handleFilterChange("search", event.target.value)
              }
            />
          </div>

          <div className="rf-grid">
            {visibleItems.length > 0 ? (
              visibleItems.map((item) => {
                const rarity = getItemRarity(item, rarities);

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`rf-grid__item ${
                      selectedItemId === item.id ? "selected" : ""
                    }`}
                    style={{
                      "--rarity-color": rarity?.color || "#7f7560"
                    }}
                    onClick={() => setSelectedItemId(item.id)}
                  >
                    <div className="rf-grid__thumb">
                      <ItemThumb item={item} size="large" />
                    </div>

                    <div className="rf-grid__value">
                      {getItemPower(item)}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="rf-grid__empty">
                No items match your filters.
              </div>
            )}
          </div>

          <div className="rf-grid__footer">
            <span>{backpackItems.length} / 100</span>
            <span>{filters.sortBy.toUpperCase()}</span>
          </div>
        </section>

        {/* DETAILS */}
        <aside className="rf-panel rf-details">
          <div className="rf-panel__title">Item Details</div>

          {selectedItem ? (
            <div className="rf-details__content">
              <div className="rf-details__header">
                <div>
                  <h2>{selectedItem.name}</h2>
                  <p>
                    {(selectedRarity?.name || "Common")}{" "}
                    {selectedItem.category}
                  </p>
                </div>

                <div className="rf-details__art">
                  <ItemThumb item={selectedItem} size="detail" />
                </div>
              </div>

              <div className="rf-details__power">
                <strong>{getItemPower(selectedItem)}</strong>
                <span>
                  {selectedItem.slotId === "weapon"
                    ? "Weapon Power"
                    : "Equipment Rating"}
                </span>
              </div>

              <div className="rf-details__stats">
                <div><span>Attack</span><strong>{selectedItem.stats?.attack || 0}</strong></div>
                <div><span>Defense</span><strong>{selectedItem.stats?.defense || 0}</strong></div>
                <div><span>Health</span><strong>{selectedItem.stats?.health || 0}</strong></div>
                <div><span>Crit</span><strong>{formatStat(selectedItem.stats?.crit || 0, "crit")}</strong></div>
              </div>

              <ul className="rf-details__comparison">
                {Object.entries(comparison || {}).map(([key, value]) => {
                  const diff = value?.difference || 0;

                  return (
                    <li
                      key={key}
                      className={
                        diff > 0 ? "positive" : diff < 0 ? "negative" : ""
                      }
                    >
                      {diff > 0 ? "+" : ""}
                      {formatStat(diff, key)} {key}
                    </li>
                  );
                })}
              </ul>

              <div className="rf-details__meta">
                <span>Required Level {selectedItem.level}</span>
                <span>Slot: {getSlotLabel(selectedItem.slotId)}</span>
              </div>

              <div className="rf-details__description">
                {selectedItem.description}
              </div>

              {equippedSlotId ? (
                <button
                  type="button"
                  className="rf-details__button rf-details__button--equipped"
                  onClick={() => handleUnequip(equippedSlotId)}
                >
                  Equipped
                </button>
              ) : (
                <button
                  type="button"
                  className="rf-details__button"
                  onClick={() => handleEquip(selectedItem.id)}
                >
                  Equip
                </button>
              )}
            </div>
          ) : (
            <div className="rf-details__empty">
              Select an item.
            </div>
          )}
        </aside>
      </main>

      {/* FOOTER */}
      <footer className="rf-footer">
        <div className="rf-footer__shortcut"><span>Esc</span>Back</div>
        <div className="rf-footer__shortcut"><span>R</span>Unequip</div>
        <div className="rf-footer__shortcut"><span>F</span>Favorite</div>

        <div className="rf-footer__notice">{notice}</div>
      </footer>
    </div>
  );
}

export default App;