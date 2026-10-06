
const DATA_PATHS = {
  items: "data/items.json",
  equipmentSlots: "data/equipmentSlots.json",
  rarities: "data/rarities.json",
  characters: "data/characters.json"
};

const BASE_URL = import.meta.env.BASE_URL;

const fetchData = async (path) => {
  const response = await fetch(`${BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error(
      `Failed to load ${path}: ${response.status}`
    );
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error(
      `Invalid data format in ${path}. Expected an array.`
    );
  }

  return data;
};

// ITEMS

export const getItems = async () => {
  return fetchData(DATA_PATHS.items);
};

export const getItemById = async (id) => {
  const items = await getItems();

  return items.find((item) => item.id === id) || null;
};

// EQUIPMENT SLOTS

export const getEquipmentSlots = async () => {
  return fetchData(DATA_PATHS.equipmentSlots);
};

export const getEquipmentSlotById = async (id) => {
  const slots = await getEquipmentSlots();

  return slots.find((slot) => slot.id === id) || null;
};

// RARITIES

export const getRarities = async () => {
  return fetchData(DATA_PATHS.rarities);
};

export const getRarityById = async (id) => {
  const rarities = await getRarities();

  return rarities.find((rarity) => rarity.id === id) || null;
};

// CHARACTERS

export const getCharacters = async () => {
  return fetchData(DATA_PATHS.characters);
};

export const getCharacterById = async (id) => {
  const characters = await getCharacters();

  return characters.find(
    (character) => character.id === id
  ) || null;
};

// LOAD EVERYTHING

export const getAllGameData = async () => {
  const [
    items,
    equipmentSlots,
    rarities,
    characters
  ] = await Promise.all([
    getItems(),
    getEquipmentSlots(),
    getRarities(),
    getCharacters()
  ]);

  return {
    items,
    equipmentSlots,
    rarities,
    characters
  };
};
