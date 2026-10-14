
import pool from "../config/db.js";

const collections = {
  slayers: "slayers",
  demons: "demons",
  "breathing-styles": "breathing_styles",
  "blood-demon-arts": "blood_demon_arts",
  techniques: "techniques"
};

// GET all records
export async function getAll(req, res) {
  const table = collections[req.params.collection];

  if (!table) {
    return res.status(404).json({
      message: "Collection not found"
    });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM ${table} ORDER BY name ASC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to retrieve data"
    });
  }
}

// GET one record by ID
export async function getById(req, res) {
  const table = collections[req.params.collection];

  if (!table) {
    return res.status(404).json({
      message: "Collection not found"
    });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM ${table} WHERE id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Record not found"
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to retrieve record"
    });
  }
}


// POST a new Slayer
export async function createSlayer(req, res) {
  const {
    id,
    name,
    rank,
    breathing_style_ids = [],
    technique_ids = [],
    related_character_ids = [],
    description = "",
    stats = {},
    image = null
  } = req.body ?? {};

  // 1. Validate required fields
  if (
    typeof id !== "string" ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) ||
    typeof name !== "string" ||
    !name.trim()
  ) {
    return res.status(400).json({
      message: "Valid id and name are required"
    });
  }

  // 2. Validate optional fields
  const isStringArray = (value) =>
    Array.isArray(value) &&
    value.every((item) => typeof item === "string");

  const validStats =
    stats !== null &&
    typeof stats === "object" &&
    !Array.isArray(stats);

  if (
    (rank !== undefined && rank !== null &&
      typeof rank !== "string") ||
    typeof description !== "string" ||
    (image !== null && typeof image !== "string") ||
    !validStats ||
    !isStringArray(breathing_style_ids) ||
    !isStringArray(technique_ids) ||
    !isStringArray(related_character_ids)
  ) {
    return res.status(400).json({
      message: "Invalid Slayer data"
    });
  }

  // 3. Insert into PostgreSQL
  try {
    const query = `
      INSERT INTO slayers (
        id,
        name,
        rank,
        breathing_style_ids,
        technique_ids,
        related_character_ids,
        description,
        stats,
        image
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8::jsonb, $9
      )
      RETURNING *
    `;

    const values = [
      id,
      name.trim(),
      rank ?? null,
      breathing_style_ids,
      technique_ids,
      related_character_ids,
      description,
      JSON.stringify(stats),
      image
    ];

    const result = await pool.query(query, values);

    return res.status(201).json({
      message: "Slayer created successfully",
      data: result.rows[0]
    });

  } catch (error) {
    // PostgreSQL duplicate primary key
    if (error.code === "23505") {
      return res.status(409).json({
        message: "A Slayer with this ID already exists"
      });
    }

    console.error("Error creating Slayer:", error);

    return res.status(500).json({
      message: "Failed to create Slayer"
    });
  }
}

