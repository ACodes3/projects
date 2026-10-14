
import pool from "../config/db.js";
import AppError from "../utils/AppError.js";

// ==========================================
// COLLECTION CONFIGURATION
// ==========================================

const collections = {
  slayers: "slayers",
  demons: "demons",
  "breathing-styles": "breathing_styles",
  "blood-demon-arts": "blood_demon_arts",
  techniques: "techniques",
};

// Define the fields that can be written to each table.
// Table names and column names are controlled by the backend,
// never taken directly from user input.

const configs = {
  slayers: {
    table: "slayers",
    label: "Slayer",
    fields: [
      "name",
      "rank",
      "breathing_style_ids",
      "technique_ids",
      "related_character_ids",
      "description",
      "stats",
      "image",
    ],
    jsonFields: ["stats"],
  },

  demons: {
    table: "demons",
    label: "Demon",
    fields: [
      "name",
      "rank",
      "blood_demon_art_ids",
      "ability_ids",
      "related_character_ids",
      "description",
      "stats",
      "image",
    ],
    jsonFields: ["stats"],
  },

  breathingStyles: {
    table: "breathing_styles",
    label: "Breathing Style",
    fields: [
      "name",
      "derived_from_id",
      "user_ids",
      "technique_ids",
      "description",
      "theme",
      "image",
    ],
    jsonFields: ["theme"],
  },

  bloodDemonArts: {
    table: "blood_demon_arts",
    label: "Blood Demon Art",
    fields: [
      "name",
      "user_id",
      "ability_ids",
      "description",
      "theme",
      "image",
    ],
    jsonFields: ["theme"],
  },

  techniques: {
    table: "techniques",
    label: "Technique",
    fields: [
      "name",
      "category",
      "parent_id",
      "user_ids",
      "description",
    ],
    jsonFields: [],
  },
};

// ==========================================
// COMMON HELPERS
// ==========================================

// Read data already validated by Zod middleware.
function getValidatedBody(res) {
  const data = res.locals.validatedBody;

  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data)
  ) {
    throw new AppError(
      "Validated request data is missing",
      500
    );
  }

  return data;
}

// Convert JavaScript objects into PostgreSQL JSONB values.
function prepareValue(field, value, config) {
  if (config.jsonFields.includes(field)) {
    return JSON.stringify(value);
  }

  return value;
}

// Return the correct PostgreSQL placeholder.
// For example: $1 or $1::jsonb.
function placeholder(field, index, config) {
  const parameter = `$${index}`;

  return config.jsonFields.includes(field)
    ? `${parameter}::jsonb`
    : parameter;
}

// Handle database errors using our centralized system.
function handleDatabaseError(error, config) {
  if (error.code === "23505") {
    throw new AppError(
      `A ${config.label} with this ID already exists`,
      409
    );
  }

  if (error.code === "23503") {
    throw new AppError(
      "Database relationship constraint violated",
      409
    );
  }

  throw error;
}

// ==========================================
// REUSABLE CREATE HELPER
// ==========================================

async function createRecord(req, res, config) {
  const data = getValidatedBody(res);

  const columns = ["id", ...config.fields];

  const values = columns.map((field) =>
    prepareValue(field, data[field], config)
  );

  const placeholders = columns.map((field, index) =>
    placeholder(field, index + 1, config)
  );

  const query = `
    INSERT INTO ${config.table} (
      ${columns.join(", ")}
    )
    VALUES (
      ${placeholders.join(", ")}
    )
    RETURNING *
  `;

  try {
    const result = await pool.query(query, values);

    return res.status(201).json({
      message: `${config.label} created successfully`,
      data: result.rows[0],
    });
  } catch (error) {
    handleDatabaseError(error, config);
  }
}

// ==========================================
// REUSABLE UPDATE HELPER
// ==========================================

