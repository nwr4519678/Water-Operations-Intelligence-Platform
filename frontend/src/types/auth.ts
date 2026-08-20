export type Role = 'viewer' | 'admin' | 'operator';

export type Capability =
  'overview.read' | 'stations.read' | 'alarms.read' | 'reports.read' | 'insights.read';

export type Session = {
  userId: string;
  displayName: string;
  role: Role;
  locale: 'en' | 'ar';
  expiresAt: string;
};

export type PermissionDecision = {
  allowed: boolean;
  reason?: 'missing-session' | 'missing-capability';
};
