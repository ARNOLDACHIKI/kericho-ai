const { PrismaClient } = require("@prisma/client");
const {
  hashPassword,
  comparePassword,
  generateToken,
} = require("../services/authService");

const prisma = new PrismaClient();

async function login(req, res) {
  try {
    const { username, password } = req.body || {};
    console.info("[authController] login attempt", { username, env: process.env.NODE_ENV });

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: "username and password are required",
      });
    }

    let admin = null;
    try {
      admin = await prisma.admin.findUnique({
        where: { username: String(username) },
      });
    } catch (dbErr) {
      console.error("[authController] DB lookup failed:", dbErr && dbErr.message);
      // Leave admin as null so we can fall back to development bootstrap below
    }

    // If admin not found in DB, allow a local development fallback when DB is unavailable.
    if (!admin) {
      if (process.env.NODE_ENV === "development") {
        const devUser = process.env.ADMIN_BOOTSTRAP_USERNAME || "admin";
        const devPass = process.env.ADMIN_BOOTSTRAP_PASSWORD || "ChangeMe123!";
        if (String(username) === String(devUser) && String(password) === String(devPass)) {
          const fakeAdmin = { id: 0, username: devUser };
          const token = generateToken(fakeAdmin);
          return res.status(200).json({
            success: true,
            token,
            user: { id: fakeAdmin.id, username: fakeAdmin.username },
          });
        }
      }

      return res.status(401).json({
        success: false,
        error: "Invalid username or password",
      });
    }

    const isMatch = await comparePassword(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Invalid username or password",
      });
    }

    const token = generateToken(admin);

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: admin.id,
        username: admin.username,
      },
    });
  } catch (error) {
    console.error("[authController] login error:", error.message);
    return res.status(500).json({
      success: false,
      error: "Failed to login",
    });
  }
}

async function register(req, res) {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: "username and password are required",
      });
    }

    if (String(password).length < 8) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 8 characters",
      });
    }

    const existingAdmin = await prisma.admin.findUnique({
      where: { username: String(username) },
    });

    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        error: "Username already exists",
      });
    }

    const passwordHash = await hashPassword(password);

    const admin = await prisma.admin.create({
      data: {
        username: String(username),
        password: passwordHash,
      },
    });

    const token = generateToken(admin);

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: admin.id,
        username: admin.username,
      },
    });
  } catch (error) {
    console.error("[authController] register error:", error.message);
    return res.status(500).json({
      success: false,
      error: "Failed to register admin",
    });
  }
}

module.exports = {
  login,
  register,
};
