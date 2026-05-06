<script setup lang="ts">
import { onMounted, ref } from "vue";
import {
  fetchExpiringItems,
  type DashboardSummary,
  type ExpiringItemsFilters,
  type ExpiringItem,
} from "../api/dashboard.api";
import type { ContractStatus, ContractType } from "../api/clients.api";
import AppLayout from "../components/layout/AppLayout.vue";
import ExpiringItemsTable from "../components/dashboard/ExpiringItemsTable.vue";
import { useAppToast } from "../composables/useAppToast";

const toast = useAppToast();
const items = ref<ExpiringItem[]>([]);
const summary = ref<DashboardSummary>({
  expired: 0,
  soon: 0,
  missing: 0,
  ok: 0,
  total: 0,
});
const isLoading = ref(false);

const contractTypes: Array<"" | ContractType> = ["", "STANDARD", "IMPORT_33A", "CBAM", "SENT"];
const contractStatuses: Array<"" | ContractStatus> = ["", "DRAFT", "GENERATED", "SIGNED", "ARCHIVED", "CANCELLED"];

const filters = ref<ExpiringItemsFilters>({
  warningDays: 30,
  state: "ALL",
  itemType: "ALL",
  contractType: "",
  status: "",
  dateFrom: "",
  dateTo: "",
});

const loadItems = async () => {
  isLoading.value = true;

  try {
    const response = await fetchExpiringItems(filters.value);
    items.value = response.items;
    summary.value = response.summary;
  } catch (error) {
    toast.error(error, "Failed to load dashboard");
  } finally {
    isLoading.value = false;
  }
};

const resetFilters = async () => {
  filters.value = {
    warningDays: 30,
    state: "ALL",
    itemType: "ALL",
    contractType: "",
    status: "",
    dateFrom: "",
    dateTo: "",
  };
  await loadItems();
};

onMounted(loadItems);
</script>

<template>
  <AppLayout>
    <div class="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="text-2xl font-semibold text-highlighted">Dashboard</h2>
        <p class="mt-1 text-sm text-muted">Expiring offers, orders, Comarch references and contracts.</p>
      </div>

      <UButton icon="i-lucide-refresh-cw" label="Refresh" variant="outline" @click="loadItems" />
    </div>

    <div class="mb-5 grid gap-4 md:grid-cols-4">
      <UCard>
        <p class="text-sm text-muted">Expired</p>
        <p class="mt-2 text-3xl font-semibold text-error">{{ summary.expired }}</p>
      </UCard>
      <UCard>
        <p class="text-sm text-muted">Due soon</p>
        <p class="mt-2 text-3xl font-semibold text-warning">{{ summary.soon }}</p>
      </UCard>
      <UCard>
        <p class="text-sm text-muted">Missing date</p>
        <p class="mt-2 text-3xl font-semibold text-muted">{{ summary.missing }}</p>
      </UCard>
      <UCard>
        <p class="text-sm text-muted">Tracked</p>
        <p class="mt-2 text-3xl font-semibold text-highlighted">{{ summary.total }}</p>
      </UCard>
    </div>

    <UCard class="mb-5">
      <div class="grid gap-3 md:grid-cols-3 xl:grid-cols-[120px_150px_170px_170px_1fr_1fr_auto_auto] xl:items-end">
        <UFormField label="Warning">
          <UInput v-model="filters.warningDays" type="number" min="1" max="365" class="w-full" />
        </UFormField>
        <UFormField label="State">
          <select v-model="filters.state" class="h-9 w-full rounded-md border border-default bg-default px-3 text-sm">
            <option value="ALL">All</option>
            <option value="EXPIRED">Expired</option>
            <option value="SOON">Soon</option>
            <option value="OK">OK</option>
            <option value="MISSING">Missing</option>
          </select>
        </UFormField>
        <UFormField label="Item type">
          <select v-model="filters.itemType" class="h-9 w-full rounded-md border border-default bg-default px-3 text-sm">
            <option value="ALL">All</option>
            <option value="OFFER">Offer</option>
            <option value="CONTRACT">Contract</option>
            <option value="FORWARDING_ORDER">Forwarding order</option>
            <option value="COMARCH_ZS">Comarch ZS</option>
            <option value="COMARCH_OFFER">Comarch offer</option>
          </select>
        </UFormField>
        <UFormField label="Contract type">
          <select v-model="filters.contractType" class="h-9 w-full rounded-md border border-default bg-default px-3 text-sm">
            <option v-for="type in contractTypes" :key="type || 'all'" :value="type">
              {{ type || "All" }}
            </option>
          </select>
        </UFormField>
        <UFormField label="Status">
          <select v-model="filters.status" class="h-9 w-full rounded-md border border-default bg-default px-3 text-sm">
            <option v-for="status in contractStatuses" :key="status || 'all'" :value="status">
              {{ status || "All" }}
            </option>
          </select>
        </UFormField>
        <UFormField label="From"><UInput v-model="filters.dateFrom" type="date" class="w-full" /></UFormField>
        <UFormField label="To"><UInput v-model="filters.dateTo" type="date" class="w-full" /></UFormField>
        <div class="flex gap-2">
          <UButton icon="i-lucide-filter" label="Apply" variant="outline" @click="loadItems" />
          <UButton icon="i-lucide-rotate-ccw" variant="ghost" aria-label="Reset" title="Reset" square @click="resetFilters" />
        </div>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="font-medium text-highlighted">Expiring items</h3>
          <UBadge color="neutral" variant="soft">{{ items.length }}</UBadge>
        </div>
      </template>

      <ExpiringItemsTable :items="items" :is-loading="isLoading" />
    </UCard>
  </AppLayout>
</template>
