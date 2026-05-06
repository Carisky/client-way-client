import type { ContractStatus, ContractType, GeneratedDocument, LanguageVariant } from "./clients.api";
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
  generatedDocuments?: GeneratedDocument[];
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

export const generateContractDocuments = (id: number, templateIds?: number[]) => {
  return request<{ documents: GeneratedDocument[]; contract: Contract }>(
    `/api/contracts/${id}/generate-documents`,
    {
      method: "POST",
      body: JSON.stringify({ templateIds }),
    },
  );
};

export const generatedDocumentDownloadUrl = (id: number) => {
  return `http://localhost:4000/api/generated-documents/${id}/download`;
};

export const generatedDocumentPreviewUrl = (id: number) => {
  return `http://localhost:4000/api/generated-documents/${id}/preview`;
};

export const fetchGeneratedDocuments = (contractId: number) => {
  return request<{ documents: GeneratedDocument[] }>(`/api/contracts/${contractId}/generated-documents`);
};

export const saveGeneratedDocumentToDownloads = (id: number) => {
  return request<{ savedTo: string }>(`/api/generated-documents/${id}/save-to-downloads`, {
    method: "POST",
  });
};

export const openGeneratedDocumentLocation = (id: number) => {
  return request<{ openedPath: string }>(`/api/generated-documents/${id}/open-location`, {
    method: "POST",
  });
};
