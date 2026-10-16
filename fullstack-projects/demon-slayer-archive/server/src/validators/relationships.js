import pool from "../config/db.js";
import AppError from "../utils/AppError.js";

// ==========================================
// TABLE CONFIGURATION
// ==========================================

// These table and column names are hardcoded.
// Never build SQL identifiers from request input.

const TABLES = {
  slayers: "slayers",
  demons: "demons",
  "breathing-styles": "breathing_styles",
  "blood-demon-arts": "blood_demon_arts",
  techniques: "techniques",
};

// ==========================================
// DATABASE HELPERS
// ==========================================

async function recordExists(table, id) {
  const result = await pool.query(`SELECT 1 FROM ${table} WHERE id = $1`, [id]);

  return result.rowCount > 0;
}

async function checkIds(ids, table, field) {
  if (ids === undefined || ids.length === 0) {
    return;
  }

  const uniqueIds = [...new Set(ids)];

  const result = await pool.query(
    `
    SELECT id
    FROM ${table}
    WHERE id = ANY($1::text[])
    `,
    [uniqueIds],
  );

  const existing = new Set(result.rows.map((row) => row.id));

  const missing = uniqueIds.filter((id) => !existing.has(id));

  if (missing.length > 0) {
    throw new AppError(
      `${field} contains unknown IDs: ${missing.join(", ")}`,
      400,
    );
  }
}

// Characters may exist in either table.
async function checkCharacters(ids, currentId) {
  if (ids === undefined || ids.length === 0) {
    return;
  }

  // A character may reference itself when being created.
  const uniqueIds = [...new Set(ids.filter((id) => id !== currentId))];

  if (uniqueIds.length === 0) {
    return;
  }

  const result = await pool.query(
    `
    SELECT id FROM slayers
    WHERE id = ANY($1::text[])

    UNION

    SELECT id FROM demons
    WHERE id = ANY($1::text[])
    `,
    [uniqueIds],
  );

  const existing = new Set(result.rows.map((row) => row.id));

  const missing = uniqueIds.filter((id) => !existing.has(id));

  if (missing.length > 0) {
    throw new AppError(
      `Unknown related characters: ${missing.join(", ")}`,
      400,
    );
  }
}

// ==========================================
// TECHNIQUE REFERENCE VALIDATION
// ==========================================

async function checkTechniques(ids, category, field, expectedParentIds) {
  if (ids === undefined || ids.length === 0) {
    return;
  }

  const uniqueIds = [...new Set(ids)];

  const result = await pool.query(
    `
    SELECT id, category, parent_id
    FROM techniques
    WHERE id = ANY($1::text[])
    `,
    [uniqueIds],
  );

  const found = new Map(result.rows.map((row) => [row.id, row]));

  for (const id of uniqueIds) {
    const technique = found.get(id);

    if (!technique) {
      throw new AppError(
        `${field} references an unknown technique: ${id}`,
        400,
      );
    }

    if (technique.category !== category) {
      throw new AppError(`Technique ${id} has the wrong category`, 400);
    }

    if (
      expectedParentIds !== undefined &&
      !expectedParentIds.includes(technique.parent_id)
    ) {
      throw new AppError(
        `Technique ${id} does not belong to the specified parent`,
        400,
      );
    }
  }
}

// ==========================================
// SLAYER RELATIONSHIPS
// ==========================================

async function checkSlayer(data, id) {
  await checkIds(
    data.breathing_style_ids,
    "breathing_styles",
    "breathing_style_ids",
  );

  await checkTechniques(data.technique_ids, "breathing", "technique_ids");

  await checkCharacters(data.related_character_ids, id);
}

// ==========================================
// DEMON RELATIONSHIPS
// ==========================================

async function checkDemon(data, id) {
  await checkIds(
    data.blood_demon_art_ids,
    "blood_demon_arts",
    "blood_demon_art_ids",
  );

  await checkTechniques(data.ability_ids, "blood-demon-art", "ability_ids");

  await checkCharacters(data.related_character_ids, id);
}

// ==========================================
// BREATHING STYLE RELATIONSHIPS
// ==========================================

async function checkBreathingStyle(data, id) {
  const parentId = data.derived_from_id;

  if (parentId !== undefined && parentId !== null) {
    if (parentId === id) {
      throw new AppError("A Breathing Style cannot derive from itself", 400);
    }

    const exists = await recordExists("breathing_styles", parentId);

    if (!exists) {
      throw new AppError(
        `Parent Breathing Style does not exist: ${parentId}`,
        400,
      );
    }

    // Detect longer inheritance cycles, such as A -> B -> A.
    const result = await pool.query(
      `
      WITH RECURSIVE ancestors AS (
        SELECT id, derived_from_id,
               ARRAY[id] AS visited
        FROM breathing_styles
        WHERE id = $1

        UNION ALL

        SELECT b.id, b.derived_from_id,
               a.visited || b.id
        FROM breathing_styles b
        JOIN ancestors a
          ON b.id = a.derived_from_id
        WHERE NOT b.id = ANY(a.visited)
      )
      SELECT 1
      FROM ancestors
      WHERE id = $2
      LIMIT 1
      `,
      [parentId, id],
    );

    if (result.rowCount > 0) {
      throw new AppError(
        "This Breathing Style would create an inheritance cycle",
        400,
      );
    }
  }

  await checkCharacters(data.user_ids);

  await checkTechniques(data.technique_ids, "breathing", "technique_ids", [id]);
}

