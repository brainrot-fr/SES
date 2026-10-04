import assert from "node:assert/strict";
import test from "node:test";
import {
  readSocialFeedCache,
  writeSocialFeedCache,
} from "./socialFeedCache.js";

function createStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

test("offline social cache is versioned and isolated by user and gender", () => {
  const storage = createStorage();
  const posts = [{ id: "post-1" }];
  assert.equal(writeSocialFeedCache("user-1", "posts", "girl", posts, storage), true);
  assert.deepEqual(readSocialFeedCache("user-1", "posts", "girl", storage), posts);
  assert.equal(readSocialFeedCache("user-1", "posts", "boy", storage), null);
  assert.equal(readSocialFeedCache("user-2", "posts", "girl", storage), null);
  assert.equal(readSocialFeedCache("user-1", "posts", null, storage), null);
});
