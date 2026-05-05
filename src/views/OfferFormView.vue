<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { BooleanStatus } from "../api/clients.api";
import { createOffer } from "../api/offers.api";
import { ApiError } from "../api/http";
import AppLayout from "../components/layout/AppLayout.vue";

const route = useRoute();
const router = useRouter();
const clientId = Number(route.params.id);
const isSaving = ref(false);
const errorMessage = ref("");

const form = ref({
  offerNumber: "",
  title: "",
  validUntil: "",
  accepted: "" as BooleanStatus | "",
});

const save = async () => {
  isSaving.value = true;
  errorMessage.value = "";

  try {
    await createOffer(clientId, {
      offerNumber: form.value.offerNumber || null,
      title: form.value.title || null,
      validUntil: form.value.validUntil || null,
      accepted: form.value.accepted || null,
    });
    await router.push(`/clients/${clientId}`);
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : "Failed to save offer";
  } finally {
    isSaving.value = false;
  }
};
</script>

<template>
  <AppLayout>
    <div class="mb-6">
      <h2 class="text-2xl font-semibold text-highlighted">New offer</h2>
      <p class="mt-1 text-sm text-muted">Create an offer for this client before adding contracts.</p>
    </div>

    <UAlert
      v-if="errorMessage"
      class="mb-5"
      color="error"
      variant="soft"
      icon="i-lucide-circle-alert"
      :title="errorMessage"
    />

    <form class="max-w-2xl space-y-5" @submit.prevent="save">
      <UCard>
        <div class="grid gap-4 md:grid-cols-2">
          <UFormField label="Offer number">
            <UInput v-model="form.offerNumber" class="w-full" />
          </UFormField>
          <UFormField label="Title">
            <UInput v-model="form.title" class="w-full" />
          </UFormField>
          <UFormField label="Valid until">
            <UInput v-model="form.validUntil" type="date" class="w-full" />
          </UFormField>
          <UFormField label="Accepted">
            <select v-model="form.accepted" class="h-9 w-full rounded-md border border-default bg-default px-3 text-sm">
              <option value="">Missing</option>
              <option value="YES">YES</option>
              <option value="NO">NO</option>
            </select>
          </UFormField>
        </div>
      </UCard>

      <div class="flex justify-end gap-3">
        <UButton :to="`/clients/${clientId}`" color="neutral" variant="outline" label="Cancel" />
        <UButton type="submit" icon="i-lucide-save" label="Save offer" :loading="isSaving" />
      </div>
    </form>
  </AppLayout>
</template>
