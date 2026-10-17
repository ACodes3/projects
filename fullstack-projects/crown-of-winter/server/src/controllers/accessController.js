
// -----------------------------------------
// Get current character and permissions
// -----------------------------------------

export function getMyPermissions(req, res) {
  return res.status(200).json({
    success: true,
    data: {
      user: {
        id: req.user.id,
        username: req.user.username,
      },
      character: req.character,
      permissions: req.permissions,
    },
  });
}

// -----------------------------------------
// Test Sovereign-only access
// -----------------------------------------

export function verifySovereignAccess(req, res) {
  return res.status(200).json({
    success: true,
    message: "Sovereign authority verified.",
    data: {
      world_id: req.character.world_id,
      character: req.character.name,
      role: "SOVEREIGN",
    },
  });
}
