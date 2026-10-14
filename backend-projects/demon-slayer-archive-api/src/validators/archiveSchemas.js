
import { z } from "zod";

// Common validation rules
const slug = z.string()
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Must be a lowercase slug, e.g. tanjiro-kamado"
  );

const name = z.string().trim().min(1).max(150);

const description = z.string().max(10000);

const idArray = z.array(slug);

const optionalImage = z.string().nullable();

const jsonObject = z.record(
  z.string(),
  z.unknown()
);

// Slayer
export const slayerSchema = z.strictObject({
  id: slug,
  name,
  rank: z.string().nullable().default(null),
  breathing_style_ids: idArray.default([]),
  technique_ids: idArray.default([]),
  related_character_ids: idArray.default([]),
  description: description.default(""),
  stats: jsonObject.default({}),
  image: optionalImage.default(null)
});

// Demon
export const demonSchema = z.strictObject({
  id: slug,
  name,
  rank: z.string().nullable().default(null),
  blood_demon_art_ids: idArray.default([]),
  ability_ids: idArray.default([]),
  related_character_ids: idArray.default([]),
  description: description.default(""),
  stats: jsonObject.default({}),
  image: optionalImage.default(null)
});

// Breathing Style
export const breathingStyleSchema = z.strictObject({
  id: slug,
  name,
  derived_from_id: slug.nullable().default(null),
  user_ids: idArray.default([]),
  technique_ids: idArray.default([]),
  description: description.default(""),
  theme: jsonObject.default({}),
  image: optionalImage.default(null)
});

// Blood Demon Art
export const bloodDemonArtSchema = z.strictObject({
  id: slug,
  name,
  user_id: slug.nullable().default(null),
  ability_ids: idArray.default([]),
  description: description.default(""),
  theme: jsonObject.default({}),
  image: optionalImage.default(null)
});

// Technique
export const techniqueSchema = z.strictObject({
  id: slug,
  name,
  category: z.enum([
    "breathing",
    "blood-demon-art"
  ]),
  parent_id: slug,
  user_ids: idArray.default([]),
  description: description.default("")
});

// PATCH: all fields optional, but ID cannot change
function patchSchema(schema) {
  return schema.omit({ id: true })
    .partial()
    .refine(
      (data) => Object.keys(data).length > 0,
      "At least one field must be provided"
    );
}

export const slayerPatchSchema =
  patchSchema(slayerSchema);

export const demonPatchSchema =
  patchSchema(demonSchema);

export const breathingStylePatchSchema =
  patchSchema(breathingStyleSchema);

export const bloodDemonArtPatchSchema =
  patchSchema(bloodDemonArtSchema);

export const techniquePatchSchema =
  patchSchema(techniqueSchema);
