<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { archiveClient, fetchClient, type ClientCompany } from "../api/clients.api";
import { ApiError } from "../api/http";
import AppLayout from "../components/layout/AppLayout.vue";
import ContractHistoryTable from "../components/contracts/ContractHistoryTable.vue";
import StatusBadge from "../components/shared/StatusBadge.vue";

const route = useRoute();
const router = useRouter();
const client = ref<ClientCompany | null>(null);
const isLoading = ref(false);
const errorMessage = ref("");

const loadClient = async () => {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    client.value = (await fetchClient(Number(route.params.id))).client;
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : "Failed to load client";
  } finally {
    isLoading.value = false;
  }
};

const archive = async () => {
  if (!client.value) {
    return;
  }

  await archiveClient(client.value.id);
  await router.push("/clients");
};

onMounted(loadClient);
</script>

<template>
  <AppLayout>
    <div v-if="isLoading" class="py-10 text-center text-muted">Loading client...</div>
    <UAlert
      v-else-if="errorMessage"
      color="error"
      variant="soft"
      icon="i-lucide-circle-alert"
      :title="errorMessage"
    />

    <template v-else-if="client">
      <div class="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div class="flex items-center gap-3">
            <h2 class="text-2xl font-semibold text-highlighted">{{ client.name }}</h2>
            <UBadge v-if="client.isArchived" color="neutral" variant="soft">Archived</UBadge>
          </div>
          <p class="mt-1 text-sm text-muted">
            NIP {{ client.nip ?? "-" }} · EORI {{ client.eori ?? "-" }} · {{ client.email ?? "No email" }}
          </p>
        </div>

        <div class="flex gap-2">
          <UButton :to="`/clients/${client.id}/offers/new`" icon="i-lucide-file-plus-2" label="New offer" />
          <UButton :to="`/clients/${client.id}/edit`" icon="i-lucide-pencil" variant="outline" label="Edit" />
          <UButton
            v-if="!client.isArchived"
            icon="i-lucide-archive"
            color="error"
            variant="soft"
            label="Archive"
            @click="archive"
          />
        </div>
      </div>

      <div class="grid gap-5 xl:grid-cols-[1fr_380px]">
        <div class="space-y-5">
          <UCard>
            <template #header><h3 class="font-medium text-highlighted">Offers and contracts</h3></template>
            <div class="space-y-5">
              <div v-for="offer in client.offers" :key="offer.id" class="rounded-md border border-default p-4">
                <div class="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p class="font-medium text-highlighted">
                      {{ offer.offerNumber ?? offer.title ?? "Offer" }}
                    </p>
                    <p class="text-sm text-muted">
                      Valid until {{ offer.validUntil?.slice(0, 10) ?? "-" }}
                    </p>
                  </div>
                  <div class="flex items-center gap-2">
                    <StatusBadge :status="offer.accepted" />
                    <UButton
                      :to="`/offers/${offer.id}/contracts/new`"
                      size="xs"
                      icon="i-lucide-file-plus-2"
                      label="New contract"
                    />
                  </div>
                </div>
                <ContractHistoryTable :contracts="offer.contracts" @uploaded="loadClient" />
              </div>
              <p v-if="!client.offers.length" class="py-8 text-center text-sm text-muted">
                No offers yet. Create an offer before adding contracts.
              </p>
            </div>
          </UCard>

          <UCard>
            <template #header><h3 class="font-medium text-highlighted">Authorized persons</h3></template>
            <div class="grid gap-3 md:grid-cols-2">
              <div
                v-for="person in client.authorizedPersons"
                :key="person.id"
                class="rounded-md border border-default p-3"
              >
                <UBadge class="mb-2" color="neutral" variant="soft">{{ person.side }}</UBadge>
                <p class="font-medium text-highlighted">{{ person.fullName }}</p>
                <p class="text-sm text-muted">{{ person.position ?? "-" }}</p>
              </div>
              <p v-if="!client.authorizedPersons?.length" class="text-sm text-muted">No persons added.</p>
            </div>
          </UCard>
        </div>

        <div class="space-y-5">
          <UCard>
            <template #header><h3 class="font-medium text-highlighted">Address</h3></template>
            <p class="text-sm text-muted">
              {{ client.address?.street }} {{ client.address?.houseNumber
              }}<template v-if="client.address?.apartmentNumber">/{{ client.address.apartmentNumber }}</template>
            </p>
            <p class="mt-1 text-sm text-muted">
              {{ client.address?.postalCode }} {{ client.address?.city }}, {{ client.address?.country }}
            </p>
          </UCard>

          <UCard>
            <template #header><h3 class="font-medium text-highlighted">Statuses</h3></template>
            <dl class="space-y-3 text-sm">
              <div class="flex items-center justify-between gap-3">
                <dt class="text-muted">Forwarding order</dt>
                <dd><StatusBadge :status="client.forwardingOrderSigned" /></dd>
              </div>
              <div class="flex items-center justify-between gap-3">
                <dt class="text-muted">Order valid until</dt>
                <dd>{{ client.forwardingOrderValidUntil?.slice(0, 10) ?? "-" }}</dd>
              </div>
            </dl>
          </UCard>

          <UCard>
            <template #header><h3 class="font-medium text-highlighted">References</h3></template>
            <dl class="space-y-3 text-sm">
              <div class="flex justify-between gap-3">
                <dt class="text-muted">Comarch client</dt>
                <dd>{{ client.comarchReference?.clientNumber ?? "-" }}</dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-muted">Comarch ZS</dt>
                <dd>{{ client.comarchReference?.zsNumber ?? "-" }}</dd>
              </div>
              <div class="flex justify-between gap-3">
                <dt class="text-muted">Marketing no.</dt>
                <dd>{{ client.marketingReference?.internalNumber ?? "-" }}</dd>
              </div>
            </dl>
          </UCard>
        </div>
      </div>
    </template>
  </AppLayout>
</template>
