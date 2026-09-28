/**
 * Project — client-side BFF wrappers.
 *
 * These run in the browser and call the BFF routes under /api/project/*.
 * The BFF attaches the caller's Bearer token and proxies to the KSS.Service.Project
 * backend. Types are re-exported from the server service modules via `import type`
 * (no server-only code is bundled into the client).
 *
 * NOTE: the list* names here intentionally shadow the read funcs in
 * @/services/project-api, but live in a different module (the browser BFF layer)
 * — that is fine and by design.
 */

import type {
  ProjectView,
  ProjectInsert,
  ProjectUpdate,
  ProjectTranslationView,
  ProjectTranslationInsert,
  ProjectTranslationUpdate,
  WorksiteView,
  WorksiteInsert,
  WorksiteUpdate,
  WorksiteTranslationView,
  WorksiteTranslationInsert,
  WorksiteTranslationUpdate,
} from '@/services/project-api';
import type { PersonDirectoryRecord } from '@/services/person-api';

export type {
  ProjectView,
  ProjectInsert,
  ProjectUpdate,
  ProjectTranslationView,
  ProjectTranslationInsert,
  ProjectTranslationUpdate,
  WorksiteView,
  WorksiteInsert,
  WorksiteUpdate,
  WorksiteTranslationView,
  WorksiteTranslationInsert,
  WorksiteTranslationUpdate,
  PersonDirectoryRecord,
};

const BASE = '/api/project';

async function http<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const parsed = await res.json();
      if (parsed?.message) message = String(parsed.message);
    } catch {
      /* keep default */
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

// ── Projects ──
export const listProjects = () => http<ProjectView[]>('GET', '/projects');
export const createProject = (dto: ProjectInsert) => http<ProjectView>('POST', '/projects', dto);
export const updateProject = (dto: ProjectUpdate) => http<ProjectView>('PUT', '/projects', dto);
export const removeProject = (entity: ProjectView | { id: string }) =>
  http<void>('DELETE', '/projects', entity);

// ── Project translations ──
export const listProjectTranslations = () =>
  http<ProjectTranslationView[]>('GET', '/project-translations');
export const createProjectTranslation = (dto: ProjectTranslationInsert) =>
  http<ProjectTranslationView>('POST', '/project-translations', dto);
export const updateProjectTranslation = (dto: ProjectTranslationUpdate) =>
  http<ProjectTranslationView>('PUT', '/project-translations', dto);
export const removeProjectTranslation = (
  entity: ProjectTranslationView | { projectId: string; languageId: number },
) => http<void>('DELETE', '/project-translations', entity);

// ── Worksites ──
export const listWorksites = () => http<WorksiteView[]>('GET', '/worksites');
export const createWorksite = (dto: WorksiteInsert) => http<WorksiteView>('POST', '/worksites', dto);
export const updateWorksite = (dto: WorksiteUpdate) => http<WorksiteView>('PUT', '/worksites', dto);
export const removeWorksite = (entity: WorksiteView | { id: string }) =>
  http<void>('DELETE', '/worksites', entity);

// ── Worksite translations ──
export const listWorksiteTranslations = () =>
  http<WorksiteTranslationView[]>('GET', '/worksite-translations');
export const createWorksiteTranslation = (dto: WorksiteTranslationInsert) =>
  http<WorksiteTranslationView>('POST', '/worksite-translations', dto);
export const updateWorksiteTranslation = (dto: WorksiteTranslationUpdate) =>
  http<WorksiteTranslationView>('PUT', '/worksite-translations', dto);
export const removeWorksiteTranslation = (
  entity: WorksiteTranslationView | { worksiteId: string; languageId: number },
) => http<void>('DELETE', '/worksite-translations', entity);

// ── Person picker ──
export const listPersons = (query?: string) =>
  http<PersonDirectoryRecord[]>(
    'GET',
    query ? `/persons?query=${encodeURIComponent(query)}` : '/persons',
  );
