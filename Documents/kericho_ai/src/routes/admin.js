/**
 * Admin Dashboard Routes
 * 
 * All endpoints protected with JWT bearer authentication
 * 
 * Security:
 * - Requires Authorization: Bearer <token>
 * - Token issued by POST /auth/login
 * - Rejects all requests without valid token
 * 
 * Base routes:
 * GET  /admin/health        - Service health check
 * GET  /admin/stats        - Dashboard summary
 * GET  /admin/users        - Users list
 * GET  /admin/messages     - Messages list
 * GET  /admin/emergencies  - Emergency messages
 * GET  /admin/feedback     - Feedback entries
 * GET  /admin/topics       - Topic statistics
 */

const express = require('express');
const adminController = require('../controllers/adminController');
const { checkAuthorization } = require('../../middleware/authMiddleware');

const router = express.Router();

// Apply JWT authorization to all admin routes.
router.use(checkAuthorization);

// ============================================================
// ROUTES
// ============================================================

/**
 * Health check
 * GET /admin/health
 * 
 * Response:
 * {
 *   "success": true,
 *   "status": "healthy",
 *   "data": {
 *     "users": 120,
 *     "messages": 540,
 *     "emergencies": 12
 *   }
 * }
 */
router.get('/health', adminController.getHealth);

/**
 * Dashboard statistics
 * GET /admin/stats
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "summary": {
 *       "totalUsers": 120,
 *       "totalMessages": 540,
 *       "emergencyCount": 12,
 *       "activeUsers7d": 85,
 *       "emergencyRate": "2.22"
 *     },
 *     "topTopics": [
 *       {"topic": "malaria", "count": 150},
 *       {"topic": "headache", "count": 120}
 *     ],
 *     "feedback": {
 *       "total": 45,
 *       "averageRating": 4.2
 *     },
 *     "recentEmergencies": [...]
 *   }
 * }
 */
router.get('/stats', adminController.getStats);

/**
 * Get users list
 * GET /admin/users?limit=50&offset=0
 * 
 * Query params:
 * - limit: Results per page (default: 50, max: 500)
 * - offset: Pagination offset (default: 0)
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "uid123",
 *       "whatsappNumber": "+254712345678",
 *       "preferredLanguage": "en",
 *       "joinedAt": "2025-01-15T10:30:00Z",
 *       "totalMessages": 25,
 *       "feedbackCount": 2
 *     }
 *   ],
 *   "pagination": {
 *     "offset": 0,
 *     "limit": 50,
 *     "total": 120
 *   }
 * }
 */
router.get('/users', adminController.getUsers);

/**
 * Get messages list
 * GET /admin/messages?limit=100&offset=0&topic=malaria&escalated=false
 * 
 * Query params:
 * - limit: Results per page (default: 100, max: 1000)
 * - offset: Pagination offset (default: 0)
 * - topic: Filter by topic (optional)
 * - escalated: Filter escalated messages (true/false, optional)
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "msg123",
 *       "userPhone": "+254712345678",
 *       "content": "I have a severe headache for 3 days...",
 *       "topic": "headache",
 *       "escalated": false,
 *       "source": "whatsapp",
 *       "timestamp": "2025-01-15T10:30:00Z"
 *     }
 *   ],
 *   "count": 5
 * }
 */
router.get('/messages', adminController.getMessages);

/**
 * Get emergency messages
 * GET /admin/emergencies?days=30&limit=100
 * 
 * Query params:
 * - days: Look back period in days (default: 30)
 * - limit: Results per page (default: 100, max: 1000)
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "msg123",
 *       "userId": "uid456",
 *       "userPhone": "+254712345678",
 *       "message": "can't breathe severely...",
 *       "topic": null,
 *       "timestamp": "2025-01-15T14:22:00Z",
 *       "source": "whatsapp"
 *     }
 *   ],
 *   "summary": {
 *     "totalEmergencies": 12,
 *     "period": "30 days"
 *   }
 * }
 */
router.get('/emergencies', adminController.getEmergencies);

/**
 * Get feedback entries
 * GET /admin/feedback?limit=50
 * 
 * Query params:
 * - limit: Results per page (default: 50, max: 500)
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": [
 *     {
 * GET  /admin/logs        - Recent log activity and error summaries
 *       "id": "fb123",
 *       "userPhone": "+254712345678",
 *       "rating": 5,
 *       "comment": "Great app, very helpful",
 *       "timestamp": "2025-01-15T12:00:00Z"
 *     }
 *   ],
 *   "stats": {
 *     "total": 45,
 *     "averageRating": 4.2
 *   }
 * }
 */
router.get('/feedback', adminController.getFeedback);

/**
 * Get topic statistics
 * GET /admin/topics?limit=10
 * 
 * Query params:
 * - limit: Top N topics (default: 10, max: 50)
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "topTopics": [
 *       {"topic": "malaria", "count": 150},
 *       {"topic": "headache", "count": 120}
 *     ],
 *     "breakdown": {
 *       "normal": [
 *         {"topic": "malaria", "count": 145},
 *         {"topic": "headache", "count": 115}
 *       ],
 *       "escalated": [
 *         {"topic": "malaria", "count": 5},
 *         {"topic": "headache", "count": 5}
 *       ]
 *     }
 *   }
 * }
 */
router.get('/topics', adminController.getTopics);

/**
 * Get log activity summary
 * GET /admin/logs?limit=50
 */
router.get('/logs', adminController.getLogs);

/**
 * Queue status
 * GET /admin/queue
 */
router.get('/queue', adminController.getQueue);

// ============================================================
// ERROR HANDLING
// ============================================================

// 404 for undefined admin routes
router.use((req, res) => {
  return res.status(404).json({
    success: false,
    error: `Admin endpoint not found: ${req.method} ${req.path}`,
  });
});

module.exports = router;