// PUT to update an existing Slayer
export async function updateSlayer(req, res) {
  const { id } = req.params;
  const updates = req.body;

  // 1. Make sure the body is an object
  if (
    !updates ||
    typeof updates !== "object" ||
    Array.isArray(updates)
  ) {
    return res.status(400).json({
      message: "Request body must be a JSON object"
    });
  }

  // 2. Define which fields can be updated
  const allowedFields = [
    "name",
    "rank",
    "breathing_style_ids",
    "technique_ids",
    "related_character_ids",
    "description",
    "stats",
    "image"
  ];

  const fields = Object.keys(updates);

  if (fields.length === 0) {
    return res.status(400).json({
      message: "No fields provided for updating"
    });
  }

  // 3. Reject fields that should not be updated
  const invalidFields = fields.filter(
    (field) => !allowedFields.includes(field)
  );

  if (invalidFields.length > 0) {
    return res.status(400).json({
      message: "Invalid fields",
      fields: invalidFields
    });
  }

  // 4. Validate the supplied values
  const isStringArray = (value) =>
    Array.isArray(value) &&
    value.every((item) => typeof item === "string");

  const arrayFields = [
    "breathing_style_ids",
    "technique_ids",
    "related_character_ids"
  ];

  for (const field of fields) {
    const value = updates[field];

    if (
      arrayFields.includes(field) &&
      !isStringArray(value)
    ) {
      return res.status(400).json({
        message: `${field} must be an array of strings`
      });
    }

    if (
      ["name", "description"].includes(field) &&
      (typeof value !== "string" ||
        (field === "name" && !value.trim()))
    ) {
      return res.status(400).json({
        message: `Invalid value for ${field}`
      });
    }

    if (
      ["rank", "image"].includes(field) &&
      value !== null &&
      typeof value !== "string"
    ) {
      return res.status(400).json({
        message: `Invalid value for ${field}`
      });
    }

    if (
      field === "stats" &&
      (
        value === null ||
        typeof value !== "object" ||
        Array.isArray(value)
      )
    ) {
      return res.status(400).json({
        message: "stats must be a JSON object"
      });
    }
  }

  // 5. Build the SQL UPDATE query
  const setClause = fields
    .map((field, index) => {
      const placeholder = `$${index + 1}`;

      return field === "stats"
        ? `${field} = ${placeholder}::jsonb`
        : `${field} = ${placeholder}`;
    })
    .join(", ");

  const values = fields.map((field) => {
    if (field === "stats") {
      return JSON.stringify(updates[field]);
    }

    if (field === "name") {
      return updates[field].trim();
    }

    return updates[field];
  });

  values.push(id);

  try {
    const result = await pool.query(
      `
      UPDATE slayers
      SET ${setClause}
      WHERE id = $${values.length}
      RETURNING *
      `,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Slayer not found"
      });
    }

    return res.json({
      message: "Slayer updated successfully",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Error updating Slayer:", error);

    return res.status(500).json({
      message: "Failed to update Slayer"
    });
  }
}


// DELETE a Slayer by ID
export async function deleteSlayer(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      DELETE FROM slayers
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    // No Slayer found with that ID
    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Slayer not found"
      });
    }

    return res.status(200).json({
      message: "Slayer deleted successfully",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Error deleting Slayer:", error);

    return res.status(500).json({
      message: "Failed to delete Slayer"
    });
  }
}


