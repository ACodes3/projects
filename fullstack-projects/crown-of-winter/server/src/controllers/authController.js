
import {
  registerUser,
  loginUser,
  logoutUser,
} from "../services/authService.js";

const COOKIE_NAME = "crown_session";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

// -----------------------------------------
// Register
// -----------------------------------------

export async function register(req, res) {
  try {
    const { username, email, password } = req.body ?? {};

    const user = await registerUser({
      username,
      email,
      password,
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      data: { user },
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Username or email already exists.",
      });
    }

    const validationErrors = [
      "Invalid registration data.",
      "Username must be between 3 and 50 characters.",
      "Please enter a valid email address.",
      "Password must be between 12 and 128 characters.",
    ];

    if (validationErrors.includes(error.message)) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
}

// -----------------------------------------
// Login
// -----------------------------------------

export async function login(req, res) {
  try {
    const { identifier, password } = req.body ?? {};

    const { token, user } = await loginUser({
      identifier,
      password,
    });

    res.cookie(COOKIE_NAME, token, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: { user },
    });
  } catch (error) {
    if (error.message === "Invalid login credentials.") {
      return res.status(401).json({
        success: false,
        message: "Invalid username/email or password.",
      });
    }

    if (error.message === "Account is not active.") {
      return res.status(403).json({
        success: false,
        message: "This account is not active.",
      });
    }

    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
}

// -----------------------------------------
// Get current authenticated user
// -----------------------------------------

export function getCurrentUser(req, res) {
  return res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
}

// -----------------------------------------
// Logout
// -----------------------------------------

export async function logout(req, res, next) {
  try {
    await logoutUser(req.sessionId);

    res.clearCookie(COOKIE_NAME, cookieOptions);

    return res.status(200).json({
      success: true,
      message: "Logout successful.",
    });
  } catch (error) {
    next(error);
  }
}
