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
import AppLayout from "../components/layout/AppLayout.vue";
import { useAppToast } from "../composables/useAppToast";
import {
  fieldErrorsFromApiError,
  setFieldError,
  type FieldErrors,
} from "../utils/formErrors";

const route = useRoute();
const router = useRouter();
const clientId = computed(() => Number(route.params.id));
const isEdit = computed(() => route.name === "client-edit");
const isSaving = ref(false);
const toast = useAppToast();
const fieldErrors = ref<FieldErrors>({});

const emptyPerson = (): AuthorizedPerson => ({
  side: "CLIENT",
  firstName: null,
  lastName: null,
  fullName: "",
  position: null,
});

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
  authorizedPersons: form.value.authorizedPersons
    .map((person) => ({
      ...person,
      firstName: normalize(person.firstName),
      lastName: normalize(person.lastName),
      fullName: [person.firstName, person.lastName].filter(Boolean).join(" ").trim() || person.fullName,
      position: normalize(person.position),
    }))
    .filter((person) => person.firstName || person.lastName || person.fullName.trim()),
});

const fieldError = (path: string) => fieldErrors.value[path];

const validateForm = () => {
  let errors: FieldErrors = {};
  const email = form.value.email?.trim();

  if (form.value.name.trim().length < 2) {
    errors = setFieldError(errors, "name", "Name must contain at least 2 characters");
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors = setFieldError(errors, "email", "Invalid email address");
  }

  if (!form.value.address.street.trim()) {
    errors = setFieldError(errors, "address.street", "Street is required");
  }

  if (!form.value.address.houseNumber.trim()) {
    errors = setFieldError(errors, "address.houseNumber", "House no. is required");
  }

  if (!form.value.address.postalCode.trim()) {
    errors = setFieldError(errors, "address.postalCode", "Postal code is required");
  }

  if (!form.value.address.city.trim()) {
    errors = setFieldError(errors, "address.city", "City is required");
  }

  if (!form.value.address.country.trim()) {
    errors = setFieldError(errors, "address.country", "Country is required");
  }

  form.value.authorizedPersons.forEach((person, index) => {
    const firstName = person.firstName?.trim() ?? "";
    const lastName = person.lastName?.trim() ?? "";

    if ((firstName || lastName) && [firstName, lastName].join(" ").trim().length < 2) {
      errors = setFieldError(errors, `authorizedPersons.${index}.firstName`, "Name or last name is required");
    }
  });

  fieldErrors.value = errors;
  return Object.keys(errors).length === 0;
};

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
  fieldErrors.value = {};

  if (!validateForm()) {
    toast.error(new Error("Fix highlighted fields"));
    isSaving.value = false;
    return;
  }

  try {
    const payload = preparePayload();
    const response = isEdit.value
      ? await updateClient(clientId.value, payload)
      : await createClient(payload);
    await router.push(`/clients/${response.client.id}`);
  } catch (error) {
    fieldErrors.value = fieldErrorsFromApiError(error);
    toast.error(error, "Failed to save client");
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

    <form class="space-y-5" novalidate @submit.prevent="save">
      <UCard>
        <template #header><h3 class="font-medium text-highlighted">Company</h3></template>
        <div class="grid gap-4 md:grid-cols-2">
          <UFormField label="Name" :error="fieldError('name')"><UInput v-model="form.name" class="w-full" /></UFormField>
          <UFormField label="Legal form"><UInput v-model="form.legalForm" class="w-full" /></UFormField>
          <UFormField label="NIP"><UInput v-model="form.nip" class="w-full" /></UFormField>
          <UFormField label="REGON"><UInput v-model="form.regon" class="w-full" /></UFormField>
          <UFormField label="KRS"><UInput v-model="form.krs" class="w-full" /></UFormField>
          <UFormField label="EORI"><UInput v-model="form.eori" class="w-full" /></UFormField>
          <UFormField label="Email" :error="fieldError('email')"><UInput v-model="form.email" type="email" class="w-full" /></UFormField>
          <UFormField label="Bank account"><UInput v-model="form.bankAccount" class="w-full" /></UFormField>
        </div>
      </UCard>

      <UCard>
        <template #header><h3 class="font-medium text-highlighted">Address</h3></template>
        <div class="grid gap-4 md:grid-cols-3">
          <UFormField label="Street" :error="fieldError('address.street')"><UInput v-model="form.address.street" class="w-full" /></UFormField>
          <UFormField label="House no." :error="fieldError('address.houseNumber')"><UInput v-model="form.address.houseNumber" class="w-full" /></UFormField>
          <UFormField label="Apartment"><UInput v-model="form.address.apartmentNumber" class="w-full" /></UFormField>
          <UFormField label="Postal code" :error="fieldError('address.postalCode')"><UInput v-model="form.address.postalCode" class="w-full" /></UFormField>
          <UFormField label="City" :error="fieldError('address.city')"><UInput v-model="form.address.city" class="w-full" /></UFormField>
          <UFormField label="Country" :error="fieldError('address.country')"><UInput v-model="form.address.country" class="w-full" /></UFormField>
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
            class="grid gap-3 md:grid-cols-[120px_1fr_1fr_1fr_auto]"
          >
            <select v-model="person.side" class="h-9 rounded-md border border-default bg-default px-3 text-sm">
              <option value="CLIENT">CLIENT</option>
              <option value="TSL">TSL</option>
            </select>
            <UFormField :error="fieldError(`authorizedPersons.${index}.firstName`)">
              <UInput v-model="person.firstName" placeholder="Name" class="w-full" />
            </UFormField>
            <UFormField :error="fieldError(`authorizedPersons.${index}.lastName`)">
              <UInput v-model="person.lastName" placeholder="Last name" class="w-full" />
            </UFormField>
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
