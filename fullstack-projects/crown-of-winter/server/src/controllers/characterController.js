
import {
  CharacterError,
  getWorldCharacters,
  getWorldAssignments,
  assignCharacter,
} from "../services/characterService.js";

// -----------------------------------------
// Error handling
// -----------------------------------------

function handleCharacterError(error, res, next) {
  if (error instanceof CharacterError) {
    return res.status(error.status).json({
      success: false,
      message: error.message,
    });
  }

  if (error.code === "23505") {
    return res.status(409).json({
      success: false,
      message: "Character assignment already exists.",
    });
  }

  next(error);
}

// -----------------------------------------
// GET characters
// -----------------------------------------

export async function listCharacters(req, res, next) {
  try {
    const characters = await getWorldCharacters(
      req.params.worldId,
      req.user.id
    );

    return res.status(200).json({
      success: true,
      data: { characters },
    });
  } catch (error) {
    return handleCharacterError(error, res, next);
  }
}

// -----------------------------------------
// GET assignments
// -----------------------------------------

export async function listAssignments(req, res, next) {
  try {
    const assignments = await getWorldAssignments(
      req.params.worldId,
      req.user.id
    );

    return res.status(200).json({
      success: true,
      data: { assignments },
    });
  } catch (error) {
    return handleCharacterError(error, res, next);
  }
}

// -----------------------------------------
// POST new assignment
// -----------------------------------------

export async function createAssignment(req, res, next) {
  try {
    const {
      membership_id,
      character_id,
      roles,
    } = req.body ?? {};

    const assignment = await assignCharacter({
      worldId: req.params.worldId,
      actorId: req.user.id,
      membershipId: membership_id,
      characterId: character_id,
      roleCodes: roles,
    });

    return res.status(201).json({
      success: true,
      message: "Character assigned successfully.",
      data: { assignment },
    });
  } catch (error) {
    return handleCharacterError(error, res, next);
  }
}
