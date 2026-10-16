export const findById = (items = [], id) => {
  return items.find((item) => item.id === id) || null;
};

export const findManyByIds = (items = [], ids = []) => {
  return ids
    .map((id) => items.find((item) => item.id === id))
    .filter(Boolean);
};

export const getSlayerBreathingStyles = (
  slayer,
  breathingStyles
) => {
  return findManyByIds(
    breathingStyles,
    slayer?.breathingStyleIds || []
  );
};

export const getSlayerTechniques = (
  slayer,
  techniques
) => {
  return findManyByIds(
    techniques,
    slayer?.techniqueIds || []
  );
};

export const getDemonBloodArts = (
  demon,
  bloodDemonArts
) => {
  return findManyByIds(
    bloodDemonArts,
    demon?.bloodDemonArtIds || []
  );
};

export const getBreathingStyleUsers = (
  breathingStyle,
  slayers
) => {
  return findManyByIds(
    slayers,
    breathingStyle?.userIds || []
  );
};

export const getBreathingStyleTechniques = (
  breathingStyle,
  techniques
) => {
  return findManyByIds(
    techniques,
    breathingStyle?.techniqueIds || []
  );
};

export const getBloodDemonArtUser = (
  bloodDemonArt,
  demons
) => {
  return findById(
    demons,
    bloodDemonArt?.userId
  );
};

export const getBloodDemonArtTechniques = (
  bloodDemonArt,
  techniques
) => {
  return findManyByIds(
    techniques,
    bloodDemonArt?.abilityIds || []
  );
};

export const getTechniqueUsers = (
  technique,
  characters
) => {
  return findManyByIds(
    characters,
    technique?.userIds || []
  );
};

export const getTechniqueParent = (
  technique,
  breathingStyles,
  bloodDemonArts
) => {
  if (!technique) {
    return null;
  }

  if (technique.category === "breathing") {
    return findById(
      breathingStyles,
      technique.parentId
    );
  }

  if (technique.category === "blood-demon-art") {
    return findById(
      bloodDemonArts,
      technique.parentId
    );
  }

  return null;
};