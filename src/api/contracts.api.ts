import type { ContractStatus, ContractType, LanguageVariant } from "./clients.api";
import { request } from "./http";

export type ContractPayload = {
  contractType: ContractType;
  languageVariant: LanguageVariant;
  signedAt: string | null;
  validUntil: string | null;
};

export type Contract = ContractPayload & {
  id: number;
  offerId: number;
  contractNumber: string | null;
  status: ContractStatus;
  createdAt: string;
  updatedAt: string;
  offer: {
    id: number;
    clientCompany: {
      id: number;
      name: string;
      nip: string | null;
      email: string | null;
    };
  };
};

export const createContractDraft = (offerId: number, payload: ContractPayload) => {
  return request<{ contract: Contract }>(`/api/offers/${offerId}/contracts`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const confirmContract = (id: number) => {
  return request<{ contract: Contract }>(`/api/contracts/${id}/confirm`, { method: "POST" });
};

export const attachSignedCopy = (id: number, file: File) => {
  const body = new FormData();
  body.set("file", file);

  return request<{ contract: Contract }>(`/api/contracts/${id}/signed-copy`, {
    method: "POST",
    body,
  });
};
