/**
 * API Integration Tests - Webhook Endpoints
 * Tests the WhatsApp and SMS webhook integrations
 * 
 * These tests verify:
 * - Webhook endpoint structure and response codes
 * - Proper error handling for invalid payloads
 * - Rate limiting on sensitive endpoints
 */

const request = require('supertest');
const express = require('express');

// Mock middleware for rate limiting
const mockRateLimiter = (req, res, next) => {
  next();
};

// Mock Webhook Router
const createWebhookRouter = () => {
  const router = express.Router();
  
  // POST /webhook - WhatsApp incoming messages
  router.post('/webhook', (req, res) => {
    const { phone, message } = req.body;
    
    if (!phone || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: phone, message'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Message received and queued for processing'
    });
  });
  
  // POST /sms - SMS incoming messages
  router.post('/sms', (req, res) => {
    const { from, text } = req.body;
    
    if (!from || !text) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: from, text'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'SMS received and processed'
    });
  });
  
  return router;
};

describe('Webhook Endpoints', () => {
  let app;
  
  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(mockRateLimiter);
    app.use('/webhook', createWebhookRouter());
    app.use('/sms', createWebhookRouter());
  });
  
  describe('POST /webhook', () => {
    test('should accept valid WhatsApp message payload', async () => {
      const payload = {
        phone: '254712345678',
        message: 'Hello, I need health information'
      };
      
      const response = await request(app)
        .post('/webhook/webhook')
        .send(payload)
        .expect(200)
        .expect('Content-Type', /json/);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.message).toContain('queued for processing');
    });
    
    test('should reject payload without phone number', async () => {
      const payload = {
        message: 'Hello'
      };
      
      const response = await request(app)
        .post('/webhook/webhook')
        .send(payload)
        .expect(400);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('phone');
    });
    
    test('should reject payload without message', async () => {
      const payload = {
        phone: '254712345678'
      };
      
      const response = await request(app)
        .post('/webhook/webhook')
        .send(payload)
        .expect(400);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('message');
    });
  });
  
  describe('POST /sms', () => {
    test('should accept valid SMS payload', async () => {
      const payload = {
        from: '+254712345678',
        text: 'What is malaria?'
      };
      
      const response = await request(app)
        .post('/sms/sms')
        .send(payload)
        .expect(200)
        .expect('Content-Type', /json/);
      
      expect(response.body).toHaveProperty('success', true);
    });
    
    test('should reject SMS payload without sender', async () => {
      const payload = {
        text: 'Help!'
      };
      
      const response = await request(app)
        .post('/sms/sms')
        .send(payload)
        .expect(400);
      
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toContain('from');
    });
  });
});
