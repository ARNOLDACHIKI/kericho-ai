const express = require("express");
const { login, register } = require("../../controllers/authController");

const router = express.Router();

// Login endpoint used by admin dashboard.
router.post("/login", login);

// Optional bootstrap endpoint to create an admin account.
router.post("/register", register);

module.exports = router;
