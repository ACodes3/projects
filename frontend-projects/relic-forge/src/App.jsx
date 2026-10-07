import { useCallback, useEffect, useMemo, useState } from "react";
import { Compass, ChevronLeft } from "lucide-react";

import { getAllGameData } from "./services/dataService";

import {
  findById,
  getItemRarity,
  getBackpackItems,
  getCharacterStats,
  getEquippedItem,
  filterAndSortItems,
  loadInventoryState,
  saveInventoryState,
  equipItem,
  unequipItem,
} from "./utils/inventoryHelpers";

// Main components
import TopBar from "./components/TopBar";
import EquipmentSidebar from "./components/EquipmentSidebar";
import CharacterPanel from "./components/CharacterPanel";
import InventoryPanel from "./components/InventoryPanel";
import ItemDetails from "./components/ItemDetails";
import BottomBar from "./components/BottomBar";

// Pages
import CharacterPage from "./pages/CharacterPage";
import SkillsPage from "./pages/SkillsPage";
import MapPage from "./pages/MapPage";
import QuestsPage from "./pages/QuestsPage";
import CodexPage from './pages/CodexPage';
import SystemPage from './pages/SystemPage';

const initialFilters = {
  search: "",
  category: "all",
  rarity: "all",
  sortBy: "rarity",
};

