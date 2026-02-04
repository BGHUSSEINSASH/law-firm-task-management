const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const inMemoryDB = require('../inMemoryDB');

// In-memory comments storage
const comments = new Map();

/**
 * GET /api/comments/:taskId
 * Get all comments for a task
 */
router.get('/:taskId', (req, res) => {
  try {
    const { taskId } = req.params;
    const taskComments = comments.get(taskId) || [];

    // Enrich with user data
    const enrichedComments = taskComments.map((comment) => ({
      ...comment,
      author: inMemoryDB.users.get(comment.user_id),
    }));

    res.json(enrichedComments);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Failed to fetch comments' });
  }
});

/**
 * POST /api/comments/:taskId
 * Create a comment on a task
 */
router.post('/:taskId', authMiddleware, (req, res) => {
  try {
    const { taskId } = req.params;
    const { content, mentions } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const task = inMemoryDB.tasks.get(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const comment = {
      id: Math.random(),
      taskId,
      user_id: req.user.id,
      content: content.trim(),
      mentions: mentions || [], // Array of user IDs mentioned
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      likes: [],
      replies: [],
    };

    // Store comment
    if (!comments.has(taskId)) {
      comments.set(taskId, []);
    }
    comments.get(taskId).push(comment);

    // Create notifications for mentioned users
    mentions?.forEach((userId) => {
      const user = inMemoryDB.users.get(userId);
      if (user) {
        inMemoryDB.notifications.push({
          id: Math.random(),
          user_id: userId,
          type: 'mention',
          title: 'تم الإشارة إليك',
          message: `تم ذكرك في مهمة: ${task.title}`,
          priority: 'high',
          created_at: new Date().toISOString(),
          read: false,
          taskId,
        });
      }
    });

    // Activity log
    inMemoryDB.activityLogs.push({
      id: Math.random(),
      user_id: req.user.id,
      action: 'comment_added',
      entity: 'comment',
      details: { taskId, commentId: comment.id },
      created_at: new Date().toISOString(),
    });

    res.status(201).json({
      ...comment,
      author: inMemoryDB.users.get(req.user.id),
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ message: 'Failed to create comment' });
  }
});

/**
 * PUT /api/comments/:commentId
 * Update a comment
 */
router.put('/:commentId', authMiddleware, (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    // Find comment
    let targetComment = null;
    let taskId = null;

    for (const [tId, taskComments] of comments.entries()) {
      const found = taskComments.find((c) => c.id === parseInt(commentId));
      if (found) {
        targetComment = found;
        taskId = tId;
        break;
      }
    }

    if (!targetComment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (targetComment.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this comment' });
    }

    targetComment.content = content.trim();
    targetComment.updatedAt = new Date().toISOString();

    res.json({
      ...targetComment,
      author: inMemoryDB.users.get(targetComment.user_id),
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ message: 'Failed to update comment' });
  }
});

/**
 * DELETE /api/comments/:commentId
 * Delete a comment
 */
router.delete('/:commentId', authMiddleware, (req, res) => {
  try {
    const { commentId } = req.params;

    // Find and delete comment
    for (const [taskId, taskComments] of comments.entries()) {
      const index = taskComments.findIndex((c) => c.id === parseInt(commentId));
      if (index !== -1) {
        const comment = taskComments[index];
        if (comment.user_id !== req.user.id) {
          return res.status(403).json({ message: 'Not authorized to delete this comment' });
        }

        taskComments.splice(index, 1);

        // Activity log
        inMemoryDB.activityLogs.push({
          id: Math.random(),
          user_id: req.user.id,
          action: 'comment_deleted',
          entity: 'comment',
          details: { taskId, commentId: comment.id },
          created_at: new Date().toISOString(),
        });

        return res.json({ message: 'Comment deleted successfully' });
      }
    }

    res.status(404).json({ message: 'Comment not found' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Failed to delete comment' });
  }
});

/**
 * POST /api/comments/:commentId/like
 * Like a comment
 */
router.post('/:commentId/like', authMiddleware, (req, res) => {
  try {
    const { commentId } = req.params;

    // Find comment
    for (const taskComments of comments.values()) {
      const comment = taskComments.find((c) => c.id === parseInt(commentId));
      if (comment) {
        const likeIndex = comment.likes.indexOf(req.user.id);
        if (likeIndex === -1) {
          comment.likes.push(req.user.id);
        } else {
          comment.likes.splice(likeIndex, 1);
        }
        return res.json({ likes: comment.likes.length, liked: likeIndex === -1 });
      }
    }

    res.status(404).json({ message: 'Comment not found' });
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({ message: 'Failed to like comment' });
  }
});

module.exports = router;
