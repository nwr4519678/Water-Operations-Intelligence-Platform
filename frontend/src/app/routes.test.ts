import { describe, expect, it } from 'vitest';
import { viewerRoutes } from './routes';

describe('viewer route contract', () => {
    it('exposes only read-only viewer destinations', () => {
        expect(viewerRoutes).toEqual([
            '/',
            '/map',
            '/stations',
            '/alarms',
            '/reports',
            '/ai-insights',
        ]);
        expect(viewerRoutes.join(' ')).not.toMatch(/admin|maintenance|users|settings/i);
    });
});
