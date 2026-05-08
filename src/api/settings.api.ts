import { request } from "./http";

export type ContractNumberSettings = {
  nextNumber: number;
  minimumNextNumber: number;
};

export const fetchContractNumberSettings = () => {
  return request<{ settings: ContractNumberSettings }>("/api/settings/contract-number");
};

export const updateContractNumberSettings = (nextNumber: number) => {
  return request<{ settings: ContractNumberSettings }>("/api/settings/contract-number", {
    method: "PATCH",
    body: JSON.stringify({ nextNumber }),
  });
};