async function updateRecord(req, res, config) {
  const { id } = req.params;
  const updates = getValidatedBody(res);

  const fields = Object.keys(updates);

  if (fields.length === 0) {
    throw new AppError(
      "No fields provided for updating",
      400
    );
  }

  // Defense in depth:
  // Only columns explicitly allowed by the config
  // can appear in the SQL statement.
  const invalidFields = fields.filter(
    (field) => !config.fields.includes(field)
  );

  if (invalidFields.length > 0) {
    throw new AppError(
      `Invalid fields: ${invalidFields.join(", ")}`,
      400
    );
  }

  const setClause = fields
    .map((field, index) => {
      const valuePlaceholder = placeholder(
        field,
        index + 1,
        config
      );

      return `${field} = ${valuePlaceholder}`;
    })
    .join(", ");

  const values = fields.map((field) =>
    prepareValue(field, updates[field], config)
  );

  values.push(id);

  const query = `
    UPDATE ${config.table}
    SET ${setClause}
    WHERE id = $${values.length}
    RETURNING *
  `;

  try {
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new AppError(
        `${config.label} not found`,
        404
      );
    }

    return res.status(200).json({
      message: `${config.label} updated successfully`,
      data: result.rows[0],
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    handleDatabaseError(error, config);
  }
}

// ==========================================
// REUSABLE DELETE HELPER
// ==========================================

async function deleteRecord(req, res, config) {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      DELETE FROM ${config.table}
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError(
        `${config.label} not found`,
        404
      );
    }

    return res.status(200).json({
      message: `${config.label} deleted successfully`,
      data: result.rows[0],
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    handleDatabaseError(error, config);
  }
}

// ==========================================
// GET ALL RECORDS
// ==========================================

export async function getAll(req, res) {
  const table = collections[req.params.collection];

  if (!table) {
    throw new AppError(
      "Collection not found",
      404
    );
  }

  const result = await pool.query(
    `SELECT * FROM ${table} ORDER BY name ASC`
  );

  return res.status(200).json(result.rows);
}

// ==========================================
// GET ONE RECORD BY ID
// ==========================================

export async function getById(req, res) {
  const table = collections[req.params.collection];

  if (!table) {
    throw new AppError(
      "Collection not found",
      404
    );
  }

  const result = await pool.query(
    `
    SELECT *
    FROM ${table}
    WHERE id = $1
    `,
    [req.params.id]
  );

  if (result.rows.length === 0) {
    throw new AppError(
      "Record not found",
      404
    );
  }

  return res.status(200).json(result.rows[0]);
}

// ==========================================
// SLAYERS
// ==========================================

// POST /api/slayers
export async function createSlayer(req, res) {
  return createRecord(req, res, configs.slayers);
}

// PATCH /api/slayers/:id
export async function updateSlayer(req, res) {
  return updateRecord(req, res, configs.slayers);
}

// DELETE /api/slayers/:id
export async function deleteSlayer(req, res) {
  return deleteRecord(req, res, configs.slayers);
}

// ==========================================
// DEMONS
// ==========================================

// POST /api/demons
export async function createDemon(req, res) {
  return createRecord(req, res, configs.demons);
}

// PATCH /api/demons/:id
export async function updateDemon(req, res) {
  return updateRecord(req, res, configs.demons);
}

// DELETE /api/demons/:id
export async function deleteDemon(req, res) {
  return deleteRecord(req, res, configs.demons);
}

// ==========================================
// BREATHING STYLES
// ==========================================

// POST /api/breathing-styles
export async function createBreathingStyle(req, res) {
  const data = getValidatedBody(res);

  if (data.derived_from_id === data.id) {
    throw new AppError(
      "A Breathing Style cannot derive from itself",
      400
    );
  }

  return createRecord(req, res, configs.breathingStyles);
}

// PATCH /api/breathing-styles/:id
export async function updateBreathingStyle(req, res) {
  const updates = getValidatedBody(res);

  if (updates.derived_from_id === req.params.id) {
    throw new AppError(
      "A Breathing Style cannot derive from itself",
      400
    );
  }

  return updateRecord(
    req,
    res,
    configs.breathingStyles
  );
}

// DELETE /api/breathing-styles/:id
export async function deleteBreathingStyle(req, res) {
  return deleteRecord(
    req,
    res,
    configs.breathingStyles
  );
}

// ==========================================
// BLOOD DEMON ARTS
// ==========================================

// POST /api/blood-demon-arts
export async function createBloodDemonArt(req, res) {
  return createRecord(
    req,
    res,
    configs.bloodDemonArts
  );
}

// PATCH /api/blood-demon-arts/:id
export async function updateBloodDemonArt(req, res) {
  return updateRecord(
    req,
    res,
    configs.bloodDemonArts
  );
}

// DELETE /api/blood-demon-arts/:id
export async function deleteBloodDemonArt(req, res) {
  return deleteRecord(
    req,
    res,
    configs.bloodDemonArts
  );
}

// ==========================================
// TECHNIQUE PARENT VALIDATION
// ==========================================

// Techniques must belong to an existing
// Breathing Style or Blood Demon Art.

async function validateTechniqueParent(
  category,
  parentId,
  client
) {
  let table;

  if (category === "breathing") {
    table = "breathing_styles";
  } else if (category === "blood-demon-art") {
    table = "blood_demon_arts";
  } else {
    throw new AppError(
      "Invalid technique category",
      400
    );
  }

  const result = await client.query(
    `
    SELECT id
    FROM ${table}
    WHERE id = $1
    `,
    [parentId]
  );

  if (result.rows.length === 0) {
    throw new AppError(
      "The specified parent does not exist",
      400
    );
  }
}

// ==========================================
// POST TECHNIQUE
// ==========================================

export async function createTechnique(req, res) {
  const data = getValidatedBody(res);
  const config = configs.techniques;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await validateTechniqueParent(
      data.category,
      data.parent_id,
      client
    );

    const columns = ["id", ...config.fields];

    const values = columns.map(
      (field) => data[field]
    );

    const placeholders = columns.map(
      (_, index) => `$${index + 1}`
    );

    const result = await client.query(
      `
      INSERT INTO techniques (
        ${columns.join(", ")}
      )
      VALUES (
        ${placeholders.join(", ")}
      )
      RETURNING *
      `,
      values
    );

    await client.query("COMMIT");

    return res.status(201).json({
      message: "Technique created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    if (error instanceof AppError) {
      throw error;
    }

    handleDatabaseError(error, config);
  } finally {
    client.release();
  }
}

// ==========================================
// PATCH TECHNIQUE
// ==========================================

export async function updateTechnique(req, res) {
  const { id } = req.params;
  const updates = getValidatedBody(res);
  const config = configs.techniques;

  const fields = Object.keys(updates);

  if (fields.length === 0) {
    throw new AppError(
      "No fields provided for updating",
      400
    );
  }

  const invalidFields = fields.filter(
    (field) => !config.fields.includes(field)
  );

  if (invalidFields.length > 0) {
    throw new AppError(
      `Invalid fields: ${invalidFields.join(", ")}`,
      400
    );
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Lock existing technique while updating.
    const existing = await client.query(
      `
      SELECT category, parent_id
      FROM techniques
      WHERE id = $1
      FOR UPDATE
      `,
      [id]
    );

    if (existing.rows.length === 0) {
      throw new AppError(
        "Technique not found",
        404
      );
    }

    // Use existing data when a field was not supplied.
    const category =
      updates.category ?? existing.rows[0].category;

    const parentId =
      updates.parent_id ?? existing.rows[0].parent_id;

    await validateTechniqueParent(
      category,
      parentId,
      client
    );

    const setClause = fields
      .map(
        (field, index) =>
          `${field} = $${index + 1}`
      )
      .join(", ");

    const values = fields.map(
      (field) => updates[field]
    );

    values.push(id);

    const result = await client.query(
      `
      UPDATE techniques
      SET ${setClause}
      WHERE id = $${values.length}
      RETURNING *
      `,
      values
    );

    await client.query("COMMIT");

    return res.status(200).json({
      message: "Technique updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    if (error instanceof AppError) {
      throw error;
    }

    handleDatabaseError(error, config);
  } finally {
    client.release();
  }
}

// ==========================================
// DELETE TECHNIQUE
// ==========================================

// Uses the same deletion helper as other collections.

export async function deleteTechnique(req, res) {
  return deleteRecord(
    req,
    res,
    configs.techniques
  );
}
