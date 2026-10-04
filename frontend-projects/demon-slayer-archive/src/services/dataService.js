import axios from "axios";

const DATA_PATHS = {
  slayers: "/data/slayers.json",
  demons: "/data/demons.json",
  breathingStyles: "/data/breathingStyles.json",
  bloodDemonArts: "/data/bloodDemonArts.json",
  techniques: "/data/techniques.json"
};

export const getSlayers = async () => {
  const response = await axios.get(DATA_PATHS.slayers);
  return response.data;
};

export const getDemons = async () => {
  const response = await axios.get(DATA_PATHS.demons);
  return response.data;
};

export const getBreathingStyles = async () => {
  const response = await axios.get(DATA_PATHS.breathingStyles);
  return response.data;
};

export const getBloodDemonArts = async () => {
  const response = await axios.get(DATA_PATHS.bloodDemonArts);
  return response.data;
};

export const getTechniques = async () => {
  const response = await axios.get(DATA_PATHS.techniques);
  return response.data;
};

export const getAllData = async () => {
  const [
    slayers,
    demons,
    breathingStyles,
    bloodDemonArts,
    techniques
  ] = await Promise.all([
    getSlayers(),
    getDemons(),
    getBreathingStyles(),
    getBloodDemonArts(),
    getTechniques()
  ]);

  return {
    slayers,
    demons,
    breathingStyles,
    bloodDemonArts,
    techniques
  };
};

export const getSlayerById = async (id) => {
  const slayers = await getSlayers();

  return slayers.find((slayer) => slayer.id === id) || null;
};

export const getDemonById = async (id) => {
  const demons = await getDemons();

  return demons.find((demon) => demon.id === id) || null;
};

export const getBreathingStyleById = async (id) => {
  const styles = await getBreathingStyles();

  return styles.find((style) => style.id === id) || null;
};

export const getBloodDemonArtById = async (id) => {
  const arts = await getBloodDemonArts();

  return arts.find((art) => art.id === id) || null;
};

export const getTechniqueById = async (id) => {
  const techniques = await getTechniques();

  return techniques.find((technique) => technique.id === id) || null;
};