<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { fetchContract, type Contract } from "../api/contracts.api";
import AppLayout from "../components/layout/AppLayout.vue";
import ContractHistoryTable from "../components/contracts/ContractHistoryTable.vue";
import StatusBadge from "../components/shared/StatusBadge.vue";
import { useAppToast } from "../composables/useAppToast";

const route = useRoute();
const toast = useAppToast();
const contract = ref<Contract | null>(null);
const isLoading = ref(false);

const loadContract = async () => {
  isLoading.value = true;

  try {
    contract.value = (await fetchContract(Number(route.params.id))).contract;
  } catch (error) {
    toast.error(error, "Failed to load contract");
  } finally {
    isLoading.value = false;
  }
};

onMounted(loadContract);
</script>

<template>
  <AppLayout>
    <div v-if="isLoading" class="py-10 text-center text-sm text-muted">Loading contract...</div>

    <template v-else-if="contract">
      <div class="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div class="min-w-0">
          <h2 class="truncate text-2xl font-semibold text-highlighted">
            {{ contract.contractNumber ?? "Draft contract" }}
          </h2>
          <p class="mt-1 text-sm text-muted">
            {{ contract.contractType }} · {{ contract.languageVariant }}
          </p>
        </div>

        <div class="flex flex-wrap gap-2 md:justify-end">
          <UButton
            :to="`/clients/${contract.offer.clientCompany.id}`"
            icon="i-lucide-building-2"
            label="Client"
            variant="outline"
          />
        </div>
      </div>

      <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div class="min-w-0 space-y-4">
          <UCard>
            <template #header>
              <h3 class="font-medium text-highlighted">Contract workspace</h3>
            </template>
            <ContractHistoryTable :contracts="[contract]" @uploaded="loadContract" @generated="loadContract" />
          </UCard>
        </div>

        <div class="space-y-4">
          <UCard :ui="{ body: 'p-4 sm:p-4', header: 'p-4 sm:px-4' }">
            <template #header><h3 class="font-medium text-highlighted">Client</h3></template>
            <RouterLink
              :to="`/clients/${contract.offer.clientCompany.id}`"
              class="font-medium text-primary hover:underline"
            >
              {{ contract.offer.clientCompany.name }}
            </RouterLink>
            <p class="mt-1 text-sm text-muted">NIP {{ contract.offer.clientCompany.nip ?? "-" }}</p>
            <p class="mt-1 text-sm text-muted">{{ contract.offer.clientCompany.email ?? "No email" }}</p>
          </UCard>

          <UCard :ui="{ body: 'p-4 sm:p-4', header: 'p-4 sm:px-4' }">
            <template #header><h3 class="font-medium text-highlighted">Status</h3></template>
            <div class="space-y-3 text-sm">
              <div>
                <p class="text-muted">Current</p>
                <div class="mt-1"><StatusBadge :status="contract.status" /></div>
              </div>
              <div>
                <p class="text-muted">Signed</p>
                <p class="mt-1 text-highlighted">{{ contract.signedAt?.slice(0, 10) ?? "-" }}</p>
              </div>
              <div>
                <p class="text-muted">Valid until</p>
                <p class="mt-1 text-highlighted">{{ contract.validUntil?.slice(0, 10) ?? "-" }}</p>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </template>
  </AppLayout>
</template>
