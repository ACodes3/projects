import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api",
});

// ==========================================
// CONVERT API DATA TO FRONTEND FORMAT
// ==========================================

const toCamelCase = (key) => {
  return key.replace(
    /_([a-z])/g,
    (_, letter) => letter.toUpperCase()
  );
};

const normalizeData = (value) => {
  if (Array.isArray(value)) {
    return value.map(normalizeData);
  }

  if (
    value !== null &&
    typeof value === "object"
  ) {
    return Object.fromEntries(
      Object.entries(value).map(
        ([key, item]) => [
          toCamelCase(key),
          normalizeData(item),
        ]
      )
    );
  }

  return value;
};

// ==========================================
// COLLECTION REQUEST
// ==========================================

const getCollection = async (endpoint) => {
  const response = await api.get(endpoint, {
    params: {
      limit: 100,
    },
  });

  return normalizeData(response.data.data);
};

// ==========================================
// COLLECTIONS
// ==========================================

export const getSlayers = async () => {
  return getCollection("/slayers");
};

export const getDemons = async () => {
  return getCollection("/demons");
};

export const getBreathingStyles = async () => {
  return getCollection("/breathing-styles");
};

export const getBloodDemonArts = async () => {
  return getCollection("/blood-demon-arts");
};

export const getTechniques = async () => {
  return getCollection("/techniques");
};

// ==========================================
// ALL DATA
// ==========================================

export const getAllData = async () => {
  const [
    slayers,
    demons,
    breathingStyles,
    bloodDemonArts,
    techniques,
  ] = await Promise.all([
    getSlayers(),
    getDemons(),
    getBreathingStyles(),
    getBloodDemonArts(),
    getTechniques(),
  ]);

  return {
    slayers,
    demons,
    breathingStyles,
    bloodDemonArts,
    techniques,
  };
};

// ==========================================
// GET ONE BY ID
// ==========================================

const getById = async (endpoint, id) => {
  try {
    const response = await api.get(
      `${endpoint}/${id}`
    );

    return normalizeData(response.data);
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }

    throw error;
  }
};

export const getSlayerById = async (id) => {
  return getById("/slayers", id);
};

export const getDemonById = async (id) => {
  return getById("/demons", id);
};

export const getBreathingStyleById = async (
  id
) => {
  return getById("/breathing-styles", id);
};

export const getBloodDemonArtById = async (
  id
) => {
  return getById("/blood-demon-arts", id);
};

export const getTechniqueById = async (id) => {
  return getById("/techniques", id);
};