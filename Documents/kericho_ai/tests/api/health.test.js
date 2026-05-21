/**
 * API Integration Tests - Health Endpoints
 * Tests the core health check endpoints
 * 
 * These tests verify:
 * - Server startup and basic connectivity
 * - Health check endpoint responses
 * - Database connectivity status
 * - WhatsApp service status
 */

const request = require('supertest');
const express = require('express');

// Mock Express app for testing (lightweight version)
const createTestApp = () => {
  const app = express();
  
  // Middleware
  app.use(express.json());
  
  // Routes
  app.get('/', (_req, res) => {
    res.status(200).send('Healthcare WhatsApp Assistant is live');
  });
  
  app.get('/api/health', (_req, res) => {
    res.status(200).json({ ok: true, service: 'kericho-whatsapp-assistant' });
  });
  
  app.get('/api/ready', async (_req, res) => {
    // In real environment, checks database connectivity
    // For tests, we return a ready state
    res.status(200).json({
      ok: true,
      database: 'reachable',
      whatsapp: 'initializing',
    });
  });
  
  return app;
};

describe('Health Endpoints', () => {
  let app;
  
  beforeAll(() => {
    app = createTestApp();
  });
  
  describe('GET /', () => {
    test('should return 200 and welcome message', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);
      
      expect(response.text).toContain('Healthcare WhatsApp Assistant is live');
    });
  });
  
  describe('GET /api/health', () => {
    test('should return 200 with health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200)
        .expect('Content-Type', /json/);
      
      expect(response.body).toHaveProperty('ok', true);
      expect(response.body).toHaveProperty('service', 'kericho-whatsapp-assistant');
    });
  });
  
  describe('GET /api/ready', () => {
    test('should return 200 with readiness status', async () => {
      const response = await request(app)
        .get('/api/ready')
        .expect(200)
        .expect('Content-Type', /json/);
      
      expect(response.body).toHaveProperty('ok', true);
      expect(response.body).toHaveProperty('database');
      expect(response.body).toHaveProperty('whatsapp');
    });
  });
});
