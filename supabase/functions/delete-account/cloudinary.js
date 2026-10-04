const CLOUDINARY_HOST = "res.cloudinary.com";

export function getCloudinaryAssetFromUrl(url, cloudName) {
  if (!url || !cloudName) return null;

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:" || parsed.hostname !== CLOUDINARY_HOST) return null;

  const segments = parsed.pathname.split("/").filter(Boolean);
  if (segments[0] !== cloudName) return null;

  const resourceIndex = segments.findIndex((segment) =>
    ["image", "video", "raw"].includes(segment)
  );
  if (resourceIndex < 1 || segments[resourceIndex + 1] !== "upload") return null;

  let publicIdSegments = segments.slice(resourceIndex + 2);
  const versionIndex = publicIdSegments.findIndex((segment) => /^v\d+$/.test(segment));
  if (versionIndex >= 0) {
    publicIdSegments = publicIdSegments.slice(versionIndex + 1);
  } else if (publicIdSegments[0]?.includes(",")) {
    publicIdSegments = publicIdSegments.slice(1);
  }
  if (!publicIdSegments.length) return null;

  try {
    publicIdSegments = publicIdSegments.map((segment) => decodeURIComponent(segment));
  } catch {
    return null;
  }

  const lastSegment = publicIdSegments.at(-1);
  if (segments[resourceIndex] !== "raw") {
    publicIdSegments[publicIdSegments.length - 1] = lastSegment.replace(/\.[^.]+$/, "");
  }

  const publicId = publicIdSegments.join("/");
  return publicId
    ? { publicId, resourceType: segments[resourceIndex] }
    : null;
}

async function signDestroyParameters(publicId, timestamp, apiSecret) {
  const signatureInput = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const digest = await crypto.subtle.digest(
    "SHA-1",
    new TextEncoder().encode(signatureInput),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function destroyCloudinaryAsset(
  asset,
  { cloudName, apiKey, apiSecret },
  fetchImpl = fetch,
) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = await signDestroyParameters(asset.publicId, timestamp, apiSecret);
  const form = new URLSearchParams({
    public_id: asset.publicId,
    api_key: apiKey,
    timestamp: String(timestamp),
    signature,
  });
  const response = await fetchImpl(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/${asset.resourceType}/destroy`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    },
  );

  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error(`Cloudinary returned an invalid response (HTTP ${response.status}).`);
  }
  if (!response.ok || !["ok", "not found"].includes(result.result)) {
    throw new Error(result.error?.message || `Cloudinary returned HTTP ${response.status}.`);
  }
}
