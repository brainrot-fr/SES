const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "ses-upload-preset";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

export class MediaValidationError extends Error {}

export function validateMediaFile(file) {
  const isImage = file?.type.startsWith("image/");
  const isVideo = file?.type.startsWith("video/");

  if (!isImage && !isVideo) {
    throw new MediaValidationError("unsupportedType");
  }
  if (isImage && file.size > MAX_IMAGE_BYTES) {
    throw new MediaValidationError("imageTooLarge");
  }
  if (isVideo && file.size > MAX_VIDEO_BYTES) {
    throw new MediaValidationError("videoTooLarge");
  }
}

export function uploadPostMedia(file, { onProgress } = {}) {
  if (!cloudName) {
    return Promise.reject(
      new Error("Cloudinary is not configured. Set VITE_CLOUDINARY_CLOUD_NAME in your .env file."),
    );
  }
  if (!file || !/^(image|video)\//.test(file.type)) {
    return Promise.reject(new MediaValidationError("unsupportedType"));
  }
  try {
    validateMediaFile(file);
  } catch (error) {
    return Promise.reject(error);
  }

  const resourceType = file.type.startsWith("video/") ? "video" : "image";
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/${resourceType}/upload`,
    );
    xhr.upload.onprogress = (event) => {
      if (onProgress && event.lengthComputable) onProgress(event.loaded / event.total);
    };
    xhr.onerror = () => reject(new Error("Network error while uploading media."));
    xhr.onload = () => {
      let result;
      try {
        result = JSON.parse(xhr.responseText);
      } catch {
        reject(new Error("Cloudinary returned an unexpected response."));
        return;
      }

      if (xhr.status < 200 || xhr.status >= 300) {
        const detail = result?.error?.message || `Cloudinary returned HTTP ${xhr.status}.`;
        if (/upload preset.*not found/i.test(detail)) {
          reject(new Error(
            `Cloudinary could not find unsigned preset "${uploadPreset}" in cloud "${cloudName}". ` +
            "Check that the cloud name and preset match the same Cloudinary environment.",
          ));
          return;
        }
        reject(new Error(`Cloudinary upload failed: ${detail}`));
        return;
      }

      if (!result.secure_url || !result.public_id) {
        reject(new Error("Cloudinary upload succeeded without returning a secure media URL."));
        return;
      }

      resolve({
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type,
        format: result.format ?? null,
        width: result.width ?? null,
        height: result.height ?? null,
        bytes: result.bytes ?? null,
      });
    };
    xhr.send(formData);
  });
}
