import type { ContractStatus, ContractType, GeneratedDocument, LanguageVariant, SignedFile } from "./clients.api";
import { apiUrl, request } from "./http";

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
  signedFiles?: SignedFile[];
};

export type ContractListFilters = {
  search?: string;
  contractType?: "" | ContractType;
  status?: "" | ContractStatus;
  sortBy?: "createdAt" | "updatedAt" | "contractNumber" | "validUntil" | "signedAt";
  sortDir?: "asc" | "desc";
};

const toQuery = (filters: ContractListFilters) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  return query ? `?${query}` : "";
};

export const fetchContracts = (filters: ContractListFilters = {}) => {
  return request<{ contracts: Contract[] }>(`/api/contracts${toQuery(filters)}`);
};

export const fetchContract = (id: number) => {
  return request<{ contract: Contract }>(`/api/contracts/${id}`);
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

export const generateContractDocuments = (
  id: number,
  options: { templateIds?: number[]; includeAneks?: boolean; replaceExisting?: boolean } = {},
) => {
  return request<{ documents: GeneratedDocument[]; contract: Contract }>(
    `/api/contracts/${id}/generate-documents`,
    {
      method: "POST",
      body: JSON.stringify(options),
    },
  );
};

export const generatedDocumentDownloadUrl = (id: number) => {
  return apiUrl(`/api/generated-documents/${id}/download`);
};

export const generatedDocumentPreviewUrl = (id: number) => {
  return apiUrl(`/api/generated-documents/${id}/preview`);
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

export const signedFileDownloadUrl = (id: number) => {
  return apiUrl(`/api/contracts/signed-files/${id}/download`);
};

export const signedFilePreviewUrl = (id: number) => {
  return apiUrl(`/api/contracts/signed-files/${id}/preview`);
};

export const saveSignedFileToDownloads = (id: number) => {
  return request<{ savedTo: string }>(`/api/contracts/signed-files/${id}/save-to-downloads`, {
    method: "POST",
  });
};

export const openSignedFileLocation = (id: number) => {
  return request<{ openedPath: string }>(`/api/contracts/signed-files/${id}/open-location`, {
    method: "POST",
  });
};
