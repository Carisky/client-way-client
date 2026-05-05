<script setup lang="ts">
import type { ClientContract } from "../../api/clients.api";
import { attachSignedCopy } from "../../api/contracts.api";
import StatusBadge from "../shared/StatusBadge.vue";

defineProps<{
  contracts: ClientContract[];
}>();

const emit = defineEmits<{
  uploaded: [];
}>();

const uploadSignedCopy = async (contractId: number, event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) {
    return;
  }

  await attachSignedCopy(contractId, file);
  input.value = "";
  emit("uploaded");
};
</script>

<template>
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-default text-sm">
      <thead>
        <tr class="text-left text-muted">
          <th class="py-3 pr-4 font-medium">Number</th>
          <th class="py-3 pr-4 font-medium">Type</th>
          <th class="py-3 pr-4 font-medium">Language</th>
          <th class="py-3 pr-4 font-medium">Signed</th>
          <th class="py-3 pr-4 font-medium">Valid until</th>
          <th class="py-3 pr-4 font-medium">Status</th>
          <th class="py-3 text-right font-medium">Signed copy</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-default">
        <tr v-for="contract in contracts" :key="contract.id">
          <td class="py-3 pr-4 font-medium text-highlighted">
            {{ contract.contractNumber ?? "Draft" }}
          </td>
          <td class="py-3 pr-4">{{ contract.contractType }}</td>
          <td class="py-3 pr-4">{{ contract.languageVariant }}</td>
          <td class="py-3 pr-4">{{ contract.signedAt?.slice(0, 10) ?? "-" }}</td>
          <td class="py-3 pr-4">{{ contract.validUntil?.slice(0, 10) ?? "-" }}</td>
          <td class="py-3 pr-4"><StatusBadge :status="contract.status" /></td>
          <td class="py-3 text-right">
            <input
              type="file"
              accept="application/pdf,image/*"
              class="w-48 text-xs"
              @change="uploadSignedCopy(contract.id, $event)"
            />
          </td>
        </tr>
        <tr v-if="!contracts.length">
          <td colspan="7" class="py-8 text-center text-muted">No contracts yet</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
