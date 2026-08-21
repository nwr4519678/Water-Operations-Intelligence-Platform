import type { Capability, PermissionDecision, Role, Session } from '../types/auth';

const roleCapabilities: Record<Role, readonly Capability[]> = {
  viewer: ['overview.read', 'stations.read', 'alarms.read', 'reports.read', 'insights.read'],
  admin: ['overview.read', 'stations.read', 'alarms.read', 'reports.read', 'insights.read'],
  operator: ['overview.read', 'stations.read', 'alarms.read', 'reports.read', 'insights.read'],
};

export function can(session: Session | null, capability: Capability): PermissionDecision {
  if (!session) return { allowed: false, reason: 'missing-session' };
  return roleCapabilities[session.role].includes(capability)
    ? { allowed: true }
    : { allowed: false, reason: 'missing-capability' };
}
