<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  createClient,
  fetchClient,
  updateClient,
  type AuthorizedPerson,
  type BooleanStatus,
  type ClientPayload,
} from "../api/clients.api";
import { ApiError } from "../api/http";
import AppLayout from "../components/layout/AppLayout.vue";

const route = useRoute();
const router = useRouter();
const clientId = computed(() => Number(route.params.id));
const isEdit = computed(() => route.name === "client-edit");
const isSaving = ref(false);
const errorMessage = ref("");

const emptyPerson = (): AuthorizedPerson => ({ side: "CLIENT", fullName: "", position: null });

const form = ref<ClientPayload>({
  name: "",
  legalForm: null,
  nip: null,
  regon: null,
  krs: null,
  eori: null,
  email: null,
  bankAccount: null,
  forwardingOrderSigned: null,
  forwardingOrderValidUntil: null,
  address: {
    street: "",
    houseNumber: "",
    apartmentNumber: null,
    postalCode: "",
    city: "",
    country: "Poland",
  },
  authorizedPersons: [emptyPerson()],
  comarchReference: {
    clientNumber: null,
    zsNumber: null,
    zsValidUntil: null,
    offerNumber: null,
    offerValidUntil: null,
  },
  marketingReference: { internalNumber: null },
});

const statusOptions: Array<{ label: string; value: BooleanStatus | "" }> = [
  { label: "Missing", value: "" },
  { label: "YES", value: "YES" },
  { label: "NO", value: "NO" },
];

const normalize = (value: string | null) => value || null;

const preparePayload = (): ClientPayload => ({
  ...form.value,
  legalForm: normalize(form.value.legalForm),
  nip: normalize(form.value.nip),
  regon: normalize(form.value.regon),
  krs: normalize(form.value.krs),
  eori: normalize(form.value.eori),
  email: normalize(form.value.email),
  bankAccount: normalize(form.value.bankAccount),
  authorizedPersons: form.value.authorizedPersons.filter((person) => person.fullName.trim()),
});

const loadClient = async () => {
  if (!isEdit.value) {
    return;
  }

  const { client } = await fetchClient(clientId.value);
  form.value = {
    name: client.name,
    legalForm: client.legalForm,
    nip: client.nip,
    regon: client.regon,
    krs: client.krs,
    eori: client.eori,
    email: client.email,
    bankAccount: client.bankAccount,
    forwardingOrderSigned: client.forwardingOrderSigned,
    forwardingOrderValidUntil: client.forwardingOrderValidUntil?.slice(0, 10) ?? null,
    address: client.address ?? form.value.address,
    authorizedPersons: client.authorizedPersons?.length ? client.authorizedPersons : [emptyPerson()],
    comarchReference: client.comarchReference
      ? {
          clientNumber: client.comarchReference.clientNumber,
          zsNumber: client.comarchReference.zsNumber,
          zsValidUntil: client.comarchReference.zsValidUntil?.slice(0, 10) ?? null,
          offerNumber: client.comarchReference.offerNumber,
          offerValidUntil: client.comarchReference.offerValidUntil?.slice(0, 10) ?? null,
        }
      : form.value.comarchReference,
    marketingReference: client.marketingReference ?? form.value.marketingReference,
  };
};

const save = async () => {
  isSaving.value = true;
  errorMessage.value = "";

  try {
    const payload = preparePayload();
    const response = isEdit.value
      ? await updateClient(clientId.value, payload)
      : await createClient(payload);
    await router.push(`/clients/${response.client.id}`);
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : "Failed to save client";
  } finally {
    isSaving.value = false;
  }
};

onMounted(loadClient);
</script>