// DEMONS
// POST a new Demon
export async function createDemon(req, res) {
  const {
    id,
    name,
    rank = null,
    blood_demon_art_ids = [],
    ability_ids = [],
    related_character_ids = [],
    description = "",
    stats = {},
    image = null
  } = req.body ?? {};

  const isStringArray = (value) =>
    Array.isArray(value) &&
    value.every((item) => typeof item === "string");

  const validStats =
    stats !== null &&
    typeof stats === "object" &&
    !Array.isArray(stats);

  if (
    typeof id !== "string" ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) ||
    typeof name !== "string" ||
    !name.trim() ||
    (rank !== null && typeof rank !== "string") ||
    !isStringArray(blood_demon_art_ids) ||
    !isStringArray(ability_ids) ||
    !isStringArray(related_character_ids) ||
    typeof description !== "string" ||
    !validStats ||
    (image !== null && typeof image !== "string")
  ) {
    return res.status(400).json({
      message: "Invalid Demon data"
    });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO demons (
        id,
        name,
        rank,
        blood_demon_art_ids,
        ability_ids,
        related_character_ids,
        description,
        stats,
        image
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8::jsonb, $9
      )
      RETURNING *
      `,
      [
        id,
        name.trim(),
        rank,
        blood_demon_art_ids,
        ability_ids,
        related_character_ids,
        description,
        JSON.stringify(stats),
        image
      ]
    );

    return res.status(201).json({
      message: "Demon created successfully",
      data: result.rows[0]
    });

  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "A Demon with this ID already exists"
      });
    }

    console.error("Error creating Demon:", error);

    return res.status(500).json({
      message: "Failed to create Demon"
    });
  }
}


// PUT to update an existing Demon
export async function updateDemon(req, res) {
  const { id } = req.params;
  const updates = req.body;

  if (
    !updates ||
    typeof updates !== "object" ||
    Array.isArray(updates)
  ) {
    return res.status(400).json({
      message: "Request body must be a JSON object"
    });
  }

  const allowedFields = [
    "name",
    "rank",
    "blood_demon_art_ids",
    "ability_ids",
    "related_character_ids",
    "description",
    "stats",
    "image"
  ];

  const fields = Object.keys(updates);

  if (fields.length === 0) {
    return res.status(400).json({
      message: "No fields provided for updating"
    });
  }

  const invalidFields = fields.filter(
    (field) => !allowedFields.includes(field)
  );

  if (invalidFields.length > 0) {
    return res.status(400).json({
      message: "Invalid fields",
      fields: invalidFields
    });
  }

  const arrayFields = [
    "blood_demon_art_ids",
    "ability_ids",
    "related_character_ids"
  ];

  for (const field of fields) {
    const value = updates[field];

    if (
      arrayFields.includes(field) &&
      (!Array.isArray(value) ||
        !value.every((item) => typeof item === "string"))
    ) {
      return res.status(400).json({
        message: `${field} must be an array of strings`
      });
    }

    if (
      ["name", "description"].includes(field) &&
      (typeof value !== "string" ||
        (field === "name" && !value.trim()))
    ) {
      return res.status(400).json({
        message: `Invalid value for ${field}`
      });
    }

    if (
      ["rank", "image"].includes(field) &&
      value !== null &&
      typeof value !== "string"
    ) {
      return res.status(400).json({
        message: `Invalid value for ${field}`
      });
    }

    if (
      field === "stats" &&
      (
        value === null ||
        typeof value !== "object" ||
        Array.isArray(value)
      )
    ) {
      return res.status(400).json({
        message: "stats must be a JSON object"
      });
    }
  }

  const setClause = fields
    .map((field, index) =>
      field === "stats"
        ? `${field} = $${index + 1}::jsonb`
        : `${field} = $${index + 1}`
    )
    .join(", ");

  const values = fields.map((field) => {
    if (field === "stats") {
      return JSON.stringify(updates[field]);
    }

    if (field === "name") {
      return updates[field].trim();
    }

    return updates[field];
  });

  values.push(id);

  try {
    const result = await pool.query(
      `
      UPDATE demons
      SET ${setClause}
      WHERE id = $${values.length}
      RETURNING *
      `,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Demon not found"
      });
    }

    return res.status(200).json({
      message: "Demon updated successfully",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Error updating Demon:", error);

    return res.status(500).json({
      message: "Failed to update Demon"
    });
  }
}

// DELETE a Demon by ID
export async function deleteDemon(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      DELETE FROM demons
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Demon not found"
      });
    }

    return res.status(200).json({
      message: "Demon deleted successfully",
      data: result.rows[0]
    });

  } catch (error) {
    // For example, a Blood Demon Art may reference this Demon
    if (error.code === "23503") {
      return res.status(409).json({
        message:
          "Cannot delete this Demon because other database records reference it"
      });
    }

    console.error("Error deleting Demon:", error);

    return res.status(500).json({
      message: "Failed to delete Demon"
    });
  }
}

// BREATHING STYLES
// POST a new Breathing Style
export async function createBreathingStyle(req, res) {
  const {
    id,
    name,
    derived_from_id = null,
    user_ids = [],
    technique_ids = [],
    description = "",
    theme = {},
    image = null
  } = req.body ?? {};

  const isStringArray = (value) =>
    Array.isArray(value) &&
    value.every((item) => typeof item === "string");

  if (
    typeof id !== "string" ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) ||
    typeof name !== "string" ||
    !name.trim() ||
    (derived_from_id !== null &&
      typeof derived_from_id !== "string") ||
    !isStringArray(user_ids) ||
    !isStringArray(technique_ids) ||
    typeof description !== "string" ||
    !theme ||
    typeof theme !== "object" ||
    Array.isArray(theme) ||
    (image !== null && typeof image !== "string")
  ) {
    return res.status(400).json({
      message: "Invalid Breathing Style data"
    });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO breathing_styles (
        id,
        name,
        derived_from_id,
        user_ids,
        technique_ids,
        description,
        theme,
        image
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7::jsonb, $8
      )
      RETURNING *
      `,
      [
        id,
        name.trim(),
        derived_from_id,
        user_ids,
        technique_ids,
        description,
        JSON.stringify(theme),
        image
      ]
    );

    return res.status(201).json({
      message: "Breathing Style created successfully",
      data: result.rows[0]
    });

  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "A Breathing Style with this ID already exists"
      });
    }

    if (error.code === "23503") {
      return res.status(400).json({
        message: "The parent Breathing Style does not exist"
      });
    }

    console.error("Error creating Breathing Style:", error);

    return res.status(500).json({
      message: "Failed to create Breathing Style"
    });
  }
}


