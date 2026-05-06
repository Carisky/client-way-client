<script setup lang="ts">
import { onMounted, ref } from "vue";
import { fetchClients, type ClientCompany } from "../api/clients.api";
import AppLayout from "../components/layout/AppLayout.vue";
import { useAppToast } from "../composables/useAppToast";

const clients = ref<ClientCompany[]>([]);
const search = ref("");
const contractType = ref("");
const status = ref("");
const includeArchived = ref(false);
const isLoading = ref(false);
const toast = useAppToast();

const loadClients = async () => {
  isLoading.value = true;

  try {
    clients.value = (
      await fetchClients({
        search: search.value,
        contractType: contractType.value,
        status: status.value,
        includeArchived: includeArchived.value,
      })
    ).clients;
  } catch (error) {
    toast.error(error, "Failed to load clients");
  } finally {
    isLoading.value = false;
  }
};

onMounted(loadClients);
</script>

<template>
  <AppLayout>
    <div class="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="text-2xl font-semibold text-highlighted">Clients</h2>
        <p class="mt-1 text-sm text-muted">Search company records and contract history.</p>
      </div>

      <UButton to="/clients/new" icon="i-lucide-building-2" label="New client" />
    </div>

    <UCard class="mb-5">
      <div class="grid gap-3 md:grid-cols-[1fr_170px_170px_auto] md:items-end">
        <UFormField label="Search">
          <UInput
            v-model="search"
            icon="i-lucide-search"
            placeholder="Name, NIP, REGON, KRS, EORI, email"
            class="w-full"
            @keyup.enter="loadClients"
          />
        </UFormField>
        <UFormField label="Type">
          <select v-model="contractType" class="h-9 w-full rounded-md border border-default bg-default px-3 text-sm">
            <option value="">Any</option>
            <option value="STANDARD">STANDARD</option>
            <option value="IMPORT_33A">IMPORT_33A</option>
            <option value="CBAM">CBAM</option>
            <option value="SENT">SENT</option>
          </select>
        </UFormField>
        <UFormField label="Status">
          <select v-model="status" class="h-9 w-full rounded-md border border-default bg-default px-3 text-sm">
            <option value="">Any</option>
            <option value="DRAFT">DRAFT</option>
            <option value="GENERATED">GENERATED</option>
            <option value="SIGNED">SIGNED</option>
            <option value="ARCHIVED">ARCHIVED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </UFormField>
        <div class="flex items-center gap-3">
          <UCheckbox v-model="includeArchived" label="Archived" />
          <UButton icon="i-lucide-filter" label="Apply" variant="outline" @click="loadClients" />
        </div>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="font-medium text-highlighted">Client database</h3>
          <UBadge color="neutral" variant="soft">{{ clients.length }}</UBadge>
        </div>
      </template>

      <div v-if="isLoading" class="py-10 text-center text-sm text-muted">Loading clients...</div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-default text-sm">
          <thead>
            <tr class="text-left text-muted">
              <th class="py-3 pr-4 font-medium">Company</th>
              <th class="py-3 pr-4 font-medium">Tax IDs</th>
              <th class="py-3 pr-4 font-medium">Latest offer</th>
              <th class="py-3 pr-4 font-medium">Latest contract</th>
              <th class="py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-default">
            <tr v-for="client in clients" :key="client.id">
              <td class="py-3 pr-4">
                <p class="font-medium text-highlighted">{{ client.name }}</p>
                <p class="text-muted">{{ client.email ?? "-" }}</p>
              </td>
              <td class="py-3 pr-4 text-muted">
                <p>NIP: {{ client.nip ?? "-" }}</p>
                <p>EORI: {{ client.eori ?? "-" }}</p>
              </td>
              <td class="py-3 pr-4">
                <template v-if="client.offers[0]">
                  <p class="font-medium text-highlighted">
                    {{ client.offers[0].offerNumber ?? client.offers[0].title ?? "Offer" }}
                  </p>
                  <p class="text-muted">valid {{ client.offers[0].validUntil?.slice(0, 10) ?? "-" }}</p>
                </template>
                <span v-else class="text-muted">No offers</span>
              </td>
              <td class="py-3 pr-4">
                <template v-if="client.offers[0]?.contracts[0]">
                  <p class="font-medium text-highlighted">
                    {{ client.offers[0].contracts[0].contractNumber ?? "Draft" }}
                  </p>
                  <p class="text-muted">{{ client.offers[0].contracts[0].contractType }}</p>
                </template>
                <span v-else class="text-muted">No contracts</span>
              </td>
              <td class="py-3 text-right">
                <UButton :to="`/clients/${client.id}`" size="xs" icon="i-lucide-arrow-right" label="Open" />
              </td>
            </tr>
            <tr v-if="!clients.length">
              <td colspan="5" class="py-10 text-center text-muted">No clients found</td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>
  </AppLayout>
</template>
