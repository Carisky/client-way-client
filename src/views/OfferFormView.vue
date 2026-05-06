<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { BooleanStatus } from "../api/clients.api";
import { createOffer } from "../api/offers.api";
import AppLayout from "../components/layout/AppLayout.vue";
import { useAppToast } from "../composables/useAppToast";
import { fieldErrorsFromApiError, type FieldErrors } from "../utils/formErrors";
import { useI18n } from "../i18n";

const route = useRoute();
const router = useRouter();
const toast = useAppToast();
const { t } = useI18n();
const clientId = Number(route.params.id);
const isSaving = ref(false);
const fieldErrors = ref<FieldErrors>({});

const form = ref({
  offerNumber: "",
  title: "",
  validUntil: "",
  accepted: "" as BooleanStatus | "",
});

const fieldError = (path: string) => fieldErrors.value[path];

const save = async () => {
  isSaving.value = true;
  fieldErrors.value = {};

  try {
    await createOffer(clientId, {
      offerNumber: form.value.offerNumber || null,
      title: form.value.title || null,
      validUntil: form.value.validUntil || null,
      accepted: form.value.accepted || null,
    });
    toast.success("Offer saved");
    await router.push(`/clients/${clientId}`);
  } catch (error) {
    fieldErrors.value = fieldErrorsFromApiError(error);
    toast.error(error, "Failed to save offer");
  } finally {
    isSaving.value = false;
  }
};
</script>

<template>
  <AppLayout>
    <div class="mb-6">
      <h2 class="text-2xl font-semibold text-highlighted">{{ t("New offer") }}</h2>
      <p class="mt-1 text-sm text-muted">{{ t("Create an offer for this client before adding contracts.") }}</p>
    </div>

    <form class="max-w-2xl space-y-5" novalidate @submit.prevent="save">
      <UCard>
        <div class="grid gap-4 md:grid-cols-2">
          <UFormField :label="t('Offer number')" :error="fieldError('offerNumber')">
            <UInput v-model="form.offerNumber" class="w-full" />
          </UFormField>
          <UFormField :label="t('Title')" :error="fieldError('title')">
            <UInput v-model="form.title" class="w-full" />
          </UFormField>
          <UFormField :label="t('Valid until')" :error="fieldError('validUntil')">
            <UInput v-model="form.validUntil" type="date" class="w-full" />
          </UFormField>
          <UFormField :label="t('Accepted')" :error="fieldError('accepted')">
            <select v-model="form.accepted" class="h-9 w-full rounded-md border border-default bg-default px-3 text-sm">
              <option value="">{{ t("Missing") }}</option>
              <option value="YES">YES</option>
              <option value="NO">NO</option>
            </select>
          </UFormField>
        </div>
      </UCard>

      <div class="flex justify-end gap-3">
        <UButton :to="`/clients/${clientId}`" color="neutral" variant="outline" :label="t('Cancel')" />
        <UButton type="submit" icon="i-lucide-save" :label="t('Save offer')" :loading="isSaving" />
      </div>
    </form>
  </AppLayout>
</template>