// PUT to update an existing Breathing Style
export async function updateBreathingStyle(req, res) {
  const { id } = req.params;
  const updates = req.body;

  if (
    !updates ||
    typeof updates !== "object" ||
    Array.isArray(updates)
  ) {
    return res.status(400).json({
      message: "Request body must be a JSON object"
    });
  }

  const allowedFields = [
    "name",
    "derived_from_id",
    "user_ids",
    "technique_ids",
    "description",
    "theme",
    "image"
  ];

  const fields = Object.keys(updates);

  if (fields.length === 0) {
    return res.status(400).json({
      message: "No fields provided for updating"
    });
  }

  const invalidFields = fields.filter(
    (field) => !allowedFields.includes(field)
  );

  if (invalidFields.length > 0) {
    return res.status(400).json({
      message: "Invalid fields",
      fields: invalidFields
    });
  }

  const isStringArray = (value) =>
    Array.isArray(value) &&
    value.every((item) => typeof item === "string");

  for (const field of fields) {
    const value = updates[field];

    if (
      ["user_ids", "technique_ids"].includes(field) &&
      !isStringArray(value)
    ) {
      return res.status(400).json({
        message: `${field} must be an array of strings`
      });
    }

    if (
      ["name", "description"].includes(field) &&
      (typeof value !== "string" ||
        (field === "name" && !value.trim()))
    ) {
      return res.status(400).json({
        message: `Invalid value for ${field}`
      });
    }

    if (
      ["derived_from_id", "image"].includes(field) &&
      value !== null &&
      typeof value !== "string"
    ) {
      return res.status(400).json({
        message: `Invalid value for ${field}`
      });
    }

    if (
      field === "theme" &&
      (
        value === null ||
        typeof value !== "object" ||
        Array.isArray(value)
      )
    ) {
      return res.status(400).json({
        message: "theme must be a JSON object"
      });
    }
  }

  // Prevent a style from deriving from itself
  if (updates.derived_from_id === id) {
    return res.status(400).json({
      message: "A Breathing Style cannot derive from itself"
    });
  }

  const setClause = fields
    .map((field, index) =>
      field === "theme"
        ? `${field} = $${index + 1}::jsonb`
        : `${field} = $${index + 1}`
    )
    .join(", ");

  const values = fields.map((field) => {
    if (field === "theme") {
      return JSON.stringify(updates[field]);
    }

    if (field === "name") {
      return updates[field].trim();
    }

    return updates[field];
  });

  values.push(id);

  try {
    const result = await pool.query(
      `
      UPDATE breathing_styles
      SET ${setClause}
      WHERE id = $${values.length}
      RETURNING *
      `,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Breathing Style not found"
      });
    }

    return res.status(200).json({
      message: "Breathing Style updated successfully",
      data: result.rows[0]
    });

  } catch (error) {
    if (error.code === "23503") {
      return res.status(400).json({
        message: "The parent Breathing Style does not exist"
      });
    }

    console.error("Error updating Breathing Style:", error);

    return res.status(500).json({
      message: "Failed to update Breathing Style"
    });
  }
}

// DELETE a Breathing Style by ID
export async function deleteBreathingStyle(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      DELETE FROM breathing_styles
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Breathing Style not found"
      });
    }

    return res.status(200).json({
      message: "Breathing Style deleted successfully",
      data: result.rows[0]
    });

  } catch (error) {
    if (error.code === "23503") {
      return res.status(409).json({
        message:
          "Cannot delete this Breathing Style because another style depends on it"
      });
    }

    console.error("Error deleting Breathing Style:", error);

    return res.status(500).json({
      message: "Failed to delete Breathing Style"
    });
  }
}

