import test from "node:test";
import assert from "node:assert/strict";
import { destroyCloudinaryAsset, getCloudinaryAssetFromUrl } from "./cloudinary.js";

test("extracts image public IDs from Cloudinary URLs", () => {
  assert.deepEqual(
    getCloudinaryAssetFromUrl(
      "https://res.cloudinary.com/ses/image/upload/v1730000000/profiles/user/avatar.webp",
      "ses",
    ),
    { publicId: "profiles/user/avatar", resourceType: "image" },
  );
});

test("extracts public IDs after transformations and versions", () => {
  assert.deepEqual(
    getCloudinaryAssetFromUrl(
      "https://res.cloudinary.com/ses/video/upload/c_fill,w_80/v1730000000/posts/reel.mp4",
      "ses",
    ),
    { publicId: "posts/reel", resourceType: "video" },
  );
});

test("ignores non-Cloudinary URLs and URLs from another cloud", () => {
  assert.equal(getCloudinaryAssetFromUrl("https://example.com/avatar.jpg", "ses"), null);
  assert.equal(
    getCloudinaryAssetFromUrl("https://res.cloudinary.com/other/image/upload/a.jpg", "ses"),
    null,
  );
});

test("accepts already-removed assets for safe retries", async () => {
  let request;
  await destroyCloudinaryAsset(
    { publicId: "posts/reel", resourceType: "video" },
    { cloudName: "ses", apiKey: "key", apiSecret: "secret" },
    async (url, options) => {
      request = { url, options };
      return Response.json({ result: "not found" });
    },
  );

  assert.equal(request.url, "https://api.cloudinary.com/v1_1/ses/video/destroy");
  assert.equal(request.options.method, "POST");
  assert.equal(
    new URLSearchParams(request.options.body).get("public_id"),
    "posts/reel",
  );
  assert.equal(new URLSearchParams(request.options.body).get("api_key"), "key");
});
