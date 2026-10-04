const TOPIC_KEYWORDS = {
  quran: ["quran", "qur'an", "surah", "ayah", "recitation", "tajweed", "قرآن", "سورہ", "آیت"],
  learning: ["learn", "lesson", "knowledge", "study", "reflection", "hadith", "fiqh", "علم", "حدیث"],
  worship: ["prayer", "salah", "dua", "dhikr", "ramadan", "fasting", "نماز", "دعا", "ذکر", "رمضان"],
  community: ["community", "family", "volunteer", "masjid", "mosque", "charity", "خدمت", "مسجد"],
  history: ["history", "seerah", "sirah", "heritage", "imam", "اسلامی تاریخ"],
};

export const REEL_TAGS = [
  { topic: "quran", slug: "Quran", label: "reelsTagQuran" },
  { topic: "learning", slug: "Learning", label: "reelsTagLearning" },
  { topic: "worship", slug: "Worship", label: "reelsTagWorship" },
  { topic: "community", slug: "Community", label: "reelsTagCommunity" },
  { topic: "history", slug: "History", label: "reelsTagHistory" },
];

const TAG_TOPICS = new Map(REEL_TAGS.map(({ topic, slug }) => [slug.toLowerCase(), topic]));
export const REEL_PREFERENCES_KEY = "ses-reel-topics-v1";

export function hasMoreForPage(rowCount, pageSize) {
  return rowCount === pageSize;
}

export function orderPostsByRankedIds(posts, rankedIds) {
  if (
    !Array.isArray(rankedIds)
    || rankedIds.length !== posts.length
    || new Set(rankedIds).size !== posts.length
    || posts.some((post) => !rankedIds.includes(post.id))
  ) {
    return null;
  }

  const postsById = new Map(posts.map((post) => [post.id, post]));
  return rankedIds.map((id) => postsById.get(id));
}

export function getReelPosterUrl(post, width = 540, blurred = false) {
  const url = post?.media_url;
  if (url?.includes("/video/upload/")) {
    const blurTransform = blurred ? ",e_blur:1000" : "";
    return url
      .replace(
        "/video/upload/",
        `/video/upload/so_0,f_jpg,q_auto,w_${width}${blurTransform}/`,
      )
      .replace(/\.[a-z0-9]+$/i, ".jpg");
  }
  return width === 540 && !blurred
    ? post?.poster_url || post?.thumbnail_url || ""
    : "";
}

export function splitCaption(body = "") {
  const hashtags = body.match(/#[\p{L}\p{N}_-]+/gu) || [];
  const caption = body
    .replace(/#[\p{L}\p{N}_-]+/gu, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { caption, hashtags };
}

export function getReelTags(text = "") {
  const tags = text.match(/#[a-z0-9_-]+/gi) || [];
  return [...new Set(tags.map((tag) => TAG_TOPICS.get(tag.slice(1).toLowerCase())).filter(Boolean))];
}

export function getReelTopics(text = "") {
  const normalized = text.toLocaleLowerCase();
  const taggedTopics = getReelTags(text);
  const inferredTopics = Object.entries(TOPIC_KEYWORDS)
    .filter(([, keywords]) => keywords.some((keyword) => normalized.includes(keyword)))
    .map(([topic]) => topic);
  return [...new Set([...taggedTopics, ...inferredTopics])];
}

export function readReelPreferences(userId) {
  if (!userId || typeof localStorage === "undefined") return {};
  try {
    const saved = JSON.parse(localStorage.getItem(`${REEL_PREFERENCES_KEY}:${userId}`) || "{}");
    return saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
  } catch {
    return {};
  }
}

export function recordReelPreference(userId, text, delta) {
  if (!userId || typeof localStorage === "undefined") return;
  try {
    const key = `${REEL_PREFERENCES_KEY}:${userId}`;
    const preferences = readReelPreferences(userId);
    for (const topic of getReelTopics(text)) {
      preferences[topic] = Math.max(0, Math.min(12, (Number(preferences[topic]) || 0) + delta));
    }
    localStorage.setItem(key, JSON.stringify(preferences));
  } catch (error) {
    console.warn("[Reels] could not store local topic preferences", error);
  }
}

function scoreReel(post, preferences, now) {
  const hoursOld = Math.max(0, (now - new Date(post.created_at).getTime()) / 3_600_000);
  const freshness = Math.exp(-hoursOld / (24 * 4));
  const topics = getReelTopics(`${post.body || ""} ${post.author_display_name || ""}`);
  const interest = topics.reduce((total, topic) => total + Math.min(1, (Number(preferences[topic]) || 0) / 6), 0);
  const taggedTopics = getReelTags(post.body || "");
  const tagInterest = taggedTopics.length
    ? taggedTopics.reduce((total, topic) => total + Math.min(1, (Number(preferences[topic]) || 0) / 6), 0) / taggedTopics.length
    : 0;
  const interestScore = taggedTopics.length
    ? Math.min(1, interest / 2) * 0.65 + tagInterest * 0.35
    : Math.min(1, interest / 2);
  const engagement = Math.log1p((post.like_count || 0) + (post.comment_count || 0) * 1.5);
  const exploration = Math.max(0, 1 - Math.log1p(post.like_count || 0) / 5);

  return {
    ...post,
    _topics: topics,
    _rankScore:
      freshness * 0.3 +
      interestScore * 0.27 +
      Math.min(1, engagement / 6) * 0.14 +
      exploration * 0.12,
  };
}

export function rankReels(posts, preferences = {}, now = Date.now()) {
  const remaining = posts.map((post) => scoreReel(post, preferences, now));
  const ranked = [];
  const creatorCounts = new Map();
  const topicCounts = new Map();

  while (remaining.length) {
    let bestIndex = 0;
    let bestScore = -Infinity;

    remaining.forEach((post, index) => {
      const creatorPenalty = (creatorCounts.get(post.author_id) || 0) * 0.15;
      const topicPenalty = post._topics.reduce(
        (total, topic) => total + (topicCounts.get(topic) || 0) * 0.035,
        0,
      );
      const diversifiedScore = post._rankScore - creatorPenalty - topicPenalty;
      if (diversifiedScore > bestScore) {
        bestIndex = index;
        bestScore = diversifiedScore;
      }
    });

    const [next] = remaining.splice(bestIndex, 1);
    const { _topics, _rankScore, ...post } = next;
    ranked.push(post);
    creatorCounts.set(next.author_id, (creatorCounts.get(next.author_id) || 0) + 1);
    for (const topic of _topics) topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
  }

  return ranked;
}