// ==========================================
// BLOOD DEMON ART RELATIONSHIPS
// ==========================================

async function checkBloodDemonArt(data, id) {
  if (data.user_id !== undefined && data.user_id !== null) {
    const exists = await recordExists("demons", data.user_id);

    if (!exists) {
      throw new AppError(`Demon does not exist: ${data.user_id}`, 400);
    }
  }

  await checkTechniques(data.ability_ids, "blood-demon-art", "ability_ids", [
    id,
  ]);
}

// ==========================================
// TECHNIQUE RELATIONSHIPS
// ==========================================

async function checkTechnique(data, id) {
  let category = data.category;
  let parentId = data.parent_id;

  // PATCH might supply only one field.
  if (id && (category === undefined || parentId === undefined)) {
    const result = await pool.query(
      `
      SELECT category, parent_id
      FROM techniques
      WHERE id = $1
      `,
      [id],
    );

    if (result.rowCount === 0) {
      throw new AppError("Technique not found", 404);
    }

    category ??= result.rows[0].category;
    parentId ??= result.rows[0].parent_id;
  }

  if (category === "breathing") {
    const exists = await recordExists("breathing_styles", parentId);

    if (!exists) {
      throw new AppError(`Breathing Style does not exist: ${parentId}`, 400);
    }

    await checkCharacters(data.user_ids);
  } else if (category === "blood-demon-art") {
    const exists = await recordExists("blood_demon_arts", parentId);

    if (!exists) {
      throw new AppError(`Blood Demon Art does not exist: ${parentId}`, 400);
    }

    await checkIds(data.user_ids, "demons", "user_ids");
  } else {
    throw new AppError("Invalid Technique category", 400);
  }

  // Prevent changing the category or parent when
  // another collection references this technique
  // through its parent-specific technique array.
  if (id && (data.category !== undefined || data.parent_id !== undefined)) {
    const references = await pool.query(
      `
      SELECT EXISTS (
        SELECT 1 FROM breathing_styles
        WHERE $1 = ANY(technique_ids)
          AND id <> $2
      ) AS other_breathing_refs,
      EXISTS (
        SELECT 1 FROM blood_demon_arts
        WHERE $1 = ANY(ability_ids)
          AND id <> $2
      ) AS other_art_refs
      `,
      [id, parentId],
    );

    const refs = references.rows[0];

    if (refs.other_breathing_refs || refs.other_art_refs) {
      throw new AppError(
        "Technique has references under another parent. Update those references first.",
        409,
      );
    }
  }
}

// ==========================================
// EXPORTED VALIDATION MIDDLEWARE
// ==========================================

export function validateRelationships(collection) {
  return async (req, res, next) => {
    try {
      const data = res.locals.validatedBody;

      if (!data) {
        throw new AppError("Validated request body is missing", 500);
      }

      const id = req.params.id ?? data.id;

      switch (collection) {
        case "slayers":
          await checkSlayer(data, id);
          break;

        case "demons":
          await checkDemon(data, id);
          break;

        case "breathing-styles":
          await checkBreathingStyle(data, id);
          break;

        case "blood-demon-arts":
          await checkBloodDemonArt(data, id);
          break;

        case "techniques":
          await checkTechnique(data, req.params.id);
          break;

        default:
          throw new AppError("Unknown collection", 404);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

// ==========================================
// DELETE PROTECTION CONFIGURATION
// ==========================================

const deletionChecks = {
  slayers: [
    ["slayers", "related_character_ids", "array"],
    ["demons", "related_character_ids", "array"],
    ["breathing_styles", "user_ids", "array"],
    ["techniques", "user_ids", "array"],
  ],

  demons: [
    ["slayers", "related_character_ids", "array"],
    ["demons", "related_character_ids", "array"],
    ["blood_demon_arts", "user_id", "single"],
    ["techniques", "user_ids", "array"],
  ],

  "breathing-styles": [
    ["slayers", "breathing_style_ids", "array"],
    ["breathing_styles", "derived_from_id", "single"],
    ["techniques", "parent_id", "single"],
  ],

  "blood-demon-arts": [
    ["demons", "blood_demon_art_ids", "array"],
    ["techniques", "parent_id", "single"],
  ],

  techniques: [
    ["slayers", "technique_ids", "array"],
    ["demons", "ability_ids", "array"],
    ["breathing_styles", "technique_ids", "array"],
    ["blood_demon_arts", "ability_ids", "array"],
  ],
};

// ==========================================
// EXPORTED DELETE PROTECTION MIDDLEWARE
// ==========================================

export function protectDeletion(collection) {
  return async (req, res, next) => {
    try {
      const id = req.params.id;
      const table = TABLES[collection];
      const checks = deletionChecks[collection];

      if (!table || !checks) {
        throw new AppError("Unknown collection", 404);
      }

      const exists = await recordExists(table, id);

      if (!exists) {
        throw new AppError("Record not found", 404);
      }

      for (const [refTable, column, kind] of checks) {
        // Exclude the record being deleted from
        // self-reference checks.
        const excludeSelf = refTable === table ? " AND id <> $1" : "";

        const condition =
          kind === "array" ? `$1 = ANY(${column})` : `${column} = $1`;

        const result = await pool.query(
          `
          SELECT 1
          FROM ${refTable}
          WHERE ${condition}${excludeSelf}
          LIMIT 1
          `,
          [id],
        );

        if (result.rowCount > 0) {
          throw new AppError(
            `Cannot delete ${collection}/${id}: referenced by ${refTable}.${column}`,
            409,
          );
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
