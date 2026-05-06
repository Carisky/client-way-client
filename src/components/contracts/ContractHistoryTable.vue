<script setup lang="ts">
import { ref } from "vue";
import type { ClientContract } from "../../api/clients.api";
import {
  attachSignedCopy,
  generatedDocumentDownloadUrl,
  generatedDocumentPreviewUrl,
  generateContractDocuments,
  openGeneratedDocumentLocation,
  saveGeneratedDocumentToDownloads,
} from "../../api/contracts.api";
import { getAuthToken } from "../../api/http";
import { useAppToast } from "../../composables/useAppToast";
import { useI18n } from "../../i18n";
import StatusBadge from "../shared/StatusBadge.vue";

defineProps<{
  contracts: ClientContract[];
}>();

const emit = defineEmits<{
  uploaded: [];
  generated: [];
}>();

const toast = useAppToast();
const { t } = useI18n();
const generatingIds = ref(new Set<number>());
const savingIds = ref(new Set<number>());

const uploadSignedCopy = async (contractId: number, event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) {
    return;
  }

  try {
    await attachSignedCopy(contractId, file);
    input.value = "";
    toast.success("Signed copy attached");
    emit("uploaded");
  } catch (error) {
    toast.error(error, "Signed copy upload failed");
  }
};

const generateDocuments = async (contractId: number) => {
  generatingIds.value = new Set(generatingIds.value).add(contractId);

  try {
    await generateContractDocuments(contractId);
    toast.success("Documents generated");
    emit("generated");
  } catch (error) {
    toast.error(error, "Document generation failed");
  } finally {
    const next = new Set(generatingIds.value);
    next.delete(contractId);
    generatingIds.value = next;
  }
};

const previewGeneratedDocument = async (documentId: number) => {
  const response = await fetch(generatedDocumentPreviewUrl(documentId), {
    headers: getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {},
  });

  if (!response.ok) {
    toast.error(new Error("Preview failed"));
    return;
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

const downloadGeneratedDocument = async (documentId: number, fileName: string) => {
  savingIds.value = new Set(savingIds.value).add(documentId);

  try {
    const result = await saveGeneratedDocumentToDownloads(documentId);
    let locationOpened = false;
    toast.success("File saved", t("{path}. Click to open location.", { path: result.savedTo }), () => {
      if (locationOpened) {
        return;
      }

      locationOpened = true;
      void openGeneratedLocation(documentId);
    });
  } catch {
    const response = await fetch(generatedDocumentDownloadUrl(documentId), {
      headers: getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {},
    });

    if (!response.ok) {
      toast.error(new Error("Download failed"));
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Download started", fileName);
  } finally {
    const next = new Set(savingIds.value);
    next.delete(documentId);
    savingIds.value = next;
  }
};

const openGeneratedLocation = async (documentId: number) => {
  try {
    const result = await openGeneratedDocumentLocation(documentId);
    toast.success("Opened file location", result.openedPath);
  } catch (error) {
    toast.error(error, "Failed to open file location");
  }
};
</script>

<template>
  <div class="min-w-0 divide-y divide-default">
    <article
      v-for="contract in contracts"
      :key="contract.id"
      class="grid min-w-0 gap-4 py-4 lg:grid-cols-[minmax(160px,1fr)_270px_230px_96px]"
    >
      <div class="min-w-0">
        <p class="truncate font-medium text-highlighted" :title="contract.contractNumber ?? t('Draft')">
          {{ contract.contractNumber ?? t("Draft") }}
        </p>
        <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
          <span>{{ contract.contractType }}</span>
          <span>{{ contract.languageVariant }}</span>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-3 text-sm">
        <div>
          <p class="text-xs text-muted">{{ t("Signed") }}</p>
          <p class="mt-1 text-highlighted">{{ contract.signedAt?.slice(0, 10) ?? "-" }}</p>
        </div>
        <div>
          <p class="text-xs text-muted">{{ t("Until") }}</p>
          <p class="mt-1 text-highlighted">{{ contract.validUntil?.slice(0, 10) ?? "-" }}</p>
        </div>
        <div>
          <p class="text-xs text-muted">{{ t("Status") }}</p>
          <div class="mt-1"><StatusBadge :status="contract.status" /></div>
        </div>
      </div>

      <div class="min-w-0 space-y-2">
        <div class="flex items-center gap-2">
          <p class="text-xs font-medium text-muted">{{ t("Docs") }}</p>
          <UButton
            size="xs"
            icon="i-lucide-file-cog"
            :title="t('Generate docs')"
            :aria-label="t('Generate docs')"
            variant="outline"
            square
            :loading="generatingIds.has(contract.id)"
            @click="generateDocuments(contract.id)"
          />
        </div>
        <div v-if="contract.generatedDocuments?.length" class="flex min-w-0 flex-col gap-1">
          <div
            v-for="document in contract.generatedDocuments"
            :key="document.id"
            class="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-1 text-xs"
          >
            <span class="truncate text-muted" :title="`${document.format} - ${document.fileName}`">
              {{ document.format }} - {{ document.fileName }}
            </span>
            <UButton
              v-if="document.format === 'PDF'"
              size="xs"
              variant="ghost"
              icon="i-lucide-eye"
              :title="t('Preview')"
              :aria-label="t('Preview')"
              square
              @click="previewGeneratedDocument(document.id)"
            />
            <UButton
              size="xs"
              variant="ghost"
              icon="i-lucide-download"
              :title="t('Save')"
              :aria-label="t('Save')"
              square
              :loading="savingIds.has(document.id)"
              @click="downloadGeneratedDocument(document.id, document.fileName)"
            />
          </div>
        </div>
        <p v-else class="text-xs text-muted">{{ t("No files") }}</p>
      </div>

      <div class="min-w-0">
        <p class="mb-2 text-right text-xs font-medium text-muted">{{ t("Signed copy") }}</p>
        <label class="flex justify-end">
          <input
            type="file"
            accept="application/pdf,image/*"
            class="sr-only"
            @change="uploadSignedCopy(contract.id, $event)"
          />
          <span
            class="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-default text-primary hover:bg-muted"
            :title="t('Attach signed copy')"
            :aria-label="t('Attach signed copy')"
          >
            <UIcon name="i-lucide-paperclip" class="size-4" />
          </span>
        </label>
      </div>
    </article>

    <p v-if="!contracts.length" class="py-8 text-center text-sm text-muted">{{ t("No contracts yet") }}</p>
  </div>
</template>
