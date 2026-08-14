export type PlatformRole = "USER" | "SUPERUSER";

export type PlatformUser = {
  userId: string;
  email: string;
  platformRole: PlatformRole;
};

export type AdminTenantOverview = {
  id: string;
  name: string;
  slug: string;
  legalName: string | null;
  createdAt: Date;
  memberCount: number;
  planKey: string | null;
  planName: string | null;
  subscriptionStatus: string | null;
};

export type AdminUserOverview = {
  id: string;
  email: string;
  name: string | null;
  platformRole: PlatformRole;
  createdAt: Date;
  membershipCount: number;
};
