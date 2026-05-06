<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { ContractStatus, ContractType } from "../api/clients.api";
import { fetchContracts, type Contract, type ContractListFilters } from "../api/contracts.api";
import AppLayout from "../components/layout/AppLayout.vue";
import StatusBadge from "../components/shared/StatusBadge.vue";
import { useAppToast } from "../composables/useAppToast";
import { useI18n } from "../i18n";

const route = useRoute();
const router = useRouter();
const toast = useAppToast();
const { t } = useI18n();

const contracts = ref<Contract[]>([]);
const isLoading = ref(false);
const search = ref(typeof route.query.search === "string" ? route.query.search : "");
const contractType = ref<"" | ContractType>("");
const status = ref<"" | ContractStatus>("");
const sortBy = ref<NonNullable<ContractListFilters["sortBy"]>>("createdAt");
const sortDir = ref<NonNullable<ContractListFilters["sortDir"]>>("desc");

const contractTypes: Array<"" | ContractType> = ["", "STANDARD", "IMPORT_33A", "CBAM", "SENT"];
const statuses: Array<"" | ContractStatus> = ["", "DRAFT", "GENERATED", "SIGNED", "ARCHIVED", "CANCELLED"];
const sortOptions: Array<{ value: NonNullable<ContractListFilters["sortBy"]>; label: string }> = [
  { value: "createdAt", label: "Created" },
  { value: "updatedAt", label: "Updated" },
  { value: "contractNumber", label: "Number" },
  { value: "signedAt", label: "Signed" },
  { value: "validUntil", label: "Valid until" },
];

const loadContracts = async () => {
  isLoading.value = true;

  try {
    contracts.value = (
      await fetchContracts({
        search: search.value,
        contractType: contractType.value,
        status: status.value,
        sortBy: sortBy.value,
        sortDir: sortDir.value,
      })
    ).contracts;
  } catch (error) {
    toast.error(error, "Failed to load contracts");
  } finally {
    isLoading.value = false;
  }
};

const syncSearchQuery = () => {
  void router.replace({
    query: {
      ...route.query,
      search: search.value || undefined,
    },
  });
};

const applyFilters = async () => {
  syncSearchQuery();
  await loadContracts();
};

watch(
  () => route.query.search,
  (value) => {
    if (typeof value === "string" && value !== search.value) {
      search.value = value;
      void loadContracts();
    }
  },
);

onMounted(loadContracts);
</script>

<template>
  <AppLayout>
    <div class="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="text-2xl font-semibold text-highlighted">{{ t("Contracts") }}</h2>
        <p class="mt-1 text-sm text-muted">{{ t("Search all contracts without opening every client card.") }}</p>
      </div>
    </div>

    <UCard class="mb-5">
      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_170px_170px_170px_120px_auto] xl:items-end">
        <UFormField :label="t('Search')">
          <UInput
            v-model="search"
            icon="i-lucide-search"
            :placeholder="t('Number, client name, NIP')"
            class="w-full"
            @keyup.enter="applyFilters"
          />
        </UFormField>
        <UFormField :label="t('Type')">
          <select v-model="contractType" class="h-9 w-full rounded-md border border-default bg-default px-3 text-sm">
            <option v-for="type in contractTypes" :key="type || 'all'" :value="type">{{ type || t("Any") }}</option>
          </select>
        </UFormField>
        <UFormField :label="t('Status')">
          <select v-model="status" class="h-9 w-full rounded-md border border-default bg-default px-3 text-sm">
            <option v-for="item in statuses" :key="item || 'all'" :value="item">{{ item ? t(item) : t("Any") }}</option>
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
        <UButton icon="i-lucide-filter" :label="t('Apply')" variant="outline" @click="applyFilters" />
      </div>
    </UCard>

    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="font-medium text-highlighted">{{ t("Contract database") }}</h3>
          <UBadge color="neutral" variant="soft">{{ contracts.length }}</UBadge>
        </div>
      </template>

      <div v-if="isLoading" class="py-10 text-center text-sm text-muted">{{ t("Loading contracts...") }}</div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-default text-sm">
          <thead>
            <tr class="text-left text-muted">
              <th class="py-3 pr-4 font-medium">{{ t("Number") }}</th>
              <th class="py-3 pr-4 font-medium">{{ t("Client") }}</th>
              <th class="py-3 pr-4 font-medium">{{ t("Type") }}</th>
              <th class="py-3 pr-4 font-medium">{{ t("Signed") }}</th>
              <th class="py-3 pr-4 font-medium">{{ t("Valid until") }}</th>
              <th class="py-3 pr-4 font-medium">{{ t("Status") }}</th>
              <th class="py-3 pr-4 font-medium">{{ t("Docs") }}</th>
              <th class="py-3 text-right font-medium">{{ t("Actions") }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default">
            <tr v-for="contract in contracts" :key="contract.id">
              <td class="py-3 pr-4 font-medium text-highlighted">
                {{ contract.contractNumber ?? t("Draft") }}
              </td>
              <td class="py-3 pr-4">
                <RouterLink
                  :to="`/clients/${contract.offer.clientCompany.id}`"
                  class="font-medium text-primary hover:underline"
                >
                  {{ contract.offer.clientCompany.name }}
                </RouterLink>
                <p class="text-xs text-muted">{{ contract.offer.clientCompany.nip ?? "-" }}</p>
              </td>
              <td class="py-3 pr-4">
                <p>{{ contract.contractType }}</p>
                <p class="text-xs text-muted">{{ contract.languageVariant }}</p>
              </td>
              <td class="py-3 pr-4 text-muted">{{ contract.signedAt?.slice(0, 10) ?? "-" }}</td>
              <td class="py-3 pr-4 text-muted">{{ contract.validUntil?.slice(0, 10) ?? "-" }}</td>
              <td class="py-3 pr-4"><StatusBadge :status="contract.status" /></td>
              <td class="py-3 pr-4 text-muted">{{ contract.generatedDocuments?.length ?? 0 }}</td>
              <td class="py-3 text-right">
                <UButton
                  :to="`/contracts/${contract.id}`"
                  size="xs"
                  icon="i-lucide-arrow-right"
                  :label="t('Open')"
                />
              </td>
            </tr>
            <tr v-if="!contracts.length">
              <td colspan="8" class="py-10 text-center text-muted">{{ t("No contracts found") }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>
  </AppLayout>
</template>
