import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/organization/access";

const statement = {
  ...defaultStatements,
} as const;

export const ac = createAccessControl(statement);

export const owner = ac.newRole({
  organization: ["update"],
  member: ["create", "update", "delete"],
  invitation: ["create", "cancel"],
});

export const operator = ac.newRole({
  organization: [],
  member: [],
  invitation: [],
});

export const accountant = ac.newRole({
  organization: [],
  member: [],
  invitation: [],
});
