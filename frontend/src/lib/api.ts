import { Form, Response, FormStats } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(errorData.detail || `HTTP Error ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Forms CRUD
  getForms: () => fetcher<Form[]>('/forms'),
  getForm: (id: string) => fetcher<Form>(`/forms/${id}`),
  createForm: (data: Partial<Form>) => fetcher<Form>('/forms', { method: 'POST', body: JSON.stringify(data) }),
  updateForm: (id: string, data: Partial<Form>) => fetcher<Form>(`/forms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteForm: (id: string) => fetcher<{ message: string }>(`/forms/${id}`, { method: 'DELETE' }),
  duplicateForm: (id: string) => fetcher<Form>(`/forms/${id}/duplicate`, { method: 'POST' }),

  // Public Respondent API
  getPublicForm: (slug: string) => fetcher<Form>(`/public/forms/${slug}`),
  submitPublicResponse: (slug: string, answers: Record<string, any>) =>
    fetcher<Response>(`/public/forms/${slug}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    }),

  // Results & Analytics
  getFormResponses: (formId: string) => fetcher<Response[]>(`/forms/${formId}/responses`),
  getFormStats: (formId: string) => fetcher<FormStats>(`/forms/${formId}/stats`),
  getExportCsvUrl: (formId: string) => `${API_BASE_URL}/forms/${formId}/export/csv`,
};
