const BASE_SENTIMENTS = ["positive", "neutral", "negative"];

const ACTION_WEIGHTS = {
  like: { topic: 2.2, sentiment: 1.8, intensity: 1.4 },
  share: { topic: 2.8, sentiment: 2.1, intensity: 2 },
  comment: { topic: 1.6, sentiment: 1.2, intensity: 0.9 },
  skip: { topic: -1.6, sentiment: -1.3, intensity: -1 },
  scroll: { topic: -0.6, sentiment: -0.4, intensity: -0.3 }
};

const TOPIC_COLORS = {
  politics: "#5A7BFF",
  ecology: "#34D399",
  technology: "#38BDF8",
  culture: "#F97316",
  health: "#F472B6",
  society: "#A855F7"
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const clonePreferences = (preferences) => ({
  topics: { ...preferences.topics },
  sentiments: { ...preferences.sentiments },
  intensityBias: preferences.intensityBias,
  actionCount: { ...preferences.actionCount }
});

export const emptyPreferences = () => ({
  topics: {},
  sentiments: BASE_SENTIMENTS.reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {}),
  intensityBias: 0,
  actionCount: {
    like: 0,
    share: 0,
    comment: 0,
    skip: 0,
    scroll: 0
  }
});

export function applyInteraction(preferences, action, post) {
  const weights = ACTION_WEIGHTS[action] ?? ACTION_WEIGHTS.skip;
  const next = clonePreferences(preferences);

  next.topics[post.topic] = clamp((next.topics[post.topic] ?? 0) + weights.topic, -8, 22);

  next.sentiments[post.sentiment] = clamp(
    (next.sentiments[post.sentiment] ?? 0) + weights.sentiment,
    -14,
    18
  );

  next.intensityBias = clamp(
    next.intensityBias + (post.intensity - 0.5) * weights.intensity,
    -1.5,
    1.5
  );

  if (next.actionCount[action] !== undefined) {
    next.actionCount[action] += 1;
  }

  return next;
}

const scorePost = ({ post, preferences }) => {
  const topicScore = preferences.topics[post.topic] ?? 0;
  const sentimentScore = preferences.sentiments[post.sentiment] ?? 0;
  const intensityDrift = preferences.intensityBias * (post.intensity - 0.5) * 1.8;
  return topicScore * 1.5 + sentimentScore * 1.2 + post.intensity * 0.9 + intensityDrift;
};

const scoreForDiversity = ({ post, preferences }) => {
  const topicScore = preferences.topics[post.topic] ?? 0;
  const sentimentScore = preferences.sentiments[post.sentiment] ?? 0;
  return -(topicScore + sentimentScore) + (1 - post.intensity) * 0.4 + Math.random() * 0.4;
};

