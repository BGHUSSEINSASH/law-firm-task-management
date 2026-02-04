// backend/services/mlAnalyticsService.js - Machine Learning Analytics

/**
 * Machine Learning Analytics Service
 * Provides predictive analytics and insights using simple ML algorithms
 */

class MLAnalyticsService {
  /**
   * Predict task completion time based on historical data
   */
  static predictCompletionTime(task, historicalTasks) {
    try {
      // Filter similar tasks (same priority, category)
      const similarTasks = historicalTasks.filter(
        (t) => t.priority === task.priority && t.category === task.category && t.completed_at
      );

      if (similarTasks.length < 3) {
        return null; // Not enough data
      }

      // Calculate average completion time
      const completionTimes = similarTasks.map((t) => {
        const duration = new Date(t.completed_at) - new Date(t.created_at);
        return duration / (1000 * 60 * 60); // Convert to hours
      });

      const average = completionTimes.reduce((a, b) => a + b) / completionTimes.length;
      const stdDev = this._calculateStdDev(completionTimes, average);

      // Adjust based on task complexity (word count as proxy)
      const complexity = (task.description || '').split(' ').length;
      const avgComplexity = similarTasks.reduce(
        (sum, t) => sum + (t.description || '').split(' ').length,
        0
      ) / similarTasks.length;

      const complexityFactor = avgComplexity > 0 ? complexity / avgComplexity : 1;

      return {
        estimatedHours: Math.round(average * complexityFactor),
        confidence: Math.min(similarTasks.length / 10, 1), // 0-1 confidence score
        range: {
          min: Math.round(average - stdDev),
          max: Math.round(average + stdDev),
        },
        samplesUsed: similarTasks.length,
      };
    } catch (error) {
      console.error('Completion time prediction error:', error);
      return null;
    }
  }

  /**
   * Predict task priority based on NLP analysis
   */
  static predictPriority(taskTitle, taskDescription, historicalTasks) {
    try {
      // Simple keyword-based priority detection
      const highPriorityKeywords = [
        'urgent', 'asap', 'critical', 'emergency', 'deadline', 'court',
        'client meeting', 'deposition', 'settlement'
      ];

      const mediumPriorityKeywords = [
        'important', 'review', 'prepare', 'draft', 'respond', 'follow-up'
      ];

      const text = `${taskTitle} ${taskDescription}`.toLowerCase();

      let score = 0;
      for (const keyword of highPriorityKeywords) {
        if (text.includes(keyword)) {
          score += 3;
        }
      }

      for (const keyword of mediumPriorityKeywords) {
        if (text.includes(keyword)) {
          score += 1;
        }
      }

      let predictedPriority = 'low';
      let confidence = 0.5;

      if (score >= 3) {
        predictedPriority = 'high';
        confidence = Math.min(score / 10, 0.95);
      } else if (score >= 1) {
        predictedPriority = 'medium';
        confidence = Math.min(score / 5, 0.8);
      }

      return {
        predictedPriority,
        confidence,
        score,
      };
    } catch (error) {
      console.error('Priority prediction error:', error);
      return null;
    }
  }

  /**
   * Identify at-risk tasks (likely to miss deadlines)
   */
  static identifyAtRiskTasks(tasks) {
    try {
      const atRiskTasks = [];
      const now = new Date();

      for (const task of tasks) {
        if (task.status === 'completed') continue;

        const dueDate = new Date(task.due_date);
        const daysUntilDue = (dueDate - now) / (1000 * 60 * 60 * 24);
        const progressPercent = task.progress || 0;

        let riskScore = 0;

        // Due date risk
        if (daysUntilDue < 1) {
          riskScore += 40; // Critical
        } else if (daysUntilDue < 3) {
          riskScore += 25; // High
        } else if (daysUntilDue < 7) {
          riskScore += 15; // Medium
        } else if (daysUntilDue < 14) {
          riskScore += 5; // Low
        }

        // Progress risk
        const expectedProgress = (
          ((now - new Date(task.created_at)) / (dueDate - new Date(task.created_at))) * 100
        );

        if (progressPercent < expectedProgress - 20) {
          riskScore += 30; // Behind schedule
        } else if (progressPercent < expectedProgress) {
          riskScore += 10; // Slightly behind
        }

        // Priority impact
        if (task.priority === 'high') {
          riskScore += 5;
        }

        if (riskScore >= 25) {
          atRiskTasks.push({
            taskId: task.id,
            title: task.title,
            riskScore: Math.min(riskScore, 100),
            riskLevel: riskScore >= 50 ? 'critical' : riskScore >= 35 ? 'high' : 'medium',
            daysUntilDue: Math.ceil(daysUntilDue),
            progressPercent: Math.round(progressPercent),
            currentProgress: progressPercent,
            recommendation: this._getAtRiskRecommendation(riskScore, task),
          });
        }
      }

      return atRiskTasks.sort((a, b) => b.riskScore - a.riskScore);
    } catch (error) {
      console.error('At-risk identification error:', error);
      return [];
    }
  }

  /**
   * Get recommendation for at-risk task
   */
  static _getAtRiskRecommendation(riskScore, task) {
    if (riskScore >= 50) {
      return 'Escalate immediately. Consider reassignment or deadline extension.';
    } else if (riskScore >= 35) {
      return 'Increase attention. Check for blockers and allocate more resources.';
    }
    return 'Monitor closely. Ensure progress continues.';
  }

