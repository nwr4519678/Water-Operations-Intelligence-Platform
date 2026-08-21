import type { Session } from '../../types/auth';

export const viewerSession: Session = {
  userId: 'viewer-demo',
  displayName: 'Viewer Demo',
  role: 'viewer',
  locale: 'en',
  expiresAt: '2099-01-01T00:00:00.000Z',
};

export const expiredSession: Session = {
  ...viewerSession,
  expiresAt: '2020-01-01T00:00:00.000Z',
};
