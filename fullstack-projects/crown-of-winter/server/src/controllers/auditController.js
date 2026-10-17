
import { getWorldAuditLogs } from "../services/auditService.js";

// -----------------------------------------
// Parse pagination parameters
// -----------------------------------------

function parsePaginationValue(value, defaultValue, min, max) {
  if (value === undefined) {
    return defaultValue;
  }

  if (
    typeof value !== "string" ||
    !/^\d+$/.test(value)
  ) {
    return null;
  }

  const parsed = Number(value);

  if (
    !Number.isSafeInteger(parsed) ||
    parsed < min ||
    parsed > max
  ) {
    return null;
  }

  return parsed;
}

// -----------------------------------------
// GET /api/worlds/:worldId/audit-logs
// -----------------------------------------

export async function getAuditHistory(req, res, next) {
  try {
    const { worldId } = req.params;

    const limit = parsePaginationValue(
      req.query.limit,
      20,
      1,
      100
    );

    const offset = parsePaginationValue(
      req.query.offset,
      0,
      0,
      Number.MAX_SAFE_INTEGER
    );

    if (limit === null || offset === null) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid pagination parameters. Limit must be between 1 and 100, and offset must be a non-negative integer.",
      });
    }

    // Authorization has already been checked
    // by authenticate, loadWorldCharacter
    // and requirePermission("audit.view").

    const logs = await getWorldAuditLogs(worldId, {
      limit,
      offset,
    });

    return res.status(200).json({
      success: true,
      data: {
        world_id: worldId,
        logs,
        pagination: {
          limit,
          offset,
          count: logs.length,
          has_more: logs.length === limit,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}