// BLOOD DEMON ARTS
// POST a new Blood Demon Art
export async function createBloodDemonArt(req, res) {
  const {
    id,
    name,
    user_id = null,
    ability_ids = [],
    description = "",
    theme = {},
    image = null
  } = req.body ?? {};

  const isStringArray = (value) =>
    Array.isArray(value) &&
    value.every((item) => typeof item === "string");

  const validTheme =
    theme !== null &&
    typeof theme === "object" &&
    !Array.isArray(theme);

  if (
    typeof id !== "string" ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) ||
    typeof name !== "string" ||
    !name.trim() ||
    (user_id !== null && typeof user_id !== "string") ||
    !isStringArray(ability_ids) ||
    typeof description !== "string" ||
    !validTheme ||
    (image !== null && typeof image !== "string")
  ) {
    return res.status(400).json({
      message: "Invalid Blood Demon Art data"
    });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO blood_demon_arts (
        id,
        name,
        user_id,
        ability_ids,
        description,
        theme,
        image
      )
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
      RETURNING *
      `,
      [
        id,
        name.trim(),
        user_id,
        ability_ids,
        description,
        JSON.stringify(theme),
        image
      ]
    );

    return res.status(201).json({
      message: "Blood Demon Art created successfully",
      data: result.rows[0]
    });

  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "A Blood Demon Art with this ID already exists"
      });
    }

    if (error.code === "23503") {
      return res.status(400).json({
        message: "The specified Demon does not exist"
      });
    }

    console.error("Error creating Blood Demon Art:", error);

    return res.status(500).json({
      message: "Failed to create Blood Demon Art"
    });
  }
}


// PUT to update an existing Blood Demon Art
export async function updateBloodDemonArt(req, res) {
  const { id } = req.params;
  const updates = req.body;

  if (
    !updates ||
    typeof updates !== "object" ||
    Array.isArray(updates)
  ) {
    return res.status(400).json({
      message: "Request body must be a JSON object"
    });
  }

  const allowedFields = [
    "name",
    "user_id",
    "ability_ids",
    "description",
    "theme",
    "image"
  ];

  const fields = Object.keys(updates);

  if (fields.length === 0) {
    return res.status(400).json({
      message: "No fields provided for updating"
    });
  }

  const invalidFields = fields.filter(
    (field) => !allowedFields.includes(field)
  );

  if (invalidFields.length > 0) {
    return res.status(400).json({
      message: "Invalid fields",
      fields: invalidFields
    });
  }

  for (const field of fields) {
    const value = updates[field];

    if (
      field === "name" &&
      (typeof value !== "string" || !value.trim())
    ) {
      return res.status(400).json({
        message: "name must be a non-empty string"
      });
    }

    if (
      field === "description" &&
      typeof value !== "string"
    ) {
      return res.status(400).json({
        message: "description must be a string"
      });
    }

    if (
      ["user_id", "image"].includes(field) &&
      value !== null &&
      typeof value !== "string"
    ) {
      return res.status(400).json({
        message: `${field} must be a string or null`
      });
    }

    if (
      field === "ability_ids" &&
      (
        !Array.isArray(value) ||
        !value.every((item) => typeof item === "string")
      )
    ) {
      return res.status(400).json({
        message: "ability_ids must be an array of strings"
      });
    }

    if (
      field === "theme" &&
      (
        value === null ||
        typeof value !== "object" ||
        Array.isArray(value)
      )
    ) {
      return res.status(400).json({
        message: "theme must be a JSON object"
      });
    }
  }

  const setClause = fields
    .map((field, index) =>
      field === "theme"
        ? `${field} = $${index + 1}::jsonb`
        : `${field} = $${index + 1}`
    )
    .join(", ");

  const values = fields.map((field) => {
    if (field === "theme") {
      return JSON.stringify(updates[field]);
    }

    if (field === "name") {
      return updates[field].trim();
    }

    return updates[field];
  });

  values.push(id);

  try {
    const result = await pool.query(
      `
      UPDATE blood_demon_arts
      SET ${setClause}
      WHERE id = $${values.length}
      RETURNING *
      `,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Blood Demon Art not found"
      });
    }

    return res.status(200).json({
      message: "Blood Demon Art updated successfully",
      data: result.rows[0]
    });

  } catch (error) {
    if (error.code === "23503") {
      return res.status(400).json({
        message: "The specified Demon does not exist"
      });
    }

    console.error("Error updating Blood Demon Art:", error);

    return res.status(500).json({
      message: "Failed to update Blood Demon Art"
    });
  }
}

// DELETE a Blood Demon Art by ID
export async function deleteBloodDemonArt(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      DELETE FROM blood_demon_arts
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Blood Demon Art not found"
      });
    }

    return res.status(200).json({
      message: "Blood Demon Art deleted successfully",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Error deleting Blood Demon Art:", error);

    return res.status(500).json({
      message: "Failed to delete Blood Demon Art"
    });
  }
}

// TECHNIQUES
// Validation function to check if a technique's parent exists in the database
async function validateTechniqueParent(category, parentId, client) {
  const table =
    category === "breathing"
      ? "breathing_styles"
      : "blood_demon_arts";

  const result = await client.query(
    `SELECT id FROM ${table} WHERE id = $1`,
    [parentId]
  );

  return result.rows.length > 0;
}

// POST a new Technique
export async function createTechnique(req, res) {
  const {
    id,
    name,
    category,
    parent_id,
    user_ids = [],
    description = ""
  } = req.body ?? {};

  const validCategory =
    category === "breathing" ||
    category === "blood-demon-art";

  if (
    typeof id !== "string" ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) ||
    typeof name !== "string" ||
    !name.trim() ||
    !validCategory ||
    typeof parent_id !== "string" ||
    !parent_id.trim() ||
    !Array.isArray(user_ids) ||
    !user_ids.every((user) => typeof user === "string") ||
    typeof description !== "string"
  ) {
    return res.status(400).json({
      message: "Invalid Technique data"
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const parentExists = await validateTechniqueParent(
      category,
      parent_id,
      client
    );

    if (!parentExists) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "The specified parent does not exist"
      });
    }

    const result = await client.query(
      `
      INSERT INTO techniques (
        id,
        name,
        category,
        parent_id,
        user_ids,
        description
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        id,
        name.trim(),
        category,
        parent_id,
        user_ids,
        description
      ]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      message: "Technique created successfully",
      data: result.rows[0]
    });

  } catch (error) {
    await client.query("ROLLBACK");

    if (error.code === "23505") {
      return res.status(409).json({
        message: "A Technique with this ID already exists"
      });
    }

    console.error("Error creating Technique:", error);

    return res.status(500).json({
      message: "Failed to create Technique"
    });

  } finally {
    client.release();
  }
}

