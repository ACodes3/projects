
import {
  createWorld,
  getUserWorlds,
  getWorldById,
} from "../services/worldService.js";

// -----------------------------------------
// Create world
// -----------------------------------------

export async function create(req, res, next) {
  try {
    const {
      name,
      mode = "singleplayer",
    } = req.body ?? {};

    const world = await createWorld({
      userId: req.user.id,
      name,
      mode,
    });

    return res.status(201).json({
      success: true,
      message: "World created successfully.",
      data: { world },
    });
  } catch (error) {
    const validationErrors = [
      "World name is required.",
      "World name must be between 3 and 100 characters.",
      "Invalid world mode.",
    ];

    if (validationErrors.includes(error.message)) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    next(error);
  }
}

// -----------------------------------------
// List my worlds
// -----------------------------------------

export async function list(req, res, next) {
  try {
    const worlds = await getUserWorlds(req.user.id);

    return res.status(200).json({
      success: true,
      data: { worlds },
    });
  } catch (error) {
    next(error);
  }
}

// -----------------------------------------
// Get specific world
// -----------------------------------------

export async function getOne(req, res, next) {
  try {
    const { worldId } = req.params;

    // PostgreSQL UUID validation
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!uuidPattern.test(worldId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid world ID.",
      });
    }

    const world = await getWorldById(
      worldId,
      req.user.id
    );

    if (!world) {
      return res.status(404).json({
        success: false,
        message: "World not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: { world },
    });
  } catch (error) {
    next(error);
  }
}
