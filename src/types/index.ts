export type Role = "owner" | "operator" | "accountant";

export type OrganizationProfileStatus = "active" | "suspended";

export interface OrganizationProfile {
  id: string;
  organizationId: string;
  taxIdentifier: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  status: OrganizationProfileStatus;
  createdAt: Date;
  updatedAt: Date;
}