  /**
   * Predict user workload and capacity
   */
  static predictUserCapacity(userId, userTasks, completionRate) {
    try {
      const activeTasks = userTasks.filter((t) => t.status !== 'completed' && t.status !== 'archived');
      const avgCompletionTime = completionRate || 5; // hours per task

      const estimatedHours = activeTasks.reduce((sum, task) => {
        return sum + (task.estimated_hours || avgCompletionTime);
      }, 0);

      const workingHoursPerWeek = 40;
      const weeksOfWork = estimatedHours / workingHoursPerWeek;

      return {
        userId,
        activeTasks: activeTasks.length,
        estimatedTotalHours: Math.round(estimatedHours),
        estimatedWeeks: Math.round(weeksOfWork * 10) / 10,
        capacityStatus: weeksOfWork > 2 ? 'overloaded' : weeksOfWork > 1 ? 'busy' : 'available',
        utilizationPercent: Math.min(Math.round((weeksOfWork / 2) * 100), 100),
      };
    } catch (error) {
      console.error('User capacity prediction error:', error);
      return null;
    }
  }

  /**
   * Anomaly detection in task patterns
   */
  static detectAnomalies(tasks, historicalAverage) {
    try {
      const anomalies = [];

      // Detect unusually long tasks
      const durations = tasks.map((t) => {
        if (!t.completed_at) return null;
        return (new Date(t.completed_at) - new Date(t.created_at)) / (1000 * 60 * 60);
      }).filter(Boolean);

      if (durations.length === 0) return anomalies;

      const avgDuration = durations.reduce((a, b) => a + b) / durations.length;
      const stdDev = this._calculateStdDev(durations, avgDuration);

      for (const task of tasks) {
        if (!task.completed_at) continue;

        const duration = (new Date(task.completed_at) - new Date(task.created_at)) / (1000 * 60 * 60);

        // Tasks taking > 2 standard deviations from mean
        if (Math.abs(duration - avgDuration) > 2 * stdDev) {
          anomalies.push({
            taskId: task.id,
            title: task.title,
            actualDuration: Math.round(duration),
            expectedDuration: Math.round(avgDuration),
            deviationPercent: Math.round(((duration - avgDuration) / avgDuration) * 100),
            anomalyType: duration > avgDuration ? 'slower_than_usual' : 'faster_than_usual',
            stdDeviations: Math.round(Math.abs(duration - avgDuration) / stdDev),
          });
        }
      }

      return anomalies;
    } catch (error) {
      console.error('Anomaly detection error:', error);
      return [];
    }
  }

  /**
   * Recommend task assignment based on user expertise
   */
  static recommendTaskAssignment(task, users, historicalAssignments) {
    try {
      const recommendations = [];

      for (const user of users) {
        let score = 0;

        // Check user's task category expertise
        const userPreviousTasks = historicalAssignments.filter(
          (a) => a.assigned_to === user.id && a.category === task.category
        );

        if (userPreviousTasks.length > 0) {
          // Calculate user's average completion rate for this category
          const completionRate = userPreviousTasks.filter(
            (t) => t.status === 'completed'
          ).length / userPreviousTasks.length;

          score += completionRate * 50;
        }

        // Check user's current workload
        const activeTasks = historicalAssignments.filter(
          (a) => a.assigned_to === user.id && a.status !== 'completed'
        );

        if (activeTasks.length < 5) {
          score += (5 - activeTasks.length) * 10;
        }

        // Check priority matching
        if (user.skillLevel && task.priority === 'high') {
          score += user.skillLevel * 15;
        }

        if (score > 0) {
          recommendations.push({
            userId: user.id,
            userName: user.name,
            score: Math.round(score),
            reasoning: this._getAssignmentReasoning(userPreviousTasks, activeTasks),
            confidence: Math.min(score / 100, 0.95),
          });
        }
      }

      return recommendations.sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('Task assignment recommendation error:', error);
      return [];
    }
  }

  /**
   * Get assignment reasoning
   */
  static _getAssignmentReasoning(previousTasks, activeTasks) {
    const reasons = [];

    if (previousTasks.length > 0) {
      reasons.push(`${previousTasks.length} previous similar tasks`);
    }

    if (activeTasks.length < 3) {
      reasons.push('Currently available');
    } else if (activeTasks.length < 5) {
      reasons.push('Moderately busy');
    } else {
      reasons.push('Already loaded');
    }

    return reasons.join('. ');
  }

  /**
   * Calculate standard deviation
   */
  static _calculateStdDev(values, mean) {
    const squareDiffs = values.map((value) => Math.pow(value - mean, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b) / squareDiffs.length;
    return Math.sqrt(avgSquareDiff);
  }

  /**
   * Generate insights summary
   */
  static generateInsightsSummary(tasks, users, assignments) {
    try {
      const insights = {
        timestamp: new Date().toISOString(),
        totalTasks: tasks.length,
        completedTasks: tasks.filter((t) => t.status === 'completed').length,
        atRiskTasks: this.identifyAtRiskTasks(tasks),
        teamCapacity: users.map((u) => this.predictUserCapacity(u.id, assignments, 5)),
        overallHealthScore: 0,
      };

      // Calculate health score (0-100)
      const completionRate = insights.completedTasks / insights.totalTasks;
      const atRiskPercent = insights.atRiskTasks.length / insights.totalTasks;
      const avgCapacityPercent = insights.teamCapacity.reduce(
        (sum, cap) => sum + cap.utilizationPercent,
        0
      ) / insights.teamCapacity.length;

      insights.overallHealthScore = Math.round(
        (completionRate * 30 + (1 - atRiskPercent) * 40 + (1 - avgCapacityPercent / 100) * 30)
      );

      return insights;
    } catch (error) {
      console.error('Insights summary error:', error);
      return null;
    }
  }
}

module.exports = MLAnalyticsService;
