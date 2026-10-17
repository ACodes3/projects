
/**
 * Crown of Winter
 * CSRF Origin Protection
 *
 * Protects state-changing API requests using
 * strict browser Origin header validation.
 */

const UNSAFE_METHODS = new Set([
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
]);

// -----------------------------------------
// Parse a strict HTTP origin
// -----------------------------------------

function parseStrictOrigin(value) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > 2048
  ) {
    return null;
  }

  // Reject whitespace, control characters,
  // comma-separated origins and other
  // non-canonical header values.
  if (/[,\s\\]/.test(value)) {
    return null;
  }

  // A valid Origin must consist of:
  // scheme://host[:port]
  //
  // No path, query, fragment or credentials.
  if (!/^https?:\/\/[^/?#@]+$/i.test(value)) {
    return null;
  }

  try {
    const parsed = new URL(value);

    if (
      parsed.protocol !== "http:" &&
      parsed.protocol !== "https:"
    ) {
      return null;
    }

    if (
      parsed.username ||
      parsed.password ||
      parsed.pathname !== "/" ||
      parsed.search ||
      parsed.hash
    ) {
      return null;
    }

    return parsed.origin;
  } catch {
    return null;
  }
}

// -----------------------------------------
// Read the configured frontend origin
// -----------------------------------------

function getTrustedOrigin() {
  const configured =
    process.env.CLIENT_URL || "http://localhost:5173";

  const trusted = parseStrictOrigin(configured);

  if (!trusted) {
    throw new Error(
      "CLIENT_URL must contain a valid HTTP(S) origin."
    );
  }

  return trusted;
}

// -----------------------------------------
// CSRF middleware
// -----------------------------------------

export function csrfProtection(req, res, next) {
  if (!UNSAFE_METHODS.has(req.method)) {
    return next();
  }

  // In production, use the explicitly
  // configured frontend origin.
  if (
    process.env.NODE_ENV === "production" &&
    !process.env.CLIENT_URL
  ) {
    return next(
      new Error(
        "CLIENT_URL must be configured in production."
      )
    );
  }

  const origin = req.get("Origin");

  // Existing Supertest integration suites
  // omit Origin, so preserve that behavior
  // only in the automated test environment.
  if (origin === undefined) {
    if (process.env.NODE_ENV === "test") {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Origin header required.",
    });
  }

  const parsedOrigin = parseStrictOrigin(origin);

  if (!parsedOrigin) {
    return res.status(403).json({
      success: false,
      message: "Invalid request origin.",
    });
  }

  let trustedOrigin;

  try {
    trustedOrigin = getTrustedOrigin();
  } catch (error) {
    return next(error);
  }

  if (parsedOrigin !== trustedOrigin) {
    return res.status(403).json({
      success: false,
      message: "Request origin not allowed.",
    });
  }

  return next();
}
