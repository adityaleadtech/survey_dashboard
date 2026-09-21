const API_URL = "https://jansetu.leadtech.in/api/v1";
const CLIENT_ID = "0a9d7f2c-cc88-4173-b274-69239dc2a417";
const ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkN2RjYmQ1NS1iMDQ1LTQ2M2YtYjAwMy0xMjEwYzkzZDdhMTAiLCJlbWFpbCI6ImFkbWluQGdtYWlsLmNvbSIsInVzZXJfdHlwZSI6IlBMQVRGT1JNX0FETUlOIiwiY2xpZW50X2lkIjpudWxsLCJleHAiOjE3ODk3OTQzOTh9.mdwwQBDZTsvQLQG5SMlI5W_X3qZ0DGOd9ZRUmt9-e_Q"

export async function api<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is not configured");

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    cache: "no-store",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      ...(ACCESS_TOKEN ? { Authorization: `Bearer ${ACCESS_TOKEN}` } : {}),
      ...(CLIENT_ID ? { "X-Client-ID": CLIENT_ID } : {}),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      message = body?.detail || body?.message || message;
    } catch {}
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export const endpoints = {
  projects: "/projects/",
  project: (id: string) => `/projects/${id}`,
  projectSurveys: (id: string) => `/projects/${id}/surveys`,
  addSurveyToProject: (id: string) => `/projects/${id}/surveys`,
  bulkAddSurveys: (id: string) => `/projects/${id}/surveys/bulk`,
  removeProjectSurvey: (projectId: string, projectSurveyId: string) =>
    `/projects/${projectId}/surveys/${projectSurveyId}`,
  updateProjectSurvey: (projectId: string, projectSurveyId: string) =>
    `/projects/${projectId}/surveys/${projectSurveyId}`,
  surveys: "/surveys/",
  survey: (id: string) => `/surveys/${id}`,
  surveyResponses: (id: string) => `/surveys/${id}/responses`,
  response: (id: string) => `/surveys/responses/${id}`,
  surveyStatistics: (id: string) => `/surveys/${id}/statistics`,
  submitSurvey: (id: string) => `/surveys/${id}/submit`,
  validateSurvey: (id: string) => `/surveys/${id}/validate`,
};