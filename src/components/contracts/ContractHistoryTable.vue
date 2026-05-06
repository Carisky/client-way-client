<script setup lang="ts">
import { ref } from "vue";
import type { ClientContract } from "../../api/clients.api";
import {
  attachSignedCopy,
  generatedDocumentDownloadUrl,
  generateContractDocuments,
  saveGeneratedDocumentToDownloads,
} from "../../api/contracts.api";
import { getAuthToken } from "../../api/http";
import StatusBadge from "../shared/StatusBadge.vue";

defineProps<{
  contracts: ClientContract[];
}>();

const emit = defineEmits<{
  uploaded: [];
  generated: [];
}>();

const generatingIds = ref(new Set<number>());
const errorMessage = ref("");
const statusMessage = ref("");

const uploadSignedCopy = async (contractId: number, event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) {
    return;
  }

  try {
    errorMessage.value = "";
    statusMessage.value = "";
    await attachSignedCopy(contractId, file);
    input.value = "";
    emit("uploaded");
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "Signed copy upload failed";
  }
};

const generateDocuments = async (contractId: number) => {
  generatingIds.value = new Set(generatingIds.value).add(contractId);

  try {
    errorMessage.value = "";
    statusMessage.value = "";
    await generateContractDocuments(contractId);
    emit("generated");
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "Document generation failed";
  } finally {
    const next = new Set(generatingIds.value);
    next.delete(contractId);
    generatingIds.value = next;
  }
};

const downloadGeneratedDocument = async (documentId: number, fileName: string) => {
  try {
    errorMessage.value = "";
    const result = await saveGeneratedDocumentToDownloads(documentId);
    statusMessage.value = `Saved to ${result.savedTo}`;
  } catch {
    const response = await fetch(generatedDocumentDownloadUrl(documentId), {
      headers: getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {},
    });

    if (!response.ok) {
      errorMessage.value = "Download failed";
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }
};
</script>

<template>
  <div class="overflow-x-auto">
    <UAlert
      v-if="errorMessage"
      class="mb-3"
      color="error"
      variant="soft"
      icon="i-lucide-circle-alert"
      :title="errorMessage"
    />
    <UAlert
      v-if="statusMessage"
      class="mb-3"
      color="success"
      variant="soft"
      icon="i-lucide-check"
      :title="statusMessage"
    />
    <table class="min-w-full divide-y divide-default text-sm">
      <thead>
        <tr class="text-left text-muted">
          <th class="py-3 pr-4 font-medium">Number</th>
          <th class="py-3 pr-4 font-medium">Type</th>
          <th class="py-3 pr-4 font-medium">Language</th>
          <th class="py-3 pr-4 font-medium">Signed</th>
          <th class="py-3 pr-4 font-medium">Valid until</th>
          <th class="py-3 pr-4 font-medium">Status</th>
          <th class="py-3 pr-4 font-medium">Generated docs</th>
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
          <td class="py-3 pr-4">
            <div class="space-y-2">
              <UButton
                size="xs"
                icon="i-lucide-file-cog"
                label="Generate docs"
                variant="outline"
                :loading="generatingIds.has(contract.id)"
                @click="generateDocuments(contract.id)"
              />
              <div v-if="contract.generatedDocuments?.length" class="flex flex-col gap-1">
                <button
                  v-for="document in contract.generatedDocuments"
                  :key="document.id"
                  type="button"
                  class="text-left text-xs text-primary hover:underline"
                  @click="downloadGeneratedDocument(document.id, document.fileName)"
                >
                  {{ document.format }} · {{ document.fileName }}
                </button>
              </div>
              <p v-else class="text-xs text-muted">No files</p>
            </div>
          </td>
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
          <td colspan="8" class="py-8 text-center text-muted">No contracts yet</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
