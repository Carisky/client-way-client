<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { archiveClient, fetchClient, type ClientCompany } from "../api/clients.api";
import AppLayout from "../components/layout/AppLayout.vue";
import ContractHistoryTable from "../components/contracts/ContractHistoryTable.vue";
import StatusBadge from "../components/shared/StatusBadge.vue";
import { useAppToast } from "../composables/useAppToast";
import { useI18n } from "../i18n";

const route = useRoute();
const router = useRouter();
const toast = useAppToast();
const { t } = useI18n();
const client = ref<ClientCompany | null>(null);
const isLoading = ref(false);
const errorMessage = ref("");

const loadClient = async () => {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    client.value = (await fetchClient(Number(route.params.id))).client;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t("Failed to load client");
    toast.error(error, "Failed to load client");
  } finally {
    isLoading.value = false;
  }
};

const archive = async () => {
  if (!client.value) {
    return;
  }

  try {
    await archiveClient(client.value.id);
    toast.success("Client archived");
    await router.push("/clients");
  } catch (error) {
    toast.error(error, "Failed to archive client");
  }
};

onMounted(loadClient);
</script>

<template>
  <AppLayout>
    <div v-if="isLoading" class="py-10 text-center text-muted">{{ t("Loading client...") }}</div>
    <div v-else-if="errorMessage" class="py-10 text-center text-sm text-error">
      {{ errorMessage }}
    </div>

    <template v-else-if="client">
      <div class="mb-6 flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div class="min-w-0">
          <div class="flex min-w-0 flex-wrap items-center gap-3">
            <h2 class="break-words text-2xl font-semibold text-highlighted">{{ client.name }}</h2>
            <UBadge v-if="client.isArchived" color="neutral" variant="soft">{{ t("Archived") }}</UBadge>
          </div>
          <p class="mt-1 break-words text-sm text-muted">
            NIP {{ client.nip ?? "-" }} &middot; EORI {{ client.eori ?? "-" }} &middot; {{ client.email ?? t("No email") }}
          </p>
        </div>

        <div class="flex flex-wrap gap-2 md:justify-end">
          <UButton :to="`/clients/${client.id}/offers/new`" icon="i-lucide-file-plus-2" :label="t('New offer')" />
          <UButton :to="`/clients/${client.id}/edit`" icon="i-lucide-pencil" variant="outline" :label="t('Edit')" />
          <UButton
            v-if="!client.isArchived"
            icon="i-lucide-archive"
            color="error"
            variant="soft"
            :label="t('Archive')"
            @click="archive"
          />
        </div>
      </div>

      <div class="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_240px] 2xl:grid-cols-[minmax(0,1fr)_260px]">
        <div class="min-w-0 space-y-5">
          <UCard>
            <template #header><h3 class="font-medium text-highlighted">{{ t("Offers and contracts") }}</h3></template>
            <div class="space-y-5">
              <div v-for="offer in client.offers" :key="offer.id" class="min-w-0 rounded-md border border-default p-4">
                <div class="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div class="min-w-0">
                    <p class="break-words font-medium text-highlighted">
                      {{ offer.offerNumber ?? offer.title ?? t("Offer") }}
                    </p>
                    <p class="text-sm text-muted">
                      {{ t("Valid until") }} {{ offer.validUntil?.slice(0, 10) ?? "-" }}
                    </p>
                  </div>
                  <div class="flex flex-wrap items-center gap-2 md:justify-end">
                    <StatusBadge :status="offer.accepted" />
                    <UButton
                      :to="`/offers/${offer.id}/contracts/new`"
                      size="xs"
                      icon="i-lucide-file-plus-2"
                      :label="t('New contract')"
                    />
                  </div>
                </div>
                <ContractHistoryTable
                  :contracts="offer.contracts"
                  @uploaded="loadClient"
                  @generated="loadClient"
                />
              </div>
              <p v-if="!client.offers.length" class="py-8 text-center text-sm text-muted">
                {{ t("No offers yet. Create an offer before adding contracts.") }}
              </p>
            </div>
          </UCard>

          <UCard>
            <template #header><h3 class="font-medium text-highlighted">{{ t("Authorized persons") }}</h3></template>
            <div class="grid gap-3 md:grid-cols-2">
              <div
                v-for="person in client.authorizedPersons"
                :key="person.id"
                class="rounded-md border border-default p-3"
              >
                <UBadge class="mb-2" color="neutral" variant="soft">{{ person.side }}</UBadge>
                <p class="font-medium text-highlighted">
                  {{ [person.firstName, person.lastName].filter(Boolean).join(" ") || person.fullName }}
                </p>
                <p class="text-sm text-muted">{{ person.position ?? "-" }}</p>
              </div>
              <p v-if="!client.authorizedPersons?.length" class="text-sm text-muted">{{ t("No persons added.") }}</p>
            </div>
          </UCard>
        </div>

        <div class="min-w-0 space-y-4">
          <UCard :ui="{ body: 'p-4 sm:p-4', header: 'p-4 sm:px-4' }">
            <template #header><h3 class="font-medium text-highlighted">{{ t("Address") }}</h3></template>
            <p class="break-words text-sm text-muted">
              {{ client.address?.street }} {{ client.address?.houseNumber
              }}<template v-if="client.address?.apartmentNumber">/{{ client.address.apartmentNumber }}</template>
            </p>
            <p class="mt-1 break-words text-sm text-muted">
              {{ client.address?.postalCode }} {{ client.address?.city }}, {{ client.address?.country }}
            </p>
          </UCard>

          <UCard :ui="{ body: 'p-4 sm:p-4', header: 'p-4 sm:px-4' }">
            <template #header><h3 class="font-medium text-highlighted">{{ t("Statuses") }}</h3></template>
            <dl class="space-y-3 text-sm">
              <div class="space-y-1">
                <dt class="text-muted">{{ t("Forwarding order") }}</dt>
                <dd><StatusBadge :status="client.forwardingOrderSigned" /></dd>
              </div>
              <div class="space-y-1">
                <dt class="text-muted">{{ t("Order valid until") }}</dt>
                <dd>{{ client.forwardingOrderValidUntil?.slice(0, 10) ?? "-" }}</dd>
              </div>
            </dl>
          </UCard>

          <UCard :ui="{ body: 'p-4 sm:p-4', header: 'p-4 sm:px-4' }">
            <template #header><h3 class="font-medium text-highlighted">{{ t("References") }}</h3></template>
            <dl class="space-y-3 text-sm">
              <div class="space-y-1">
                <dt class="text-muted">{{ t("Comarch client") }}</dt>
                <dd class="break-words">{{ client.comarchReference?.clientNumber ?? "-" }}</dd>
              </div>
              <div class="space-y-1">
                <dt class="text-muted">{{ t("Comarch ZS") }}</dt>
                <dd class="break-words">{{ client.comarchReference?.zsNumber ?? "-" }}</dd>
              </div>
              <div class="space-y-1">
                <dt class="text-muted">{{ t("Marketing no.") }}</dt>
                <dd class="break-words">{{ client.marketingReference?.internalNumber ?? "-" }}</dd>
              </div>
            </dl>
          </UCard>
        </div>
      </div>
    </template>
  </AppLayout>
</template>
