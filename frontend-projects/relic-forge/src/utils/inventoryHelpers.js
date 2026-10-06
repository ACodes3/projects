
export const STAT_KEYS = [
  "attack",
  "defense",
  "health",
  "crit"
];

const SAVE_PREFIX = "relic-forge-save-v1";

// ==========================================
// GENERAL DATA HELPERS
// ==========================================

export const findById = (items = [], id) => {
  return items.find((item) => item.id === id) || null;
};

export const findManyByIds = (items = [], ids = []) => {
  return ids
    .map((id) => findById(items, id))
    .filter(Boolean);
};

export const getItemRarity = (item, rarities = []) => {
  if (!item) return null;

  return findById(rarities, item.rarityId);
};

export const getItemSlot = (item, equipmentSlots = []) => {
  if (!item) return null;

  return findById(equipmentSlots, item.slotId);
};

// ==========================================
// EQUIPMENT LOOKUPS
// ==========================================

export const getEquippedItem = (
  state,
  slotId,
  items = []
) => {
  const itemId = state?.equipment?.[slotId];

  return findById(items, itemId);
};

export const getEquippedItems = (
  state,
  items = []
) => {
  const equippedIds = Object.values(
    state?.equipment || {}
  ).filter(Boolean);

  return findManyByIds(items, equippedIds);
};

export const getBackpackItems = (
  state,
  items = []
) => {
  const ownedIds = state?.ownedItemIds || [];

  const equippedIds = new Set(
    Object.values(state?.equipment || {}).filter(Boolean)
  );

  return findManyByIds(items, ownedIds).filter(
    (item) => !equippedIds.has(item.id)
  );
};

export const isItemEquipped = (state, itemId) => {
  return Object.values(
    state?.equipment || {}
  ).includes(itemId);
};

export const isItemOwned = (state, itemId) => {
  return (
    state?.ownedItemIds?.includes(itemId) || false
  );
};

// ==========================================
// CHARACTER STAT CALCULATIONS
// ==========================================

export const getCharacterStats = (
  character,
  state,
  items = []
) => {
  const totals = {};

  STAT_KEYS.forEach((key) => {
    totals[key] = Number(
      character?.baseStats?.[key] || 0
    );
  });

  const equippedItems = getEquippedItems(
    state,
    items
  );

  equippedItems.forEach((item) => {
    STAT_KEYS.forEach((key) => {
      totals[key] += Number(
        item.stats?.[key] || 0
      );
    });
  });

  return totals;
};

// ==========================================
// ITEM STAT COMPARISON
// ==========================================

export const getItemComparison = (
  selectedItem,
  currentlyEquippedItem = null
) => {
  if (!selectedItem) return null;

  const comparison = {};

  STAT_KEYS.forEach((key) => {
    const next = Number(
      selectedItem.stats?.[key] || 0
    );

    const current = Number(
      currentlyEquippedItem?.stats?.[key] || 0
    );

    comparison[key] = {
      current,
      next,
      difference: next - current
    };
  });

  return comparison;
};

// ==========================================
// FILTERING AND SORTING
// ==========================================

export const filterAndSortItems = (
  items = [],
  filters = {},
  rarities = []
) => {
  const {
    search = "",
    category = "all",
    rarity = "all",
    sortBy = "rarity"
  } = filters;

  const query = String(search).trim().toLowerCase();

  const selectedCategory = String(
    category
  ).toLowerCase();

  const selectedRarity = String(
    rarity
  ).toLowerCase();

  const filteredItems = items.filter((item) => {
    const itemName = item.name?.toLowerCase() || "";
    const itemCategory = item.category?.toLowerCase() || "";
    const itemSlot = item.slotId?.toLowerCase() || "";
    const itemRarity = item.rarityId?.toLowerCase() || "";

    const matchesSearch =
      !query ||
      itemName.includes(query) ||
      itemCategory.includes(query) ||
      itemSlot.includes(query) ||
      itemRarity.includes(query);

    const matchesCategory =
      selectedCategory === "all" ||
      itemCategory === selectedCategory;

    const matchesRarity =
      selectedRarity === "all" ||
      itemRarity === selectedRarity;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesRarity
    );
  });

  return filteredItems.sort((a, b) => {
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    }

    if (sortBy === "level") {
      return (b.level || 0) - (a.level || 0);
    }

    const rarityA =
      getItemRarity(a, rarities)?.tier || 0;

    const rarityB =
      getItemRarity(b, rarities)?.tier || 0;

    return (
      rarityB - rarityA ||
      (b.level || 0) - (a.level || 0) ||
      a.name.localeCompare(b.name)
    );
  });
};

// ==========================================
// EQUIPMENT VALIDATION
// ==========================================

export const canEquipItem = (
  item,
  targetSlotId,
  equipmentSlots = []
) => {
  if (!item) {
    return {
      valid: false,
      message: "Item not found."
    };
  }

  const slot = findById(
    equipmentSlots,
    targetSlotId
  );

  if (!slot) {
    return {
      valid: false,
      message: "Equipment slot not found."
    };
  }

  if (item.slotId !== targetSlotId) {
    return {
      valid: false,
      message:
        `${item.name} cannot be equipped in the ${slot.name} slot.`
    };
  }

  return {
    valid: true,
    message: "Compatible equipment slot."
  };
};

// ==========================================
// INITIAL CHARACTER INVENTORY
// ==========================================