function readLocal(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [data, setData] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const [activeTab, setActiveTab] = useState("Inventory");
  const [filters, setFilters] = useState(initialFilters);

  const [favorites, setFavorites] = useState(() =>
    readLocal("relic-forge-favorites", []),
  );

  const [salvage, setSalvage] = useState(() =>
    readLocal("relic-forge-salvage", 1250),
  );

  const [notice, setNotice] = useState(
    "Select an item to inspect its attributes.",
  );

  const [error, setError] = useState("");

  // =========================================
  // LOAD GAME DATA
  // =========================================

  useEffect(() => {
    let isActive = true;

    getAllGameData()
      .then((result) => {
        if (!isActive) return;

        const character = result.characters[0];

        if (!character) {
          throw new Error("No character available.");
        }

        const state = loadInventoryState(
          character,
          result.items,
          result.equipmentSlots,
        );

        setData(result);
        setInventory(state);

        setSelectedId(state.equipment.weapon || state.ownedItemIds[0] || null);
      })
      .catch((e) => {
        if (isActive) {
          setError(e.message || "Could not load inventory.");
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  // =========================================
  // LOCAL STORAGE
  // =========================================

  useEffect(() => {
    if (inventory) {
      saveInventoryState(inventory);
    }
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem("relic-forge-favorites", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem("relic-forge-salvage", JSON.stringify(salvage));
  }, [salvage]);

  // =========================================
  // GAME DATA
  // =========================================

  const character = data?.characters[0];

  const items = useMemo(() => data?.items || [], [data]);

  const rarities = useMemo(() => data?.rarities || [], [data]);

  const selected = useMemo(
    () => findById(items, selectedId),
    [items, selectedId],
  );

  const rarity = getItemRarity(selected, rarities);

  const isEquipped = Boolean(
    selected && Object.values(inventory?.equipment || {}).includes(selected.id),
  );

  const compared = selected?.slotId
    ? getEquippedItem(inventory, selected.slotId, items)
    : null;

  const backpack = useMemo(
    () => (inventory ? getBackpackItems(inventory, items) : []),
    [inventory, items],
  );

  const filteredItems = useMemo(
    () => filterAndSortItems(backpack, filters, rarities),
    [backpack, filters, rarities],
  );

  const stats = useMemo(
    () =>
      character && inventory
        ? getCharacterStats(character, inventory, items)
        : null,
    [character, inventory, items],
  );

  const favorite = selected ? favorites.includes(selected.id) : false;

  const canDismantle = Boolean(
    selected && !isEquipped && inventory?.ownedItemIds.includes(selected.id),
  );

  // =========================================
  // NAVIGATION
  // =========================================

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleBack = useCallback(() => {
    setActiveTab("Inventory");
    setNotice("Inventory ready.");
  }, []);

  // Open an equipment item from Character page
  const handleInspectItem = (itemId) => {
    setSelectedId(itemId);
    setActiveTab("Inventory");

    setFilters(initialFilters);

    setNotice("Inspecting equipped item.");
  };

  // =========================================
  // INVENTORY FILTERS
  // =========================================

  const handleFilter = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  };

  // =========================================
  // EQUIP ITEMS
  // =========================================

  const handleEquip = useCallback(
    (itemId) => {
      const item = findById(items, itemId);

      if (!item || !inventory || !character) return;

      if (!item.slotId) {
        setNotice("This item cannot be equipped.");
        return;
      }

      if (item.level > character.level) {
        setNotice(`Requires level ${item.level} to equip ${item.name}.`);
        return;
      }

      const result = equipItem(inventory, itemId, items, data.equipmentSlots);

      setNotice(result.message);

      if (result.success) {
        setInventory(result.state);
        setSelectedId(itemId);
      }
    },
    [inventory, items, data, character],
  );

  // =========================================
  // UNEQUIP ITEMS
  // =========================================

  const handleUnequip = useCallback(
    (slotId) => {
      if (!inventory || !slotId) return;

      const result = unequipItem(inventory, slotId, items, data.equipmentSlots);

      setNotice(result.message);

      if (result.success) {
        setInventory(result.state);
      }
    },
    [inventory, items, data],
  );

  // =========================================
  // FAVORITES
  // =========================================

  const toggleFavorite = useCallback((itemId) => {
    if (!itemId) return;

    setFavorites((old) =>
      old.includes(itemId)
        ? old.filter((id) => id !== itemId)
        : [...old, itemId],
    );
  }, []);

  // =========================================
  // DISMANTLE
  // =========================================

  const handleDismantle = () => {
    if (!canDismantle || !selected) return;

    const confirmed = window.confirm(
      `Dismantle ${selected.name} for 75 salvage coins? This cannot be undone.`,
    );

    if (!confirmed) return;

    const remainingItems = inventory.ownedItemIds.filter(
      (id) => id !== selected.id,
    );

    setInventory((old) => ({
      ...old,
      ownedItemIds: remainingItems,
    }));

    setFavorites((old) => old.filter((id) => id !== selected.id));

    setSalvage((old) => old + 75);

    setNotice(`${selected.name} dismantled. +75 salvage coins.`);

    setSelectedId(remainingItems[0] || null);
  };

  // =========================================
  // KEYBOARD SHORTCUTS
  // =========================================

  useEffect(() => {
    const onKeyDown = (event) => {
      if (["INPUT", "SELECT", "TEXTAREA"].includes(event.target?.tagName))
        return;

      if (event.key === "Escape") {
        event.preventDefault();
        handleBack();
      }

      if (activeTab !== "Inventory") return;

      if (event.key.toLowerCase() === "f" && selectedId) {
        event.preventDefault();
        toggleFavorite(selectedId);
      }

      if (event.key.toLowerCase() === "r" && isEquipped && selected?.slotId) {
        event.preventDefault();
        handleUnequip(selected.slotId);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [
    activeTab,
    selectedId,
    selected,
    isEquipped,
    handleBack,
    handleUnequip,
    toggleFavorite,
  ]);

  // =========================================
  // LOADING / ERRORS
  // =========================================

  if (error) {
    return (
      <main className="app-feedback">
        <h1>Relic Forge</h1>
        <p>{error}</p>
      </main>
    );
  }

  if (!data || !character || !inventory || !stats) {
    return (
      <main className="app-feedback">
        <h1>Relic Forge</h1>
        <p>Opening the armory…</p>
      </main>
    );
  }

  // =========================================
  // MAIN APP
  // =========================================

  return (
    <div className="relic-app">
      {/* NAVBAR */}
      <TopBar
        character={character}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* INVENTORY PAGE */}
      {activeTab === "Inventory" && (
        <main className="main-layout">
          <EquipmentSidebar
            slots={data.equipmentSlots}
            items={items}
            equipment={inventory.equipment}
            rarities={rarities}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />

          <CharacterPanel character={character} stats={stats} />

          <InventoryPanel
            items={filteredItems}
            rarities={rarities}
            selectedId={selectedId}
            filters={filters}
            onFilterChange={handleFilter}
            onSelect={setSelectedId}
            favorites={favorites}
            onFavorite={toggleFavorite}
            capacity={backpack.length}
          />

          <ItemDetails
            item={selected}
            rarity={rarity}
            characterLevel={character.level}
            equipped={isEquipped}
            comparedItem={compared}
            favorite={favorite}
            onEquip={handleEquip}
            onUnequip={handleUnequip}
            onFavorite={toggleFavorite}
          />
        </main>
      )}

      {/* CHARACTER PAGE */}
      {activeTab === "Character" && (
        <CharacterPage
          character={character}
          stats={stats}
          equipment={inventory.equipment}
          items={items}
          slots={data.equipmentSlots}
          rarities={rarities}
          onInspectItem={handleInspectItem}
          onOpenInventory={handleBack}
        />
      )}

      {/* SKILLS PAGE */}
      {activeTab === "Skills" && <SkillsPage character={character} />}

      {/* MAP PAGE */}
      {activeTab === "Map" && <MapPage character={character} />}

      {/* QUESTS PAGE */}
      {activeTab === "Quests" && <QuestsPage character={character} />}

      {/* CODEX PAGE */}
      {activeTab === "Codex" && <CodexPage character={character} />}

      {/* SYSTEM PAGE */}
      {activeTab === "System" && <SystemPage character={character} />}

      {/* FUTURE PAGES */}
      {!["Inventory", "Character", "Skills", "Map", "Quests", "Codex", "System"].includes(activeTab) && (
        <main className="other-section">
          <div className="other-section__crest">
            <Compass size={46} strokeWidth={1} />
          </div>

          <span className="other-section__eyebrow">Relic Forge</span>

          <h1>{activeTab === "Home" ? "The Armory" : activeTab}</h1>

          <p>
            This section is currently being forged. Return to your inventory to
            prepare for battle.
          </p>

          <button type="button" onClick={handleBack}>
            <ChevronLeft size={16} />
            Return to Inventory
          </button>
        </main>
      )}

      {/* FOOTER */}
      <BottomBar
        notice={notice}
        isEquipped={isEquipped && activeTab === "Inventory"}
        canDismantle={canDismantle && activeTab === "Inventory"}
        favorite={favorite}
        salvage={salvage}
        onBack={handleBack}
        onUnequip={() => selected?.slotId && handleUnequip(selected.slotId)}
        onFavorite={() => toggleFavorite(selectedId)}
        onDismantle={handleDismantle}
      />
    </div>
  );
}
