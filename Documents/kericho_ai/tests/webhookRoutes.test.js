const express = require("express");
const request = require("supertest");

const webhookRoutes = require("../src/routes/webhookRoutes");

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use("/webhook", webhookRoutes);
  return app;
}

describe("Webhook verification route", () => {
  test("GET /webhook returns the raw challenge on a valid token", async () => {
    const response = await request(createTestApp())
      .get("/webhook")
      .query({
        "hub.mode": "subscribe",
        "hub.verify_token": "healthcare_ai_verify_token",
        "hub.challenge": "12345",
      });

    expect(response.status).toBe(200);
    expect(response.text).toBe("12345");
    expect(response.headers["content-type"]).toMatch(/text\/plain/);
  });

  test("GET /webhook returns 403 on an invalid token", async () => {
    const response = await request(createTestApp())
      .get("/webhook")
      .query({
        "hub.mode": "subscribe",
        "hub.verify_token": "wrong-token",
        "hub.challenge": "12345",
      });

    expect(response.status).toBe(403);
  });

  test("GET /webhook returns 403 when verification params are missing", async () => {
    const response = await request(createTestApp()).get("/webhook");

    expect(response.status).toBe(403);
  });
});
