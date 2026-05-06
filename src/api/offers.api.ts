import type { BooleanStatus, ClientContract, ClientOffer } from "./clients.api";
import { request } from "./http";

export type OfferPayload = {
  offerNumber: string | null;
  title: string | null;
  validUntil: string | null;
  accepted: BooleanStatus | null;
};

export type Offer = ClientOffer & {
  clientCompany: {
    id: number;
    name: string;
    nip: string | null;
    email: string | null;
  };
  contracts: ClientContract[];
};

export type OfferListFilters = {
  search?: string;
  accepted?: "" | BooleanStatus;
  sortBy?: "createdAt" | "updatedAt" | "offerNumber" | "validUntil";
  sortDir?: "asc" | "desc";
};

const toQuery = (filters: OfferListFilters) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  return query ? `?${query}` : "";
};

export const fetchOffers = (filters: OfferListFilters = {}) => {
  return request<{ offers: Offer[] }>(`/api/offers${toQuery(filters)}`);
};

export const createOffer = (clientId: number, payload: OfferPayload) => {
  return request<{ offer: ClientOffer }>(`/api/clients/${clientId}/offers`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const fetchOffer = (id: number) => {
  return request<{ offer: ClientOffer }>(`/api/offers/${id}`);
};

export const updateOffer = (id: number, payload: Partial<OfferPayload>) => {
  return request<{ offer: ClientOffer }>(`/api/offers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};
