
 // ==========================================
 // DEMON SLAYER ARCHIVE - OPENAPI PATHS
 // ==========================================

const resources = [
  {
    path: "slayers",
    tag: "Slayers",
    schema: "Slayer",
    hasRank: true,
  },
  {
    path: "demons",
    tag: "Demons",
    schema: "Demon",
    hasRank: true,
  },
  {
    path: "breathing-styles",
    tag: "Breathing Styles",
    schema: "BreathingStyle",
    hasRank: false,
  },
  {
    path: "blood-demon-arts",
    tag: "Blood Demon Arts",
    schema: "BloodDemonArt",
    hasRank: false,
  },
  {
    path: "techniques",
    tag: "Techniques",
    schema: "Technique",
    hasRank: false,
  },
];

// ==========================================
// REUSABLE COMPONENTS
// ==========================================

const errorResponse = (description) => ({
  description,
  content: {
    "application/json": {
      schema: {
        $ref: "#/components/schemas/ApiError",
      },
    },
  },
});

const jsonResponse = (status, schema) => ({
  description: status,
  content: {
    "application/json": {
      schema,
    },
  },
});

const recordRef = (schema) => ({
  $ref: `#/components/schemas/${schema}`,
});

const mutationResponse = (schema) => ({
  type: "object",
  properties: {
    message: { type: "string" },
    data: recordRef(schema),
  },
});

const requestBody = (schema, required = true) => ({
  required: true,
  content: {
    "application/json": {
      schema: {
        $ref: `#/components/schemas/${
          required ? schema + "Create" : schema + "Update"
        }`,
      },
    },
  },
});

const idParameter = {
  name: "id",
  in: "path",
  required: true,
  description: "Record ID (lowercase slug)",
  schema: {
    type: "string",
  },
  example: "tanjiro-kamado",
};

// ==========================================
// LIST QUERY PARAMETERS
// ==========================================

function listParameters(hasRank) {
  const parameters = [
    {
      name: "page",
      in: "query",
      description: "Page number, starting at 1",
      schema: {
        type: "integer",
        minimum: 1,
        default: 1,
      },
    },
    {
      name: "limit",
      in: "query",
      description: "Number of records per page",
      schema: {
        type: "integer",
        minimum: 1,
        maximum: 100,
        default: 10,
      },
    },
    {
      name: "search",
      in: "query",
      description: "Case-insensitive name search",
      schema: {
        type: "string",
        maxLength: 100,
      },
    },
    {
      name: "sort",
      in: "query",
      description: "Field used for sorting",
      schema: {
        type: "string",
        enum: hasRank
          ? ["name", "id", "rank"]
          : ["name", "id"],
        default: "name",
      },
    },
    {
      name: "order",
      in: "query",
      description: "Sorting direction",
      schema: {
        type: "string",
        enum: ["asc", "desc"],
        default: "asc",
      },
    },
  ];

  if (hasRank) {
    parameters.push({
      name: "rank",
      in: "query",
      description: "Filter by exact rank",
      schema: {
        type: "string",
        maxLength: 100,
      },
    });
  }

  return parameters;
}

// ==========================================
// GENERATE ENDPOINT DOCUMENTATION
// ==========================================

const archivePaths = {};

for (const resource of resources) {
  const { path, tag, schema, hasRank } = resource;

  const collectionPath = `/api/${path}`;
  const recordPath = `/api/${path}/{id}`;

  // ========================================
  // GET ALL
  // ========================================

  archivePaths[collectionPath] = {
    get: {
      tags: [tag],
      summary: `Get all ${tag}`,
      description:
        "Retrieve records with pagination, searching, " +
        "filtering, and sorting.",
      parameters: listParameters(hasRank),
      responses: {
        200: jsonResponse("Records retrieved successfully", {
          type: "object",
          properties: {
            data: {
              type: "array",
              items: recordRef(schema),
            },
            pagination: {
              $ref: "#/components/schemas/Pagination",
            },
          },
        }),
        400: errorResponse("Invalid query parameters"),
        429: errorResponse("Too many requests"),
        500: errorResponse("Internal server error"),
      },
    },

    // ======================================
    // POST
    // ======================================

    post: {
      tags: [tag],
      summary: `Create a ${tag} record`,
      description:
        "Create a new record. Related IDs must reference " +
        "valid existing records.",
      requestBody: requestBody(schema, true),
      responses: {
        201: jsonResponse(
          "Record created successfully",
          mutationResponse(schema)
        ),
        400: errorResponse("Invalid request data"),
        409: errorResponse("Duplicate ID or relationship conflict"),
        429: errorResponse("Too many requests"),
        500: errorResponse("Internal server error"),
      },
    },
  };

  // ========================================
  // GET BY ID
  // ========================================

  archivePaths[recordPath] = {
    get: {
      tags: [tag],
      summary: `Get a ${tag} record by ID`,
      parameters: [idParameter],
      responses: {
        200: jsonResponse(
          "Record retrieved successfully",
          recordRef(schema)
        ),
        404: errorResponse("Record not found"),
        429: errorResponse("Too many requests"),
        500: errorResponse("Internal server error"),
      },
    },

    // ======================================
    // PATCH
    // ======================================

    patch: {
      tags: [tag],
      summary: `Update a ${tag} record`,
      description:
        "Update only the supplied fields. " +
        "At least one field must be provided.",
      parameters: [idParameter],
      requestBody: requestBody(schema, false),
      responses: {
        200: jsonResponse(
          "Record updated successfully",
          mutationResponse(schema)
        ),
        400: errorResponse("Invalid update data"),
        404: errorResponse("Record not found"),
        409: errorResponse("Relationship conflict"),
        429: errorResponse("Too many requests"),
        500: errorResponse("Internal server error"),
      },
    },

    // ======================================
    // DELETE
    // ======================================

    delete: {
      tags: [tag],
      summary: `Delete a ${tag} record`,
      description:
        "Delete a record unless other records still reference it.",
      parameters: [idParameter],
      responses: {
        200: jsonResponse(
          "Record deleted successfully",
          mutationResponse(schema)
        ),
        404: errorResponse("Record not found"),
        409: errorResponse("Deletion blocked by existing relationships"),
        429: errorResponse("Too many requests"),
        500: errorResponse("Internal server error"),
      },
    },
  };
}

export default archivePaths;
