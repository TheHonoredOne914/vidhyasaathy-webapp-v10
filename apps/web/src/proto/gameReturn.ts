export function planReturn(params: URLSearchParams): string | null {
  const path = params.get('returnTo') ?? '';
  const step = params.get('step') ?? '';
  if (!/^\/student\/learning\/sessions\/[a-zA-Z0-9_-]+$/.test(path) || !/^\d+$/.test(step)) return null;
  return `${path}?step=${step}`;
}

export function planGameRoute(route: string, sessionId: string, step: number, moduleId: string, activityId: string) {
  const url = new URL(route, 'https://notebook.invalid');
  url.searchParams.set('returnTo', `/student/learning/sessions/${encodeURIComponent(sessionId)}`);
  url.searchParams.set('step', String(step));
  url.searchParams.set('moduleId', moduleId);
  url.searchParams.set('activityId', activityId);
  return `${url.pathname}${url.search}`;
}
