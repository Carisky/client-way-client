import { request } from "./http";

export type BooleanStatus = "YES" | "NO";
export type AuthorizedPersonSide = "CLIENT" | "TSL";
export type ContractType = "STANDARD" | "IMPORT_33A" | "CBAM" | "SENT";
export type LanguageVariant = "PL" | "PL_EN" | "PL_RU" | "PL_UA";
export type ContractStatus = "DRAFT" | "GENERATED" | "SIGNED" | "ARCHIVED" | "CANCELLED";

export type Address = {
  street: string;
  houseNumber: string;
  apartmentNumber: string | null;
  postalCode: string;
  city: string;
  country: string;
};

export type AuthorizedPerson = {
  id?: number;
  side: AuthorizedPersonSide;
  fullName: string;
  position: string | null;
};

export type ClientContract = {
  id: number;
  offerId: number;
  contractType: ContractType;
  languageVariant: LanguageVariant;
  contractNumber: string | null;
  signedAt: string | null;
  validUntil: string | null;
  status: ContractStatus;
  createdAt: string;
  generatedDocuments?: GeneratedDocument[];
};

export type GeneratedDocument = {
  id: number;
  contractId: number;
  templateId: number | null;
  format: "DOCX" | "PDF" | "ZIP";
  fileName: string;
  createdAt: string;
};

export type ClientOffer = {
  id: number;
  clientCompanyId: number;
  offerNumber: string | null;
  title: string | null;
  validUntil: string | null;
  accepted: BooleanStatus | null;
  createdAt: string;
  updatedAt: string;
  contracts: ClientContract[];
};

export type ClientCompany = {
  id: number;
  name: string;
  legalForm: string | null;
  nip: string | null;
  regon: string | null;
  krs: string | null;
  eori: string | null;
  email: string | null;
  bankAccount: string | null;
  isArchived: boolean;
  forwardingOrderSigned: BooleanStatus | null;
  forwardingOrderValidUntil: string | null;
  createdAt: string;
  updatedAt: string;
  address: Address | null;
  authorizedPersons?: AuthorizedPerson[];
  offers: ClientOffer[];
  comarchReference?: {
    clientNumber: string | null;
    zsNumber: string | null;
    zsValidUntil: string | null;
    offerNumber: string | null;
    offerValidUntil: string | null;
  } | null;
  marketingReference?: {
    internalNumber: string | null;
  } | null;
};

export type ClientPayload = {
  name: string;
  legalForm: string | null;
  nip: string | null;
  regon: string | null;
  krs: string | null;
  eori: string | null;
  email: string | null;
  bankAccount: string | null;
  forwardingOrderSigned: BooleanStatus | null;
  forwardingOrderValidUntil: string | null;
  address: Address;
  authorizedPersons: AuthorizedPerson[];
  comarchReference?: {
    clientNumber: string | null;
    zsNumber: string | null;
    zsValidUntil: string | null;
    offerNumber: string | null;
    offerValidUntil: string | null;
  };
  marketingReference?: {
    internalNumber: string | null;
  };
};

export type ClientListFilters = {
  search?: string;
  contractType?: string;
  status?: string;
  includeArchived?: boolean;
  sortBy?: string;
  sortDir?: string;
};

const toQuery = (filters: ClientListFilters) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  return query ? `?${query}` : "";
};

export const fetchClients = (filters: ClientListFilters = {}) => {
  return request<{ clients: ClientCompany[] }>(`/api/clients${toQuery(filters)}`);
};

export const fetchClient = (id: number) => {
  return request<{ client: ClientCompany }>(`/api/clients/${id}`);
};

export const createClient = (payload: ClientPayload) => {
  return request<{ client: ClientCompany }>("/api/clients", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const updateClient = (id: number, payload: ClientPayload) => {
  return request<{ client: ClientCompany }>(`/api/clients/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

export const archiveClient = (id: number) => {
  return request<{ client: ClientCompany }>(`/api/clients/${id}/archive`, { method: "POST" });
};
