<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { ContractType, LanguageVariant } from "../api/clients.api";
import { confirmContract, createContractDraft } from "../api/contracts.api";
import { fetchOffer } from "../api/offers.api";
import AppLayout from "../components/layout/AppLayout.vue";
import { useAppToast } from "../composables/useAppToast";
import { fieldErrorsFromApiError, type FieldErrors } from "../utils/formErrors";

const route = useRoute();
const router = useRouter();
const toast = useAppToast();
const offerId = Number(route.params.offerId);
const clientId = ref<number | null>(null);
const isSaving = ref(false);
const fieldErrors = ref<FieldErrors>({});

const form = ref({
  contractType: "STANDARD" as ContractType,
  languageVariant: "PL" as LanguageVariant,
  signedAt: new Date().toISOString().slice(0, 10),
  validUntil: "",
});

const contractTypes: Array<{ value: ContractType; label: string }> = [
  { value: "STANDARD", label: "Standard" },
  { value: "IMPORT_33A", label: "Import 33a" },
  { value: "CBAM", label: "CBAM" },
  { value: "SENT", label: "SENT" },
];

const languages: Array<{ value: LanguageVariant; label: string }> = [
  { value: "PL", label: "Polish" },
  { value: "PL_EN", label: "Polish + English" },
  { value: "PL_RU", label: "Polish + Russian" },
  { value: "PL_UA", label: "Polish + Ukrainian" },
];

const fieldError = (path: string) => fieldErrors.value[path];

const save = async () => {
  isSaving.value = true;
  fieldErrors.value = {};

  try {
    const draft = await createContractDraft(offerId, {
      contractType: form.value.contractType,
      languageVariant: form.value.languageVariant,
      signedAt: form.value.signedAt || null,
      validUntil: form.value.validUntil || null,
    });
    const confirmed = await confirmContract(draft.contract.id);
    toast.success(`Contract ${confirmed.contract.contractNumber ?? ""} created`);
    await router.push(clientId.value ? `/clients/${clientId.value}` : "/clients");
  } catch (error) {
    fieldErrors.value = fieldErrorsFromApiError(error);
    toast.error(error, "Failed to create contract");
  } finally {
    isSaving.value = false;
  }
};

fetchOffer(offerId)
  .then(({ offer }) => {
    clientId.value = offer.clientCompanyId;
  })
  .catch((error) => toast.error(error, "Failed to load offer"));
</script>

<template>
  <AppLayout>
    <div class="mb-6">
      <h2 class="text-2xl font-semibold text-highlighted">New contract</h2>
      <p class="mt-1 text-sm text-muted">Select contract type, language variant and dates.</p>
    </div>

    <form class="max-w-3xl space-y-5" novalidate @submit.prevent="save">
      <UCard>
        <template #header><h3 class="font-medium text-highlighted">Contract type</h3></template>
        <div class="grid gap-3 md:grid-cols-2">
          <label
            v-for="item in contractTypes"
            :key="item.value"
            class="flex cursor-pointer items-center gap-3 rounded-md border border-default p-3"
          >
            <input v-model="form.contractType" type="radio" :value="item.value" />
            <span class="font-medium text-highlighted">{{ item.label }}</span>
          </label>
        </div>
      </UCard>

      <UCard>
        <template #header><h3 class="font-medium text-highlighted">Language</h3></template>
        <div class="grid gap-3 md:grid-cols-2">
          <label
            v-for="item in languages"
            :key="item.value"
            class="flex cursor-pointer items-center gap-3 rounded-md border border-default p-3"
          >
            <input v-model="form.languageVariant" type="radio" :value="item.value" />
            <span class="font-medium text-highlighted">{{ item.label }}</span>
          </label>
        </div>
      </UCard>

      <UCard>
        <template #header><h3 class="font-medium text-highlighted">Dates</h3></template>
        <div class="grid gap-4 md:grid-cols-2">
          <UFormField label="Signed at" :error="fieldError('signedAt')">
            <UInput v-model="form.signedAt" type="date" class="w-full" />
          </UFormField>
          <UFormField label="Valid until" :error="fieldError('validUntil')">
            <UInput v-model="form.validUntil" type="date" class="w-full" />
          </UFormField>
        </div>
      </UCard>

      <div class="flex justify-end gap-3">
        <UButton :to="clientId ? `/clients/${clientId}` : '/clients'" color="neutral" variant="outline" label="Cancel" />
        <UButton type="submit" icon="i-lucide-file-check-2" label="Create contract" :loading="isSaving" />
      </div>
    </form>
  </AppLayout>
</template>
