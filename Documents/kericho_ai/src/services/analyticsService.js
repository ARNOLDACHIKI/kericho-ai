/**
 * Analytics Service
 * 
 * Provides database queries and aggregations for admin dashboard
 * Uses Prisma to query PostgreSQL data efficiently
 * 
 * Queries:
 * - Total active users
 * - Total messages
 * - Most common health topics
 * - Emergency message count
 * - User feedback stats
 * - Message trends by date
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Get total number of unique users
 * 
 * @returns {Promise<number>} - Count of users
 */
async function getTotalUsers() {
  try {
    const count = await prisma.user.count();
    return count;
  } catch (error) {
    console.error('[Analytics] Error getting total users:', error.message);
    return 0;
  }
}

/**
 * Get total number of messages exchanged
 * 
 * @returns {Promise<number>} - Count of conversation messages
 */
async function getTotalMessages() {
  try {
    const count = await prisma.conversationMessage.count();
    return count;
  } catch (error) {
    console.error('[Analytics] Error getting total messages:', error.message);
    return 0;
  }
}

/**
 * Get count of emergency messages (escalationSuggested = true)
 * 
 * @returns {Promise<number>} - Count of emergency messages
 */
async function getEmergencyCount() {
  try {
    const count = await prisma.conversationMessage.count({
      where: {
        escalationSuggested: true,
      },
    });
    return count;
  } catch (error) {
    console.error('[Analytics] Error getting emergency count:', error.message);
    return 0;
  }
}

/**
 * Get most common health topics discussed
 * 
 * @param {number} limit - Number of top topics to return (default: 10)
 * @returns {Promise<array>} - Array of {topic, count} sorted by frequency
 */
async function getMostCommonTopics(limit = 10) {
  try {
    const results = await prisma.conversationMessage.groupBy({
      by: ['topic'],
      _count: {
        id: true,
      },
      where: {
        topic: {
          not: null, // Exclude null topics
        },
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: limit,
    });

    return results.map((r) => ({
      topic: r.topic,
      count: r._count.id,
    }));
  } catch (error) {
    console.error('[Analytics] Error getting topics:', error.message);
    return [];
  }
}

/**
 * Get active users in last N days
 * 
 * @param {number} days - Number of days to look back (default: 7)
 * @returns {Promise<number>} - Count of users active in period
 */
async function getActiveUsersInPeriod(days = 7) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const count = await prisma.user.count({
      where: {
        messages: {
          some: {
            createdAt: {
              gte: startDate,
            },
          },
        },
      },
    });

    return count;
  } catch (error) {
    console.error('[Analytics] Error getting active users:', error.message);
    return 0;
  }
}

/**
 * Get total feedback entries and average rating
 * 
 * @returns {Promise<object>} - {total, averageRating}
 */
async function getFeedbackStats() {
  try {
    const feedbackList = await prisma.feedback.findMany({
      select: {
        rating: true,
      },
    });

    const total = feedbackList.length;
    const averageRating = await getAverageRating();

    return {
      total,
      averageRating,
      averageScore: averageRating,
    };
  } catch (error) {
    console.error('[Analytics] Error getting feedback stats:', error.message);
    return { total: 0, averageRating: 0, averageScore: 0 };
  }
}

/**
 * Get the average rating across all feedback
 *
 * @returns {Promise<number>} - Average rating score from 1-5
 */
async function getAverageRating() {
  try {
    const aggregates = await prisma.feedback.aggregate({
      _avg: {
        rating: true,
      },
      _count: {
        rating: true,
      },
    });

    const average = aggregates._avg.rating;
    return average ? parseFloat(Number(average).toFixed(2)) : 0;
  } catch (error) {
    console.error('[Analytics] Error getting average rating:', error.message);
    return 0;
  }
}

/**
 * Get messages grouped by topic and escalation status
 * 
 * @returns {Promise<object>} - {normal, escalated} with topic breakdowns
 */
async function getMessagesByTopicAndEscalation() {
  try {
    // Get normal messages by topic
    const normalMessages = await prisma.conversationMessage.groupBy({
      by: ['topic'],
      _count: {
        id: true,
      },
      where: {
        escalationSuggested: false,
        topic: { not: null },
      },
    });

    // Get escalated messages by topic
    const escalatedMessages = await prisma.conversationMessage.groupBy({
      by: ['topic'],
      _count: {
        id: true,
      },
      where: {
        escalationSuggested: true,
        topic: { not: null },
      },
    });

    return {
      normal: normalMessages.map((r) => ({
        topic: r.topic,
        count: r._count.id,
      })),
      escalated: escalatedMessages.map((r) => ({
        topic: r.topic,
        count: r._count.id,
      })),
    };
  } catch (error) {
    console.error('[Analytics] Error getting messages by topic:', error.message);
    return { normal: [], escalated: [] };
  }
}

/**
 * Get recent emergencies (last N days)
 * 
 * @param {number} days - Number of days to look back (default: 30)
 * @returns {Promise<array>} - Array of emergency messages with user and timestamp
 */