<template>
  <AppLayout>
    <div class="mb-6">
      <h2 class="text-2xl font-semibold text-highlighted">
        {{ isEdit ? "Edit client" : "New client" }}
      </h2>
      <p class="mt-1 text-sm text-muted">Company master data, identifiers, status and contacts.</p>
    </div>

    <UAlert
      v-if="errorMessage"
      class="mb-5"
      color="error"
      variant="soft"
      icon="i-lucide-circle-alert"
      :title="errorMessage"
    />

    <form class="space-y-5" @submit.prevent="save">
      <UCard>
        <template #header><h3 class="font-medium text-highlighted">Company</h3></template>
        <div class="grid gap-4 md:grid-cols-2">
          <UFormField label="Name"><UInput v-model="form.name" class="w-full" required /></UFormField>
          <UFormField label="Legal form"><UInput v-model="form.legalForm" class="w-full" /></UFormField>
          <UFormField label="NIP"><UInput v-model="form.nip" class="w-full" /></UFormField>
          <UFormField label="REGON"><UInput v-model="form.regon" class="w-full" /></UFormField>
          <UFormField label="KRS"><UInput v-model="form.krs" class="w-full" /></UFormField>
          <UFormField label="EORI"><UInput v-model="form.eori" class="w-full" /></UFormField>
          <UFormField label="Email"><UInput v-model="form.email" type="email" class="w-full" /></UFormField>
          <UFormField label="Bank account"><UInput v-model="form.bankAccount" class="w-full" /></UFormField>
        </div>
      </UCard>

      <UCard>
        <template #header><h3 class="font-medium text-highlighted">Address</h3></template>
        <div class="grid gap-4 md:grid-cols-3">
          <UFormField label="Street"><UInput v-model="form.address.street" class="w-full" required /></UFormField>
          <UFormField label="House no."><UInput v-model="form.address.houseNumber" class="w-full" required /></UFormField>
          <UFormField label="Apartment"><UInput v-model="form.address.apartmentNumber" class="w-full" /></UFormField>
          <UFormField label="Postal code"><UInput v-model="form.address.postalCode" class="w-full" required /></UFormField>
          <UFormField label="City"><UInput v-model="form.address.city" class="w-full" required /></UFormField>
          <UFormField label="Country"><UInput v-model="form.address.country" class="w-full" required /></UFormField>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-medium text-highlighted">Authorized persons</h3>
            <UButton size="xs" icon="i-lucide-plus" label="Add" @click="form.authorizedPersons.push(emptyPerson())" />
          </div>
        </template>
        <div class="space-y-3">
          <div
            v-for="(person, index) in form.authorizedPersons"
            :key="index"
            class="grid gap-3 md:grid-cols-[120px_1fr_1fr_auto]"
          >
            <select v-model="person.side" class="h-9 rounded-md border border-default bg-default px-3 text-sm">
              <option value="CLIENT">CLIENT</option>
              <option value="TSL">TSL</option>
            </select>
            <UInput v-model="person.fullName" placeholder="Full name" />
            <UInput v-model="person.position" placeholder="Position" />
            <UButton
              icon="i-lucide-trash-2"
              color="error"
              variant="soft"
              :disabled="form.authorizedPersons.length === 1"
              @click="form.authorizedPersons.splice(index, 1)"
            />
          </div>
        </div>
      </UCard>

      <UCard>
        <template #header><h3 class="font-medium text-highlighted">Statuses and references</h3></template>
        <div class="grid gap-4 md:grid-cols-3">
          <UFormField label="Forwarding order signed">
            <select v-model="form.forwardingOrderSigned" class="h-9 w-full rounded-md border border-default bg-default px-3 text-sm">
              <option v-for="item in statusOptions" :key="item.label" :value="item.value || null">{{ item.label }}</option>
            </select>
          </UFormField>
          <UFormField label="Order valid until"><UInput v-model="form.forwardingOrderValidUntil" type="date" class="w-full" /></UFormField>
          <UFormField label="Marketing no."><UInput v-model="form.marketingReference!.internalNumber" class="w-full" /></UFormField>
          <UFormField label="Comarch client no."><UInput v-model="form.comarchReference!.clientNumber" class="w-full" /></UFormField>
          <UFormField label="Comarch ZS no."><UInput v-model="form.comarchReference!.zsNumber" class="w-full" /></UFormField>
          <UFormField label="ZS valid until"><UInput v-model="form.comarchReference!.zsValidUntil" type="date" class="w-full" /></UFormField>
        </div>
      </UCard>

      <div class="flex justify-end gap-3">
        <UButton to="/clients" color="neutral" variant="outline" label="Cancel" />
        <UButton type="submit" icon="i-lucide-save" label="Save client" :loading="isSaving" />
      </div>
    </form>
  </AppLayout>
</template>
