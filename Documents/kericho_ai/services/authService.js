const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const env = require("../src/config/env");

const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = "1d";

async function hashPassword(password) {
  return bcrypt.hash(String(password || ""), SALT_ROUNDS);
}

async function comparePassword(password, hash) {
  return bcrypt.compare(String(password || ""), String(hash || ""));
}

function generateToken(user) {
  const payload = {
    id: user.id,
    username: user.username,
    role: "admin",
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });
}

function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
};
