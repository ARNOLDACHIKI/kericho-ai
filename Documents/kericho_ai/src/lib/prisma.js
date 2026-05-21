const { PrismaClient } = require("@prisma/client");
const logger = require("./logger");
const env = require("../config/env");

let isConnected = false;
const prisma = new PrismaClient();

const connectDB = async () => {
  if (isConnected) {
    logger.info("Database already connected");
    return;
  }

  try {
    await prisma.$connect();
    isConnected = true;
    logger.info({ uri: env.DATABASE_URL }, "Connected to PostgreSQL");
  } catch (error) {
    logger.error({ error }, "Failed to connect to PostgreSQL");
  }
};

const disconnectDB = async () => {
  if (isConnected) {
    await prisma.$disconnect();
    isConnected = false;
    logger.info("Disconnected from PostgreSQL");
  }
};

module.exports = prisma;
module.exports.connectDB = connectDB;
module.exports.disconnectDB = disconnectDB;
module.exports.isConnected = () => isConnected;
