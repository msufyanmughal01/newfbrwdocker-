import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/organization/access";

// Extend the default statements to include a "read" action for member and
// invitation resources.  The built-in defaultStatements only ships with
// mutating actions (create / update / delete / cancel).
const statement = {
  ...defaultStatements,
  member:     [...(defaultStatements.member     ?? []), "read"] as const,
  invitation: [...(defaultStatements.invitation ?? []), "read"] as const,
} as const;

export const ac = createAccessControl(statement);

export const owner = ac.newRole({
  organization: ["update"],
  member:       ["create", "update", "delete", "read"],
  invitation:   ["create", "cancel", "read"],
});

// Operator: can view/invite members but cannot manage the organization itself
// or remove existing members.
export const operator = ac.newRole({
  organization: [],
  member:       ["read"],
  invitation:   ["create"],
});

// Accountant: read-only access — can view member list, no write capabilities.
export const accountant = ac.newRole({
  organization: [],
  member:       ["read"],
  invitation:   [],
});
