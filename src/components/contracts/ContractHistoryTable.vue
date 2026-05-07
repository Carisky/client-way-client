<script setup lang="ts">
import { ref } from "vue";
import type { ClientContract } from "../../api/clients.api";
import {
  attachSignedCopy,
  generatedDocumentDownloadUrl,
  generatedDocumentPreviewUrl,
  generateContractDocuments,
  signedFileDownloadUrl,
  signedFilePreviewUrl,
} from "../../api/contracts.api";
import { downloadFileToClient } from "../../api/downloads";
import { fetchTemplates, type DocumentTemplate } from "../../api/templates.api";
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
const savingSignedIds = ref(new Set<number>());
const aneksDialog = ref<{
  isOpen: boolean;
  isLoading: boolean;
  contract: ClientContract | null;
  mode: "MAIN_WITH_ANEKS" | "ANEKS";
  templates: DocumentTemplate[];
  selectedIds: number[];
}>({
  isOpen: false,
  isLoading: false,
  contract: null,
  mode: "ANEKS",
  templates: [],
  selectedIds: [],
});

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

const generateDocuments = async (
  contract: ClientContract,
  mode: "MAIN" | "MAIN_WITH_ANEKS" | "ANEKS",
  selectedAneksIds: number[] = [],
) => {
  const contractId = contract.id;
  generatingIds.value = new Set(generatingIds.value).add(contractId);

  try {
    if (mode === "ANEKS") {
      if (!selectedAneksIds.length) {
        toast.error(new Error("Select at least one ANEKS template"));
        return;
      }

      await generateContractDocuments(contractId, {
        templateIds: selectedAneksIds,
        replaceExisting: true,
      });
    } else if (mode === "MAIN_WITH_ANEKS") {
      if (!selectedAneksIds.length) {
        toast.error(new Error("Select at least one ANEKS template"));
        return;
      }

      const mainTemplates = (await fetchTemplates(contract.contractType, true, "MAIN")).templates;
      await generateContractDocuments(contractId, {
        templateIds: [...mainTemplates.map((template) => template.id), ...selectedAneksIds],
        replaceExisting: true,
      });
    } else {
      await generateContractDocuments(contractId, {
        includeAneks: false,
        replaceExisting: true,
      });
    }

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

const openAneksDialog = async (contract: ClientContract, mode: "MAIN_WITH_ANEKS" | "ANEKS") => {
  aneksDialog.value = {
    isOpen: true,
    isLoading: true,
    contract,
    mode,
    templates: [],
    selectedIds: [],
  };

  try {
    const templates = (await fetchTemplates(contract.contractType, true, "ANEKS")).templates;
    aneksDialog.value = {
      ...aneksDialog.value,
      isLoading: false,
      templates,
      selectedIds: templates.map((template) => template.id),
    };
  } catch (error) {
    aneksDialog.value = { ...aneksDialog.value, isLoading: false };
    toast.error(error, "Failed to load templates");
  }
};

const closeAneksDialog = () => {
  aneksDialog.value = {
    isOpen: false,
    isLoading: false,
    contract: null,
    mode: "ANEKS",
    templates: [],
    selectedIds: [],
  };
};

const toggleAneksTemplate = (templateId: number) => {
  const selected = new Set(aneksDialog.value.selectedIds);

  if (selected.has(templateId)) {
    selected.delete(templateId);
  } else {
    selected.add(templateId);
  }

  aneksDialog.value = { ...aneksDialog.value, selectedIds: [...selected] };
};

const confirmAneksGeneration = async () => {
  const { contract, mode, selectedIds } = aneksDialog.value;

  if (!contract) {
    return;
  }

  await generateDocuments(contract, mode, selectedIds);
  closeAneksDialog();
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
    const result = await downloadFileToClient(generatedDocumentDownloadUrl(documentId), fileName);
    toast.success(result?.savedTo ? "File saved" : "Download started", result?.savedTo ?? fileName);
  } catch (error) {
    toast.error(error, "Download failed");
  } finally {
    const next = new Set(savingIds.value);
    next.delete(documentId);
    savingIds.value = next;
  }
};

const canPreviewSignedFile = (mimeType: string | null) => {
  return !!mimeType && (mimeType === "application/pdf" || mimeType.startsWith("image/"));
};

const previewSignedFile = async (signedFileId: number) => {
  const response = await fetch(signedFilePreviewUrl(signedFileId), {
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

const downloadSignedFile = async (signedFileId: number, fileName: string) => {
  savingSignedIds.value = new Set(savingSignedIds.value).add(signedFileId);

  try {
    const result = await downloadFileToClient(signedFileDownloadUrl(signedFileId), fileName);
    toast.success(result?.savedTo ? "File saved" : "Download started", result?.savedTo ?? fileName);
  } catch (error) {
    toast.error(error, "Download failed");
  } finally {
    const next = new Set(savingSignedIds.value);
    next.delete(signedFileId);
    savingSignedIds.value = next;
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
            :title="t('Generate main docs')"
            :aria-label="t('Generate main docs')"
            variant="outline"
            square
            :loading="generatingIds.has(contract.id)"
            @click="generateDocuments(contract, 'MAIN')"
          />
          <UButton
            size="xs"
            icon="i-lucide-files"
            :title="t('Generate docs with ANEKS')"
            :aria-label="t('Generate docs with ANEKS')"
            variant="outline"
            square
            :loading="generatingIds.has(contract.id)"
            @click="openAneksDialog(contract, 'MAIN_WITH_ANEKS')"
          />
          <UButton
            size="xs"
            icon="i-lucide-file-plus-2"
            :title="t('Generate ANEKS only')"
            :aria-label="t('Generate ANEKS only')"
            variant="outline"
            square
            :loading="generatingIds.has(contract.id)"
            @click="openAneksDialog(contract, 'ANEKS')"
          />
        </div>
        <div v-if="contract.generatedDocuments?.length" class="flex min-w-0 flex-col gap-1">
          <div
            v-for="document in contract.generatedDocuments"
            :key="document.id"
            class="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-1 text-xs"
          >
            <span class="truncate text-muted" :title="`${document.format} - ${document.fileName}`">
              {{ document.template?.templateKind === "ANEKS" ? "ANEKS - " : "" }}{{ document.format }} -
              {{ document.fileName }}
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
        <div class="mb-2 flex items-center justify-end gap-2">
          <p class="text-xs font-medium text-muted">{{ t("Signed copy") }}</p>
          <label>
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
        <div v-if="contract.signedFiles?.length" class="flex min-w-0 flex-col gap-1">
          <div
            v-for="file in contract.signedFiles"
            :key="file.id"
            class="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-1 text-xs"
          >
            <span class="truncate text-muted" :title="file.originalName">
              {{ file.originalName }}
            </span>
            <UButton
              v-if="canPreviewSignedFile(file.mimeType)"
              size="xs"
              variant="ghost"
              icon="i-lucide-eye"
              :title="t('Preview')"
              :aria-label="t('Preview')"
              square
              @click="previewSignedFile(file.id)"
            />
            <UButton
              size="xs"
              variant="ghost"
              icon="i-lucide-download"
              :title="t('Save')"
              :aria-label="t('Save')"
              square
              :loading="savingSignedIds.has(file.id)"
              @click="downloadSignedFile(file.id, file.originalName)"
            />
          </div>
        </div>
        <p v-else class="text-right text-xs text-muted">{{ t("No files") }}</p>
      </div>
    </article>

    <p v-if="!contracts.length" class="py-8 text-center text-sm text-muted">{{ t("No contracts yet") }}</p>

    <div
      v-if="aneksDialog.isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div class="w-full max-w-lg rounded-md border border-default bg-default shadow-xl">
        <div class="flex items-center justify-between border-b border-default px-4 py-3">
          <div>
            <p class="font-medium text-highlighted">
              {{ aneksDialog.mode === "ANEKS" ? t("Generate ANEKS only") : t("Generate docs with ANEKS") }}
            </p>
            <p class="text-xs text-muted">{{ aneksDialog.contract?.contractType }}</p>
          </div>
          <UButton
            icon="i-lucide-x"
            variant="ghost"
            square
            :title="t('Cancel')"
            :aria-label="t('Cancel')"
            @click="closeAneksDialog"
          />
        </div>

        <div class="max-h-[60vh] overflow-y-auto p-4">
          <div v-if="aneksDialog.isLoading" class="py-8 text-center text-sm text-muted">
            {{ t("Loading templates...") }}
          </div>
          <div v-else-if="aneksDialog.templates.length" class="space-y-2">
            <label
              v-for="template in aneksDialog.templates"
              :key="template.id"
              class="flex cursor-pointer items-start gap-3 rounded-md border border-default p-3 hover:bg-muted"
            >
              <input
                type="checkbox"
                class="mt-1"
                :checked="aneksDialog.selectedIds.includes(template.id)"
                @change="toggleAneksTemplate(template.id)"
              />
              <span class="min-w-0">
                <span class="block truncate text-sm font-medium text-highlighted">{{ template.name }}</span>
                <span class="block truncate text-xs text-muted">
                  {{ template.code }}
                  <template v-if="template.parentTemplate"> - {{ template.parentTemplate.name }}</template>
                </span>
              </span>
            </label>
          </div>
          <p v-else class="py-8 text-center text-sm text-muted">{{ t("No templates imported.") }}</p>
        </div>

        <div class="flex justify-end gap-2 border-t border-default px-4 py-3">
          <UButton :label="t('Cancel')" variant="outline" @click="closeAneksDialog" />
          <UButton
            icon="i-lucide-file-cog"
            :label="t('Generate docs')"
            :disabled="aneksDialog.isLoading || !aneksDialog.selectedIds.length"
            :loading="!!aneksDialog.contract && generatingIds.has(aneksDialog.contract.id)"
            @click="confirmAneksGeneration"
          />
        </div>
      </div>
    </div>
  </div>
</template>
