import type { ContractType } from "./clients.api";
import { request } from "./http";

export type TemplateLanguage = "PL" | "EN" | "UA" | "RU";
export type TemplateKind = "MAIN" | "ANEKS";

export type DocumentTemplateTranslation = {
  id: number;
  templateId: number;
  language: TemplateLanguage;
  fileName: string;
  placeholders: string[];
  unsupportedPlaceholders: string[];
};

export type DocumentTemplate = {
  id: number;
  code: string;
  name: string;
  contractType: ContractType;
  templateKind: TemplateKind;
  parentTemplateId: number | null;
  parentTemplate?: Pick<DocumentTemplate, "id" | "code" | "name" | "contractType"> | null;
  aneksTemplates?: Array<Pick<DocumentTemplate, "id" | "code" | "name" | "isActive">>;
  baseLanguage: TemplateLanguage;
  fileName: string;
  placeholders: string[];
  unsupportedPlaceholders: string[];
  isActive: boolean;
  translations: DocumentTemplateTranslation[];
};

export const fetchTemplates = (
  contractType = "",
  activeOnly = true,
  templateKind: TemplateKind | "" = "",
) => {
  const params = new URLSearchParams();
  if (contractType) {
    params.set("contractType", contractType);
  }
  if (templateKind) {
    params.set("templateKind", templateKind);
  }
  params.set("activeOnly", String(activeOnly));
  const query = `?${params.toString()}`;
  return request<{ templates: DocumentTemplate[] }>(`/api/templates${query}`);
};

export const uploadTemplate = (payload: {
  code: string;
  name: string;
  contractType: ContractType;
  templateKind: TemplateKind;
  parentTemplateId: number | null;
  baseLanguage: TemplateLanguage;
  file: File;
}) => {
  const body = new FormData();
  if (payload.code) {
    body.set("code", payload.code);
  }
  body.set("name", payload.name);
  body.set("contractType", payload.contractType);
  body.set("templateKind", payload.templateKind);
  if (payload.parentTemplateId) {
    body.set("parentTemplateId", String(payload.parentTemplateId));
  }
  body.set("baseLanguage", payload.baseLanguage);
  body.set("file", payload.file);

  return request<{ template: DocumentTemplate }>("/api/templates", {
    method: "POST",
    body,
  });
};

export const uploadTemplateTranslation = (
  templateId: number,
  language: Exclude<TemplateLanguage, "PL">,
  file: File,
) => {
  const body = new FormData();
  body.set("file", file);

  return request<{ translation: DocumentTemplateTranslation }>(
    `/api/templates/${templateId}/translations/${language}`,
    {
      method: "POST",
      body,
    },
  );
};

export const archiveTemplate = (id: number) => {
  return request<{ template: DocumentTemplate }>(`/api/templates/${id}/archive`, {
    method: "POST",
  });
};

export const restoreTemplate = (id: number) => {
  return request<{ template: DocumentTemplate }>(`/api/templates/${id}/restore`, {
    method: "POST",
  });
};