export function generatePersonalizedFeed({
  posts,
  preferences,
  seenPostIds,
  feedSize,
  diversityRatio,
  round,
  transparentMode = false
}) {
  if (!Array.isArray(posts) || !posts.length) {
    return [];
  }

  const candidatePool = transparentMode
    ? [...posts]
    : posts.filter((post) => !seenPostIds.has(post.id));

  if (!candidatePool.length) {
    return [];
  }

  const diversifiedCount = clamp(Math.round(feedSize * diversityRatio), 0, feedSize);
  const focusedCount = clamp(feedSize - diversifiedCount, 0, feedSize);

  const scored = candidatePool
    .map((post) => ({
      post,
      score: scorePost({ post, preferences }) + Math.random() * 0.3
    }))
    .sort((a, b) => b.score - a.score);

  const focused = scored.slice(0, focusedCount).map((entry) => entry.post);

  const diversityCandidates = candidatePool
    .filter((post) => !focused.some((item) => item.id === post.id))
    .map((post) => ({ post, score: scoreForDiversity({ post, preferences }) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, diversifiedCount)
    .map((entry) => entry.post);

  const combined = [...focused, ...diversityCandidates];

  if (combined.length < feedSize) {
    const fallbackPool = candidatePool.filter((item) => !combined.some((c) => c.id === item.id));
    for (const fallback of fallbackPool) {
      if (combined.length >= feedSize) {
        break;
      }
      combined.push(fallback);
    }
  }

  const shuffled = combined
    .map((post) => ({
      post,
      order: Math.random() + (round > 2 ? scorePost({ post, preferences }) * 0.01 : 0)
    }))
    .sort((a, b) => a.order - b.order)
    .map((entry) => entry.post);

  return shuffled.slice(0, feedSize);
}

const calculateTopicDistribution = (exposureLedger) => {
  const total = Object.values(exposureLedger).reduce((sum, value) => sum + value, 0);
  if (!total) {
    return {};
  }
  const distribution = {};
  Object.entries(exposureLedger).forEach(([topic, value]) => {
    distribution[topic] = Math.round((value / total) * 100);
  });
  return distribution;
};

const buildPreferenceHighlights = (preferences) => {
  return Object.entries(preferences.topics)
    .map(([topic, score]) => ({
      topic,
      score: Math.round(score * 10) / 10,
      color: TOPIC_COLORS[topic] || "#94A3B8"
    }))
    .filter((item) => Math.abs(item.score) > 0.2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
};

const computeSentimentMix = (preferences) => {
  const totals = BASE_SENTIMENTS.reduce((acc, key) => acc + Math.abs(preferences.sentiments[key] ?? 0), 0);
  if (!totals) {
    return {
      positive: "0%",
      neutral: "0%",
      negative: "0%"
    };
  }
  const mix = {};
  BASE_SENTIMENTS.forEach((key) => {
    mix[key] = `${Math.round((Math.abs(preferences.sentiments[key] ?? 0) / totals) * 100)}%`;
  });
  return mix;
};

export function buildAnalysisSnapshot({
  feed,
  allTopics,
  seenTopics,
  exposureLedger,
  round,
  interactionCount,
  preferences
}) {
  const topicDistribution = calculateTopicDistribution(exposureLedger);
  const hiddenTopics = allTopics.filter((topic) => !seenTopics.includes(topic));
  const narrowing = allTopics.length ? Math.round((hiddenTopics.length / allTopics.length) * 100) : 0;
  const diversity = Math.max(0, Math.min(100, 100 - narrowing));

  return {
    round,
    interactionCount,
    topicDistribution,
    hiddenTopics,
    narrowing,
    diversityPercentage: diversity,
    personalizationPercentage: Math.max(0, Math.min(100, narrowing)),
    preferenceHighlights: buildPreferenceHighlights(preferences),
    sentimentMix: computeSentimentMix(preferences),
    feedPreview: feed.map((post) => post.id)
  };
}

const sentimentLean = (preferences) => {
  const entries = BASE_SENTIMENTS.map((key) => ({ key, value: preferences.sentiments[key] ?? 0 }));
  const sorted = entries.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  const dominant = sorted[0];
  if (!dominant || Math.abs(dominant.value) < 0.4) {
    return null;
  }
  return {
    key: dominant.key,
    label: dominant.key === "positive" ? "optimistický" : dominant.key === "negative" ? "kritický" : "vyrovnaný"
  };
};

export function buildSummary({
  preferences,
  allTopics,
  seenTopics,
  interactionLog,
  exposureLedger,
  sentimentExposure = {}
}) {
  const hiddenTopics = allTopics.filter((topic) => !seenTopics.includes(topic));
  const narrowing = allTopics.length ? Math.round((hiddenTopics.length / allTopics.length) * 100) : 0;
  const diversity = Math.max(0, Math.min(100, 100 - narrowing));
  const lean = sentimentLean(preferences);
  const topicEntries = Object.entries(preferences.topics);
  const preferenceBreakdown = topicEntries
    .map(([topic, value]) => ({
      topic,
      score: Math.round(value * 10) / 10
    }))
    .sort((a, b) => Math.abs(b.score) - Math.abs(a.score));

  const rawScores = topicEntries.map(([, value]) => value);
  const minScore = rawScores.length ? Math.min(...rawScores) : -1;
  const maxScore = rawScores.length ? Math.max(...rawScores) : 1;

  const likesByTopic = interactionLog
    .filter((entry) => entry.action === "like")
    .reduce((acc, entry) => {
      acc[entry.topic] = (acc[entry.topic] ?? 0) + 1;
      return acc;
    }, {});

  const likesList = Object.entries(likesByTopic)
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count);

  const totalSentimentExposure = Object.values(sentimentExposure).reduce((sum, value) => sum + value, 0);
  const positiveExposure = sentimentExposure.positive ?? 0;
  const negativeExposure = sentimentExposure.negative ?? 0;
  const neutralExposure = sentimentExposure.neutral ?? 0;
  const posNegTotal = positiveExposure + negativeExposure;

  const sentimentAxis = {
    positive: {
      count: positiveExposure,
      percentage: posNegTotal ? Math.round((positiveExposure / posNegTotal) * 100) : 0
    },
    negative: {
      count: negativeExposure,
      percentage: posNegTotal ? Math.round((negativeExposure / posNegTotal) * 100) : 0
    },
    neutral: {
      count: neutralExposure,
      percentage: totalSentimentExposure
        ? Math.round((neutralExposure / totalSentimentExposure) * 100)
        : 0
    }
  };

  const sentimentBreakdown = BASE_SENTIMENTS.map((key) => ({
    key,
    label:
      key === "positive" ? "Pozitívne" : key === "negative" ? "Negatívne" : "Neutrálne",
    count: sentimentExposure[key] ?? 0,
    percentage: totalSentimentExposure
      ? Math.round(((sentimentExposure[key] ?? 0) / totalSentimentExposure) * 100)
      : 0
  }));

  return {
    narrowing,
    diversityPercentage: diversity,
    personalizationPercentage: Math.max(0, Math.min(100, narrowing)),
    lostTopics: hiddenTopics,
    preferenceBreakdown,
    sentimentLean: lean,
    totalInteractions: interactionLog.length,
    exposureLedger,
    likesByTopic: likesList,
    sentimentAxis,
    sentimentBreakdown,
    preferenceRange: {
      min: Math.round(minScore * 10) / 10,
      max: Math.round(maxScore * 10) / 10
    }
  };
}
