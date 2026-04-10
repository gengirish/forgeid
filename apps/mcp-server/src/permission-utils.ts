/**
 * Mirrors ForgeID API capability matching for client-side subset checks and "cannot do" hints.
 */
export function capabilityAllowsAction(granted: string[], action: string): boolean {
  if (granted.includes("*")) return true;
  if (granted.includes(action)) return true;
  const [resource, ...rest] = action.split(":");
  if (rest.length && granted.includes(`${resource}:*`)) return true;
  return false;
}

/** High-sensitivity patterns shown as denied when not covered by grants (UX hint, not exhaustive). */
const DEFAULT_SENSITIVE_PATTERNS = [
  "billing:*",
  "members:delete",
  "admin:*",
  "api-keys:*",
  "webhooks:*",
  "roles:*",
];

export function computeCannotDoHints(granted: string[]): string[] {
  return DEFAULT_SENSITIVE_PATTERNS.filter((p) => !capabilityAllowsAction(granted, p));
}

export function assertCapabilitiesSubset(requested: string[], parentGrants: string[]): string | null {
  for (const cap of requested) {
    if (!capabilityAllowsAction(parentGrants, cap)) {
      return `Capability "${cap}" is not included in your effective permissions.`;
    }
  }
  return null;
}
