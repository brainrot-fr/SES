const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "ses-upload-preset";

export async function uploadPostMedia(file) {
  if (!cloudName) {
    throw new Error("Cloudinary is not configured. Set VITE_CLOUDINARY_CLOUD_NAME in your .env file.");
  }
  if (!(file instanceof File) || !/^(image|video)\//.test(file.type)) {
    throw new Error("Choose an image or video file to upload.");
  }

  const resourceType = file.type.startsWith("video/") ? "video" : "image";
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/${resourceType}/upload`,
    { method: "POST", body: formData },
  );
  const result = await response.json();

  if (!response.ok) {
    const detail = result?.error?.message || `Cloudinary returned HTTP ${response.status}.`;
    if (/upload preset.*not found/i.test(detail)) {
      throw new Error(
        `Cloudinary could not find unsigned preset "${uploadPreset}" in cloud "${cloudName}". ` +
        "Check that the cloud name is correct and that this exact preset exists in that Cloudinary environment.",
      );
    }
    throw new Error(`Cloudinary upload failed: ${detail}`);
  }

  if (!result.secure_url || !result.public_id) {
    throw new Error("Cloudinary upload succeeded without returning a secure media URL.");
  }

  return {
    url: result.secure_url,
    publicId: result.public_id,
    resourceType: result.resource_type,
  };
}
