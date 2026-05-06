<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { BooleanStatus } from "../api/clients.api";
import { fetchOffers, type Offer, type OfferListFilters } from "../api/offers.api";
import AppLayout from "../components/layout/AppLayout.vue";
import ExpirationCell from "../components/shared/ExpirationCell.vue";
import StatusBadge from "../components/shared/StatusBadge.vue";
import { useAppToast } from "../composables/useAppToast";
import type { ExpirationState } from "../api/dashboard.api";
import { useI18n } from "../i18n";

const toast = useAppToast();
const { t } = useI18n();
const offers = ref<Offer[]>([]);
const isLoading = ref(false);
const search = ref("");
const accepted = ref<"" | BooleanStatus>("");
const sortBy = ref<NonNullable<OfferListFilters["sortBy"]>>("createdAt");
const sortDir = ref<NonNullable<OfferListFilters["sortDir"]>>("desc");

const acceptedOptions: Array<{ label: string; value: "" | BooleanStatus }> = [
  { label: "Any", value: "" },
  { label: "YES", value: "YES" },
  { label: "NO", value: "NO" },
];
const sortOptions: Array<{ value: NonNullable<OfferListFilters["sortBy"]>; label: string }> = [
  { value: "createdAt", label: "Created" },
  { value: "updatedAt", label: "Updated" },
  { value: "offerNumber", label: "Number" },
  { value: "validUntil", label: "Valid until" },
];

const dayMs = 24 * 60 * 60 * 1000;
const expiration = (validUntil: string | null) => {
  if (!validUntil) {
    return { state: "MISSING" as ExpirationState, daysUntil: null };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(validUntil);
  due.setHours(0, 0, 0, 0);
  const daysUntil = Math.ceil((due.getTime() - today.getTime()) / dayMs);

  if (daysUntil < 0) {
    return { state: "EXPIRED" as ExpirationState, daysUntil };
  }

  if (daysUntil <= 30) {
    return { state: "SOON" as ExpirationState, daysUntil };
  }

  return { state: "OK" as ExpirationState, daysUntil };
};

const loadOffers = async () => {
  isLoading.value = true;

  try {
    offers.value = (
      await fetchOffers({
        search: search.value,
        accepted: accepted.value,
        sortBy: sortBy.value,
        sortDir: sortDir.value,
      })
    ).offers;
  } catch (error) {
    toast.error(error, "Failed to load offers");
  } finally {
    isLoading.value = false;
  }
};

onMounted(loadOffers);
</script>

<template>
  <AppLayout>
    <div class="mb-6">
      <h2 class="text-2xl font-semibold text-highlighted">{{ t("Offers") }}</h2>
      <p class="mt-1 text-sm text-muted">{{ t("Search all client offers and track validity dates.") }}</p>
    </div>

    <UCard class="mb-5">
      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_170px_170px_120px_auto] xl:items-end">
        <UFormField :label="t('Search')">
          <UInput
            v-model="search"
            icon="i-lucide-search"
            :placeholder="t('Offer number, title, client name, NIP')"
            class="w-full"
            @keyup.enter="loadOffers"
          />
        </UFormField>
        <UFormField :label="t('Accepted')">
          <select v-model="accepted" class="h-9 w-full rounded-md border border-default bg-default px-3 text-sm">
            <option v-for="item in acceptedOptions" :key="item.label" :value="item.value">{{ t(item.label) }}</option>
          </select>
        </UFormField>
        <UFormField :label="t('Sort by')">
          <select v-model="sortBy" class="h-9 w-full rounded-md border border-default bg-default px-3 text-sm">
            <option v-for="item in sortOptions" :key="item.value" :value="item.value">{{ t(item.label) }}</option>
          </select>
        </UFormField>
        <UFormField :label="t('Direction')">
          <select v-model="sortDir" class="h-9 w-full rounded-md border border-default bg-default px-3 text-sm">
            <option value="desc">{{ t("Desc") }}</option>
            <option value="asc">{{ t("Asc") }}</option>
          </select>
        </UFormField>
        <UButton icon="i-lucide-filter" :label="t('Apply')" variant="outline" @click="loadOffers" />
      </div>
    </UCard>

    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="font-medium text-highlighted">{{ t("Offer database") }}</h3>
          <UBadge color="neutral" variant="soft">{{ offers.length }}</UBadge>
        </div>
      </template>

      <div v-if="isLoading" class="py-10 text-center text-sm text-muted">{{ t("Loading offers...") }}</div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-default text-sm">
          <thead>
            <tr class="text-left text-muted">
              <th class="py-3 pr-4 font-medium">{{ t("Offer") }}</th>
              <th class="py-3 pr-4 font-medium">{{ t("Client") }}</th>
              <th class="py-3 pr-4 font-medium">{{ t("Accepted") }}</th>
              <th class="py-3 pr-4 font-medium">{{ t("Contracts") }}</th>
              <th class="py-3 pr-4 font-medium">{{ t("Valid until") }}</th>
              <th class="py-3 text-right font-medium">{{ t("Actions") }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default">
            <tr v-for="offer in offers" :key="offer.id">
              <td class="py-3 pr-4">
                <p class="font-medium text-highlighted">{{ offer.offerNumber ?? offer.title ?? t("Offer") }}</p>
                <p class="text-xs text-muted">{{ offer.title ?? "-" }}</p>
              </td>
              <td class="py-3 pr-4">
                <RouterLink :to="`/clients/${offer.clientCompany.id}`" class="font-medium text-primary hover:underline">
                  {{ offer.clientCompany.name }}
                </RouterLink>
                <p class="text-xs text-muted">{{ offer.clientCompany.nip ?? "-" }}</p>
              </td>
              <td class="py-3 pr-4"><StatusBadge :status="offer.accepted" /></td>
              <td class="py-3 pr-4 text-muted">{{ offer.contracts.length }}</td>
              <td class="py-3 pr-4">
                <ExpirationCell
                  :state="expiration(offer.validUntil).state"
                  :days-until="expiration(offer.validUntil).daysUntil"
                  :due-at="offer.validUntil"
                />
              </td>
              <td class="py-3 text-right">
                <div class="flex justify-end gap-2">
                  <UButton
                    :to="`/offers/${offer.id}/contracts/new`"
                    size="xs"
                    icon="i-lucide-file-plus-2"
                    :aria-label="t('New contract')"
                    :title="t('New contract')"
                    square
                  />
                  <UButton :to="`/clients/${offer.clientCompany.id}`" size="xs" icon="i-lucide-arrow-right" :label="t('Open')" />
                </div>
              </td>
            </tr>
            <tr v-if="!offers.length">
              <td colspan="6" class="py-10 text-center text-muted">{{ t("No offers found") }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>
  </AppLayout>
</template>
