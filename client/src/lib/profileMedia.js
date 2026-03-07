import { supabase } from './supabase.js';

export const avatarAccept = 'image/png,image/jpeg,image/webp';
export const avatarMaxBytes = 2 * 1024 * 1024;
export const avatarBucket = 'profile-images';

const allowedMimeTypes = new Set([
  'image/png',
  'image/jpeg',
  'image/webp'
]);

export function validateAvatarFile(file) {
  if (!file) {
    return 'Choose an image to upload.';
  }

  if (!allowedMimeTypes.has(file.type)) {
    return 'Use a PNG, JPG, or WebP image.';
  }

  if (file.size > avatarMaxBytes) {
    return 'Avatar images must be 2 MB or smaller.';
  }

  return '';
}

export function buildAvatarPath(userId) {
  return `${userId}/avatar`;
}

export async function uploadAvatar({ userId, file }) {
  const validationError = validateAvatarFile(file);

  if (validationError) {
    throw new Error(validationError);
  }

  const avatarPath = buildAvatarPath(userId);
  const { error } = await supabase.storage
    .from(avatarBucket)
    .upload(avatarPath, file, {
      upsert: true,
      cacheControl: '3600',
      contentType: file.type
    });

  if (error) {
    throw new Error(error.message || 'The avatar upload failed.');
  }

  return avatarPath;
}