// PUT to update an existing Technique
export async function updateTechnique(req, res) {
  const { id } = req.params;
  const updates = req.body;

  if (
    !updates ||
    typeof updates !== "object" ||
    Array.isArray(updates)
  ) {
    return res.status(400).json({
      message: "Request body must be a JSON object"
    });
  }

  const allowedFields = [
    "name",
    "category",
    "parent_id",
    "user_ids",
    "description"
  ];

  const fields = Object.keys(updates);

  if (fields.length === 0) {
    return res.status(400).json({
      message: "No fields provided for updating"
    });
  }

  const invalidFields = fields.filter(
    (field) => !allowedFields.includes(field)
  );

  if (invalidFields.length > 0) {
    return res.status(400).json({
      message: "Invalid fields",
      fields: invalidFields
    });
  }

  for (const field of fields) {
    const value = updates[field];

    if (
      field === "name" &&
      (typeof value !== "string" || !value.trim())
    ) {
      return res.status(400).json({
        message: "name must be a non-empty string"
      });
    }

    if (
      ["parent_id", "description"].includes(field) &&
      (typeof value !== "string" ||
        (field === "parent_id" && !value.trim()))
    ) {
      return res.status(400).json({
        message: `Invalid value for ${field}`
      });
    }

    if (
      field === "category" &&
      !["breathing", "blood-demon-art"].includes(value)
    ) {
      return res.status(400).json({
        message: "Invalid category"
      });
    }

    if (
      field === "user_ids" &&
      (
        !Array.isArray(value) ||
        !value.every((user) => typeof user === "string")
      )
    ) {
      return res.status(400).json({
        message: "user_ids must be an array of strings"
      });
    }
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Get existing category and parent
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
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Technique not found"
      });
    }

    const category =
      updates.category ?? existing.rows[0].category;

    const parentId =
      updates.parent_id ?? existing.rows[0].parent_id;

    const parentExists = await validateTechniqueParent(
      category,
      parentId,
      client
    );

    if (!parentExists) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "The specified parent does not exist"
      });
    }

    const setClause = fields
      .map((field, index) => `${field} = $${index + 1}`)
      .join(", ");

    const values = fields.map((field) =>
      field === "name"
        ? updates[field].trim()
        : updates[field]
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
      data: result.rows[0]
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Error updating Technique:", error);

    return res.status(500).json({
      message: "Failed to update Technique"
    });

  } finally {
    client.release();
  }
}


// DELETE a Technique by ID
export async function deleteTechnique(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      DELETE FROM techniques
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Technique not found"
      });
    }

    return res.status(200).json({
      message: "Technique deleted successfully",
      data: result.rows[0]
    });

  } catch (error) {
    console.error("Error deleting Technique:", error);

    return res.status(500).json({
      message: "Failed to delete Technique"
    });
  }
}