export const createInitialInventoryState = (
  character,
  items = [],
  equipmentSlots = []
) => {
  const itemMap = new Map(
    items.map((item) => [item.id, item])
  );

  const ownedIds = new Set(
    (character?.startingInventoryItemIds || [])
      .filter((id) => itemMap.has(id))
  );

  const equipment = {};

  equipmentSlots.forEach((slot) => {
    const itemId =
      character?.startingEquipment?.[slot.id] || null;

    const item = itemMap.get(itemId);

    if (item && item.slotId === slot.id) {
      equipment[slot.id] = item.id;
      ownedIds.add(item.id);
    } else {
      equipment[slot.id] = null;
    }
  });

  return {
    characterId: character?.id || null,
    ownedItemIds: Array.from(ownedIds),
    equipment
  };
};

// ==========================================
// VALIDATE LOADED SAVE DATA
// ==========================================

export const normalizeInventoryState = (
  savedState,
  character,
  items = [],
  equipmentSlots = []
) => {
  const initialState = createInitialInventoryState(
    character,
    items,
    equipmentSlots
  );

  if (
    !savedState ||
    savedState.characterId !== character?.id ||
    !Array.isArray(savedState.ownedItemIds) ||
    !savedState.equipment ||
    typeof savedState.equipment !== "object" ||
    Array.isArray(savedState.equipment)
  ) {
    return initialState;
  }

  const validItemIds = new Set(
    items.map((item) => item.id)
  );

  const ownedItemIds = Array.from(
    new Set(
      savedState.ownedItemIds.filter(
        (id) => validItemIds.has(id)
      )
    )
  );

  const ownedSet = new Set(ownedItemIds);

  const equipment = {};

  equipmentSlots.forEach((slot) => {
    const itemId =
      savedState.equipment[slot.id] || null;

    const item = findById(items, itemId);

    if (
      item &&
      ownedSet.has(item.id) &&
      item.slotId === slot.id
    ) {
      equipment[slot.id] = item.id;
    } else {
      equipment[slot.id] = null;
    }
  });

  return {
    characterId: character.id,
    ownedItemIds,
    equipment
  };
};

// ==========================================
// LOCAL STORAGE
// ==========================================

const getSaveKey = (characterId) => {
  return `${SAVE_PREFIX}-${characterId}`;
};

export const loadInventoryState = (
  character,
  items = [],
  equipmentSlots = []
) => {
  const initialState = createInitialInventoryState(
    character,
    items,
    equipmentSlots
  );

  if (!character || typeof window === "undefined") {
    return initialState;
  }

  try {
    const saved = window.localStorage.getItem(
      getSaveKey(character.id)
    );

    if (!saved) {
      return initialState;
    }

    return normalizeInventoryState(
      JSON.parse(saved),
      character,
      items,
      equipmentSlots
    );
  } catch (error) {
    console.error(
      "Failed to load inventory save:",
      error
    );

    return initialState;
  }
};

export const saveInventoryState = (state) => {
  if (
    !state?.characterId ||
    typeof window === "undefined"
  ) {
    return false;
  }

  try {
    window.localStorage.setItem(
      getSaveKey(state.characterId),
      JSON.stringify(state)
    );

    return true;
  } catch (error) {
    console.error(
      "Failed to save inventory:",
      error
    );

    return false;
  }
};

// ==========================================
// EQUIP AN ITEM
// ==========================================

export const equipItem = (
  state,
  itemId,
  items = [],
  equipmentSlots = [],
  targetSlotId = null
) => {
  if (!state) {
    return {
      success: false,
      state,
      message: "Inventory has not been initialized."
    };
  }

  const item = findById(items, itemId);

  if (!item) {
    return {
      success: false,
      state,
      message: "Item not found."
    };
  }

  if (!isItemOwned(state, itemId)) {
    return {
      success: false,
      state,
      message: "This item is not in your inventory."
    };
  }

  const slotId = targetSlotId || item.slotId;

  const validation = canEquipItem(
    item,
    slotId,
    equipmentSlots
  );

  if (!validation.valid) {
    return {
      success: false,
      state,
      message: validation.message
    };
  }

  if (state.equipment?.[slotId] === item.id) {
    return {
      success: false,
      state,
      message: `${item.name} is already equipped.`
    };
  }

  const replacedItemId =
    state.equipment?.[slotId] || null;

  const replacedItem = findById(
    items,
    replacedItemId
  );

  const newState = {
    ...state,
    equipment: {
      ...state.equipment,
      [slotId]: item.id
    }
  };

  return {
    success: true,
    state: newState,
    replacedItem,
    message: replacedItem
      ? `${item.name} equipped. ${replacedItem.name} returned to your backpack.`
      : `${item.name} equipped successfully.`
  };
};

// ==========================================
// UNEQUIP AN ITEM
// ==========================================

export const unequipItem = (
  state,
  slotId,
  items = [],
  equipmentSlots = []
) => {
  if (!state) {
    return {
      success: false,
      state,
      message: "Inventory has not been initialized."
    };
  }

  const slot = findById(
    equipmentSlots,
    slotId
  );

  if (!slot) {
    return {
      success: false,
      state,
      message: "Equipment slot not found."
    };
  }

  const itemId =
    state.equipment?.[slotId] || null;

  if (!itemId) {
    return {
      success: false,
      state,
      message: `${slot.name} is already empty.`
    };
  }

  const item = findById(items, itemId);

  const newState = {
    ...state,
    equipment: {
      ...state.equipment,
      [slotId]: null
    }
  };

  return {
    success: true,
    state: newState,
    message: item
      ? `${item.name} returned to your backpack.`
      : `${slot.name} slot cleared.`
  };
};
