
import { registerUser } from "../services/authService.js";

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
    // Duplicate username or email
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Username or email already exists.",
      });
    }

    // Registration validation errors
    if (
      error.message === "Invalid registration data." ||
      error.message === "Username must be between 3 and 50 characters." ||
      error.message === "Please enter a valid email address." ||
      error.message === "Password must be between 12 and 128 characters."
    ) {
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
