export const viewerRoutes = Object.freeze([
    '/',
    '/map',
    '/stations',
    '/alarms',
    '/reports',
    '/ai-insights',
] as const);

export type ViewerRoute = (typeof viewerRoutes)[number];
