import type { ContractStatus, ContractType } from "./clients.api";
import { request } from "./http";

export type ExpirationState = "OK" | "SOON" | "EXPIRED" | "MISSING";
export type ExpiringItemType =
  | "OFFER"
  | "CONTRACT"
  | "FORWARDING_ORDER"
  | "COMARCH_ZS"
  | "COMARCH_OFFER";

export type ExpiringItem = {
  id: string;
  itemType: ExpiringItemType;
  entityId: number;
  clientId: number;
  clientName: string;
  title: string;
  dueAt: string | null;
  daysUntil: number | null;
  state: ExpirationState;
  status: string | null;
  contractType: ContractType | null;
  owner: { id: number; fullName: string; email: string } | null;
};

export type ExpiringItemsFilters = {
  warningDays?: number;
  state?: "ALL" | ExpirationState;
  itemType?: "ALL" | ExpiringItemType;
  contractType?: "" | ContractType;
  status?: "" | ContractStatus;
  ownerId?: number | "";
  dateFrom?: string;
  dateTo?: string;
};

export type DashboardSummary = {
  expired: number;
  soon: number;
  missing: number;
  ok: number;
  total: number;
};

const toQuery = (filters: ExpiringItemsFilters) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  return query ? `?${query}` : "";
};

export const fetchExpiringItems = (filters: ExpiringItemsFilters = {}) => {
  return request<{
    items: ExpiringItem[];
    summary: DashboardSummary;
    warningDays: number;
  }>(`/api/dashboard/expiring${toQuery(filters)}`);
};
