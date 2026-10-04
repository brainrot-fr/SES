import assert from "node:assert/strict";
import test from "node:test";
import {
  getReelPosterUrl,
  hasMoreForPage,
  orderPostsByRankedIds,
  rankReels,
  splitCaption,
} from "./reelRanking.js";

test("hasMore uses the raw page row count", () => {
  assert.equal(hasMoreForPage(20, 20), true);
  assert.equal(hasMoreForPage(19, 20), false);
  assert.equal(hasMoreForPage(21, 20), false);
});

test("orderPostsByRankedIds follows a complete server order and rejects incomplete results", () => {
  const posts = [{ id: "a" }, { id: "b" }];
  assert.deepEqual(orderPostsByRankedIds(posts, ["b", "a"]), [{ id: "b" }, { id: "a" }]);
  assert.equal(orderPostsByRankedIds(posts, ["b"]), null);
  assert.equal(orderPostsByRankedIds(posts, ["b", "b"]), null);
});

test("rankReels deterministically diversifies creators and topics", () => {
  const posts = [
    { id: "a1", author_id: "a", body: "Quran lesson", created_at: "2026-10-01T00:00:00Z", like_count: 4 },
    { id: "a2", author_id: "a", body: "Quran reflection", created_at: "2026-10-01T00:00:00Z", like_count: 4 },
    { id: "b1", author_id: "b", body: "Community volunteer", created_at: "2026-10-01T00:00:00Z", like_count: 4 },
  ];
  const first = rankReels(posts, {}, Date.parse("2026-10-02T00:00:00Z"));
  const second = rankReels(posts, {}, Date.parse("2026-10-02T00:00:00Z"));

  assert.deepEqual(first.map(({ id }) => id), second.map(({ id }) => id));
  assert.equal(first[0].author_id, "a");
  assert.equal(first[1].author_id, "b");
});

test("getReelPosterUrl builds a Cloudinary poster and falls back to thumbnails", () => {
  const post = { media_url: "https://res.cloudinary.com/demo/video/upload/v1/clip.mp4" };
  assert.equal(
    getReelPosterUrl(post),
    "https://res.cloudinary.com/demo/video/upload/so_0,f_jpg,q_auto,w_540/v1/clip.jpg",
  );
  assert.equal(getReelPosterUrl({ thumbnail_url: "poster.jpg" }), "poster.jpg");
  assert.equal(getReelPosterUrl(null), "");
});

test("splitCaption exports caption text and hashtags", () => {
  assert.deepEqual(splitCaption("A useful thought #Quran\nfor today #علم"), {
    caption: "A useful thought\nfor today",
    hashtags: ["#Quran", "#علم"],
  });
});