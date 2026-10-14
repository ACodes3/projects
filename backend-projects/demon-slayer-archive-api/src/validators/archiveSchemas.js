
import { z } from "zod";

// COMMON VALIDATION
const slug = z.string().regex(
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  "ID must be a lowercase slug, e.g. tanjiro-kamado"
);

const name = z.string().trim().min(1).max(150);

const description = z.string().max(10000);

const idArray = z.array(slug);

const image = z.string().nullable();

const jsonObject = z.record(
  z.string(),
  z.unknown()
);

// SLAYERS
export const slayerSchema = z.strictObject({
  id: slug,
  name,
  rank: z.string().nullable().default(null),
  breathing_style_ids: idArray.default([]),
  technique_ids: idArray.default([]),
  related_character_ids: idArray.default([]),
  description: description.default(""),
  stats: jsonObject.default({}),
  image: image.default(null)
});

// DEMONS
export const demonSchema = z.strictObject({
  id: slug,
  name,
  rank: z.string().nullable().default(null),
  blood_demon_art_ids: idArray.default([]),
  ability_ids: idArray.default([]),
  related_character_ids: idArray.default([]),
  description: description.default(""),
  stats: jsonObject.default({}),
  image: image.default(null)
});

// BREATHING STYLES
export const breathingStyleSchema = z.strictObject({
  id: slug,
  name,
  derived_from_id: slug.nullable().default(null),
  user_ids: idArray.default([]),
  technique_ids: idArray.default([]),
  description: description.default(""),
  theme: jsonObject.default({}),
  image: image.default(null)
});

// BLOOD DEMON ARTS
export const bloodDemonArtSchema = z.strictObject({
  id: slug,
  name,
  user_id: slug.nullable().default(null),
  ability_ids: idArray.default([]),
  description: description.default(""),
  theme: jsonObject.default({}),
  image: image.default(null)
});

// TECHNIQUES
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

// PATCH VALIDATION
function createPatchSchema(schema) {
  return schema
    .omit({ id: true })
    .partial()
    .refine(
      (data) => Object.keys(data).length > 0,
      "At least one field must be provided"
    );
}

export const slayerPatchSchema =
  createPatchSchema(slayerSchema);

export const demonPatchSchema =
  createPatchSchema(demonSchema);

export const breathingStylePatchSchema =
  createPatchSchema(breathingStyleSchema);

export const bloodDemonArtPatchSchema =
  createPatchSchema(bloodDemonArtSchema);

export const techniquePatchSchema =
  createPatchSchema(techniqueSchema);