async function getRecentEmergencies(days = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const emergencies = await prisma.conversationMessage.findMany({
      where: {
        escalationSuggested: true,
        createdAt: {
          gte: startDate,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            whatsappNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });

    return emergencies.map((e) => ({
      id: e.id,
      userId: e.user.id,
      userPhone: e.user.whatsappNumber,
      message: e.content.substring(0, 100), // First 100 chars
      topic: e.topic,
      timestamp: e.createdAt,
      source: e.source,
    }));
  } catch (error) {
    console.error('[Analytics] Error getting recent emergencies:', error.message);
    return [];
  }
}

/**
 * Get user details with message count
 * 
 * @param {object} options - Query options
 * @param {number} options.limit - Number of users to return (default: 50)
 * @param {number} options.offset - Offset for pagination (default: 0)
 * @returns {Promise<array>} - Array of user objects with message count
 */
async function getUsersWithMessageCount(options = {}) {
  const { limit = 50, offset = 0 } = options;

  try {
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: {
            messages: true,
            feedbackEntries: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: offset,
      take: limit,
    });

    return users.map((u) => ({
      id: u.id,
      whatsappNumber: u.whatsappNumber,
      preferredLanguage: u.preferredLanguage,
      joinedAt: u.createdAt,
      totalMessages: u._count.messages,
      feedbackCount: u._count.feedbackEntries,
    }));
  } catch (error) {
    console.error('[Analytics] Error getting users:', error.message);
    return [];
  }
}

/**
 * Get all feedback entries
 * 
 * @param {object} options - Query options
 * @param {number} options.limit - Limit results
 * @returns {Promise<array>} - Feedback entries
 */
async function getFeedbackEntries(options = {}) {
  const { limit = 50 } = options;

  try {
    const feedback = await prisma.feedback.findMany({
      include: {
        user: {
          select: {
            whatsappNumber: true,
          },
        },
        message: {
          select: {
            id: true,
            content: true,
            topic: true,
            source: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return feedback.map((f) => ({
      id: f.id,
      userPhone: f.user?.whatsappNumber || 'anonymous',
      rating: f.rating,
      comment: f.comment,
      response: f.message?.content || null,
      responseTopic: f.message?.topic || null,
      timestamp: f.createdAt,
    }));
  } catch (error) {
    console.error('[Analytics] Error getting feedback:', error.message);
    return [];
  }
}

/**
 * Get responses that received a low rating (< 3)
 *
 * @param {number} limit - Maximum records to return
 * @returns {Promise<array>} - Low-rated feedback entries with linked responses
 */
async function getLowRatedResponses(limit = 20) {
  try {
    const feedback = await prisma.feedback.findMany({
      where: {
        rating: {
          lt: 3,
        },
      },
      include: {
        user: {
          select: {
            whatsappNumber: true,
          },
        },
        message: {
          select: {
            id: true,
            content: true,
            topic: true,
            source: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return feedback.map((entry) => ({
      id: entry.id,
      userPhone: entry.user?.whatsappNumber || 'anonymous',
      rating: entry.rating,
      comment: entry.comment,
      responseId: entry.messageId,
      response: entry.message?.content || null,
      topic: entry.message?.topic || null,
      timestamp: entry.createdAt,
    }));
  } catch (error) {
    console.error('[Analytics] Error getting low rated responses:', error.message);
    return [];
  }
}

/**
 * Get comprehensive dashboard summary
 * 
 * @returns {Promise<object>} - Complete dashboard stats
 */
async function getDashboardSummary() {
  try {
    const [
      totalUsers,
      totalMessages,
      emergencyCount,
      activeUsers7d,
      topTopics,
      feedbackStats,
      recentEmergencies,
    ] = await Promise.all([
      getTotalUsers(),
      getTotalMessages(),
      getEmergencyCount(),
      getActiveUsersInPeriod(7),
      getMostCommonTopics(5),
      getFeedbackStats(),
      getRecentEmergencies(7),
    ]);

    return {
      summary: {
        totalUsers,
        totalMessages,
        emergencyCount,
        activeUsers7d,
        emergencyRate:
          totalMessages > 0 ? ((emergencyCount / totalMessages) * 100).toFixed(2) : '0.00',
      },
      topTopics,
      feedback: feedbackStats,
      recentEmergencies: recentEmergencies.slice(0, 10),
    };
  } catch (error) {
    console.error('[Analytics] Error getting dashboard summary:', error.message);
    return {
      summary: {},
      topTopics: [],
      feedback: {},
      recentEmergencies: [],
    };
  }
}

module.exports = {
  getTotalUsers,
  getTotalMessages,
  getEmergencyCount,
  getMostCommonTopics,
  getActiveUsersInPeriod,
  getFeedbackStats,
  getAverageRating,
  getLowRatedResponses,
  getMessagesByTopicAndEscalation,
  getRecentEmergencies,
  getUsersWithMessageCount,
  getFeedbackEntries,
  getDashboardSummary,
};
