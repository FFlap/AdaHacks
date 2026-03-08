import {
  errorResponseSchema,
  meResponseSchema,
  notificationReadResponseSchema,
  notificationsSchema,
  peopleFeedSchema,
  projectAnalysisSchema,
  projectFeedSchema,
  swipeInputSchema,
  swipeResponseSchema,
  updateProfileInputSchema
} from '@adahacks/shared/contracts';
import { env } from './env.js';

function withBaseUrl(path) {
  return `${env.apiBaseUrl}${path}`;
}

async function request(path, { method = 'GET', token, body } = {}) {
  const response = await fetch(withBaseUrl(path), {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const fallbackMessage = 'The request could not be completed.';
    const payload = errorResponseSchema.safeParse(await response.json().catch(() => null));
    const error = new Error(payload.success ? payload.data.error.message : fallbackMessage);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export async function getMe(token) {
  const payload = await request('/api/v1/me', { token });
  return meResponseSchema.parse(payload);
}

export async function updateProfile(token, input) {
  const payload = updateProfileInputSchema.parse(input);
  const response = await request('/api/v1/me/profile', {
    method: 'PATCH',
    token,
    body: payload
  });

  return meResponseSchema.parse(response);
}

export async function getProjectsFeed(token) {
  const payload = await request('/api/v1/projects', { token });
  return projectFeedSchema.parse(payload);
}

export async function analyzeProject(token, projectId) {
  const payload = await request(`/api/v1/projects/${projectId}/analysis`, {
    method: 'POST',
    token
  });
  return projectAnalysisSchema.parse(payload);
}

export async function getPeopleFeed(token) {
  const payload = await request('/api/v1/people', { token });
  return peopleFeedSchema.parse(payload);
}

export async function createSwipe(token, input) {
  const payload = swipeInputSchema.parse(input);
  const response = await request('/api/v1/swipes', {
    method: 'POST',
    token,
    body: payload
  });

  return swipeResponseSchema.parse(response);
}

export async function getNotifications(token) {
  const payload = await request('/api/v1/notifications', { token });
  return notificationsSchema.parse(payload);
}

export async function markNotificationRead(token, notificationId) {
  const payload = await request(`/api/v1/notifications/${notificationId}/read`, {
    method: 'POST',
    token
  });
  return notificationReadResponseSchema.parse(payload);
}
