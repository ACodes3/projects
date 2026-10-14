
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
