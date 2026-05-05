import type { BooleanStatus, ClientOffer } from "./clients.api";
import { request } from "./http";

export type OfferPayload = {
  offerNumber: string | null;
  title: string | null;
  validUntil: string | null;
  accepted: BooleanStatus | null;
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
