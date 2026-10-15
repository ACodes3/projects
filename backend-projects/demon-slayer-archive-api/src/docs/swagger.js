
import swaggerJsdoc from "swagger-jsdoc";
import archivePaths from "./archivePaths.js";

// ==========================================
// REUSABLE OPENAPI SCHEMAS
// ==========================================

const slug = {
  type: "string",
  pattern: "^[a-z0-9]+(-[a-z0-9]+)*$",
  example: "tanjiro-kamado",
};

const idArray = {
  type: "array",
  items: slug,
  default: [],
};

const description = {
  type: "string",
  maxLength: 10000,
  default: "",
};

const image = {
  type: "string",
  nullable: true,
  default: null,
};

const jsonObject = {
  type: "object",
  additionalProperties: true,
  default: {},
};

const name = {
  type: "string",
  minLength: 1,
  maxLength: 150,
};

const nullableSlug = {
  ...slug,
  nullable: true,
  default: null,
};

const rank = {
  type: "string",
  nullable: true,
  default: null,
};

// ==========================================
// CHARACTER SCHEMAS
// ==========================================

const slayerProperties = {
  id: slug,
  name,
  type: {
    type: "string",
    default: "slayer",
  },
  rank,
  breathing_style_ids: idArray,
  technique_ids: idArray,
  related_character_ids: idArray,
  description,
  stats: jsonObject,
  image,
};

const demonProperties = {
  id: slug,
  name,
  type: {
    type: "string",
    default: "demon",
  },
  rank,
  blood_demon_art_ids: idArray,
  ability_ids: idArray,
  related_character_ids: idArray,
  description,
  stats: jsonObject,
  image,
};

// ==========================================
// BREATHING STYLE SCHEMA
// ==========================================

const breathingStyleProperties = {
  id: slug,
  name,
  type: {
    type: "string",
    default: "breathing-style",
  },
  derived_from_id: nullableSlug,
  user_ids: idArray,
  technique_ids: idArray,
  description,
  theme: jsonObject,
  image,
};

// ==========================================
// BLOOD DEMON ART SCHEMA
// ==========================================

const bloodDemonArtProperties = {
  id: slug,
  name,
  type: {
    type: "string",
    default: "blood-demon-art",
  },
  user_id: nullableSlug,
  ability_ids: idArray,
  description,
  theme: jsonObject,
  image,
};

// ==========================================
// TECHNIQUE SCHEMA
// ==========================================

const techniqueProperties = {
  id: slug,
  name,
  type: {
    type: "string",
    default: "technique",
  },
  category: {
    type: "string",
    enum: ["breathing", "blood-demon-art"],
  },
  parent_id: slug,
  user_ids: idArray,
  description,
};

// ==========================================
// SCHEMA GENERATION HELPERS
// ==========================================

// Database response schema
function recordSchema(properties) {
  return {
    type: "object",
    properties,
    required: ["id", "name"],
  };
}

// POST schema:
// id and name are required, along with any
// additional required fields.
function createSchema(properties, required = []) {
  const { type, ...writableProperties } = properties;

  return {
    type: "object",
    additionalProperties: false,
    required: ["id", "name", ...required],
    properties: writableProperties,
  };
}

// PATCH schema:
// no ID and no automatic defaults.
// Only explicitly supplied fields are updated.
function updateSchema(properties) {
  const {
    id,
    type,
    ...writableProperties
  } = properties;

  const patchProperties = Object.fromEntries(
    Object.entries(writableProperties).map(
      ([key, property]) => {
        const { default: ignored, ...rest } = property;
        return [key, rest];
      }
    )
  );

  return {
    type: "object",
    additionalProperties: false,
    minProperties: 1,
    properties: patchProperties,
  };
}

// ==========================================
// OPENAPI CONFIGURATION
// ==========================================

const options = {
  definition: {
    openapi: "3.0.3",

    info: {
      title: "Demon Slayer Archive API",
      version: "1.0.0",
      description:
        "REST API for managing Demon Slayers, Demons, " +
        "Breathing Styles, Blood Demon Arts, and Techniques.",
    },

    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: "Local development server",
      },
    ],

    tags: [
      {
        name: "Slayers",
        description: "Manage Demon Slayers",
      },
      {
        name: "Demons",
        description: "Manage Demons",
      },
      {
        name: "Breathing Styles",
        description: "Manage Breathing Styles",
      },
      {
        name: "Blood Demon Arts",
        description: "Manage Blood Demon Arts",
      },
      {
        name: "Techniques",
        description: "Manage Techniques",
      },
    ],

    paths: archivePaths,

    components: {
      schemas: {
        // ==================================
        // SLAYERS
        // ==================================

        Slayer: recordSchema(slayerProperties),

        SlayerCreate: createSchema(
          slayerProperties
        ),

        SlayerUpdate: updateSchema(
          slayerProperties
        ),

        // ==================================
        // DEMONS
        // ==================================

        Demon: recordSchema(demonProperties),

        DemonCreate: createSchema(
          demonProperties
        ),

        DemonUpdate: updateSchema(
          demonProperties
        ),

        // ==================================
        // BREATHING STYLES
        // ==================================

        BreathingStyle: recordSchema(
          breathingStyleProperties
        ),

        BreathingStyleCreate: createSchema(
          breathingStyleProperties
        ),

        BreathingStyleUpdate: updateSchema(
          breathingStyleProperties
        ),

        // ==================================
        // BLOOD DEMON ARTS
        // ==================================

        BloodDemonArt: recordSchema(
          bloodDemonArtProperties
        ),

        BloodDemonArtCreate: createSchema(
          bloodDemonArtProperties
        ),

        BloodDemonArtUpdate: updateSchema(
          bloodDemonArtProperties
        ),

        // ==================================
        // TECHNIQUES
        // ==================================

        Technique: {
          ...recordSchema(techniqueProperties),
          required: [
            "id",
            "name",
            "category",
            "parent_id",
          ],
        },

        TechniqueCreate: createSchema(
          techniqueProperties,
          ["category", "parent_id"]
        ),

        TechniqueUpdate: updateSchema(
          techniqueProperties
        ),

        // ==================================
        // PAGINATION
        // ==================================

        Pagination: {
          type: "object",
          properties: {
            page: {
              type: "integer",
              example: 1,
            },
            limit: {
              type: "integer",
              example: 10,
            },
            total: {
              type: "integer",
              example: 24,
            },
            totalPages: {
              type: "integer",
              example: 3,
            },
            hasNextPage: {
              type: "boolean",
              example: true,
            },
            hasPreviousPage: {
              type: "boolean",
              example: false,
            },
          },
        },

        // ==================================
        // ERRORS
        // ==================================

        ApiError: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              example: "Invalid request data",
            },
          },
        },
      },
    },
  },

  // Paths are supplied directly above.
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
