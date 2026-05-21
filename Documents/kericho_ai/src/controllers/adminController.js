/**
 * Admin Controller
 * 
 * Handlers for admin dashboard endpoints
 * All endpoints require valid ADMIN_API_KEY
 * 
 * Endpoints:
 * - GET /admin/stats - Dashboard summary
 * - GET /admin/users - List users with pagination
 * - GET /admin/messages - User messages/content
 * - GET /admin/emergencies - Recent emergency messages
 * - GET /admin/feedback - User feedback entries
 * - GET /admin/topics - Most common topics
 */

const logger = require('../lib/logger');
const prisma = require('../lib/prisma');
const env = require('../config/env');
const { getLogSummary, getErrorStats } = require('../../services/logService');
const { getQueueSnapshot } = require('../../services/queueService');
const {
  getDashboardSummary,
  getTotalUsers,
  getTotalMessages,
  getEmergencyCount,
  getMostCommonTopics,
  getActiveUsersInPeriod,
  getFeedbackStats,
  getAverageRating,
  getLowRatedResponses,
  getRecentEmergencies,
  getUsersWithMessageCount,
  getFeedbackEntries,
  getMessagesByTopicAndEscalation,
} = require('../services/analyticsService');

/**
 * Get dashboard statistics
 * GET /admin/stats
 */
async function getStats(req, res) {
  try {
    const stats = await getDashboardSummary();
    
    return res.status(200).json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ err: error }, 'Error getting dashboard stats');
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve stats',
    });
  }
}

/**
 * Get list of users
 * GET /admin/users?limit=50&offset=0
 */
async function getUsers(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 500); // Max 500
    const offset = parseInt(req.query.offset, 10) || 0;

    const users = await getUsersWithMessageCount({ limit, offset });
    const totalUsers = await getTotalUsers();

    return res.status(200).json({
      success: true,
      data: users,
      pagination: {
        offset,
        limit,
        total: totalUsers,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ err: error }, 'Error getting users');
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve users',
    });
  }
}

/**
 * Get recent messages with filters
 * GET /admin/messages?limit=100&offset=0&topic=malaria&escalated=false
 */
async function getMessages(req, res) {
  try {
    // For detailed message listing, query directly from Prisma
    // This is a simplified version - in production, add filters
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 1000);
    const escalated = req.query.escalated === 'true';

    let where = {};
    if (escalated !== undefined) {
      where.escalationSuggested = escalated;
    }
    if (req.query.topic) {
      where.topic = req.query.topic;
    }

    const messages = await prisma.conversationMessage.findMany({
      where,
      include: {
        user: {
          select: {
            whatsappNumber: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return res.status(200).json({
      success: true,
      data: messages.map((m) => ({
        id: m.id,
        userPhone: m.user?.whatsappNumber || 'unknown',
        content: m.content.substring(0, 150),
        topic: m.topic,
        escalated: m.escalationSuggested,
        source: m.source,
        timestamp: m.createdAt,
      })),
      count: messages.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ err: error }, 'Error getting messages');

    // If the database is unavailable, keep the dashboard usable by returning
    // an empty dataset instead of failing the whole admin UI.
    return res.status(200).json({
      success: true,
      data: [],
      count: 0,
      degraded: true,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Get emergency messages
 * GET /admin/emergencies?days=30&limit=100
 */
async function getEmergencies(req, res) {
  try {
    const days = parseInt(req.query.days, 10) || 30;
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 1000);

    const emergencies = await getRecentEmergencies(days);

    return res.status(200).json({
      success: true,
      data: emergencies.slice(0, limit),
      summary: {
        totalEmergencies: emergencies.length,
        period: `${days} days`,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ err: error }, 'Error getting emergencies');
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve emergencies',
    });
  }
}

/**
 * Get user feedback
 * GET /admin/feedback?limit=50
 */
async function getFeedback(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 500);

    const [feedback, feedbackStats, averageScore, lowRatedResponses] = await Promise.all([
      getFeedbackEntries({ limit }),
      getFeedbackStats(),
      getAverageRating(),
      getLowRatedResponses(limit),
    ]);

    return res.status(200).json({
      success: true,
      data: feedback,
      stats: {
        ...feedbackStats,
        averageScore,
      },
      insights: {
        lowRatedResponses,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ err: error }, 'Error getting feedback');
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve feedback',
    });
  }
}

/**
 * Get most common topics
 * GET /admin/topics?limit=10
 */
async function getTopics(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);

    const topics = await getMostCommonTopics(limit);
    const breakdown = await getMessagesByTopicAndEscalation();

    return res.status(200).json({
      success: true,
      data: {
        topTopics: topics,
        breakdown,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ err: error }, 'Error getting topics');
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve topics',
    });
  }
}

/**
 * Get health check
 * GET /admin/health
 * Useful for monitoring the admin API
 */
async function getHealth(req, res) {
  try {
    const stats = {
      users: await getTotalUsers(),
      messages: await getTotalMessages(),
      emergencies: await getEmergencyCount(),
    };

    const whatsappStatus = env.WHATSAPP_PROVIDER === 'meta' ? 'webhook' : 'connected';

    return res.status(200).json({
      success: true,
      status: 'healthy',
      ok: true,
      database: 'reachable',
      whatsapp: whatsappStatus,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ err: error }, 'Health check failed');
    return res.status(500).json({
      success: false,
      status: 'degraded',
      ok: false,
      database: 'unreachable',
      whatsapp: env.WHATSAPP_PROVIDER === 'meta' ? 'webhook' : 'disconnected',
      data: {
        users: 0,
        messages: 0,
        emergencies: 0,
      },
      error: error.message,
    });
  }
}

/**
 * Get log summary for the dashboard
 * GET /admin/logs
 */
async function getLogs(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const summary = getLogSummary(limit);
    const stats = getErrorStats();

    return res.status(200).json({
      success: true,
      data: {
        active: summary.active,
        filesCount: summary.logCount,
        files: summary.files,
        errorStats: stats,
        recentErrors: summary.recentErrors.slice(-20),
        recentCombined: summary.recentCombined.slice(-limit),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ err: error }, 'Error getting logs');
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve logs',
    });
  }
}

/**
 * Get queue status for the dashboard
 * GET /admin/queue
 */
async function getQueue(req, res) {
  try {
    const snapshot = getQueueSnapshot();
    const summary = {
      total: snapshot.length,
      pending: snapshot.filter((j) => j.status === 'pending').length,
      processing: snapshot.filter((j) => j.status === 'processing').length,
      completed: snapshot.filter((j) => j.status === 'completed').length,
      failed: snapshot.filter((j) => j.status === 'failed').length,
    };

    // Include failed job details for debugging
    const failedJobs = snapshot.filter((j) => j.status === 'failed').map((j) => ({
      id: j.id,
      type: j.type,
      retries: j.retries,
      lastError: j.lastError,
      createdAt: j.createdAt,
    }));

    return res.status(200).json({
      success: true,
      data: {
        summary,
        failedJobs,
        jobs: snapshot.slice(-50), // Recent 50 jobs
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ err: error }, 'Error getting queue');
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve queue',
    });
  }
}

module.exports = {
  getStats,
  getUsers,
  getMessages,
  getEmergencies,
  getFeedback,
  getTopics,
  getHealth,
  getLogs,
  getQueue,
};
