<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { ContractType } from "../api/clients.api";
import {
  archiveTemplate,
  fetchTemplates,
  restoreTemplate,
  uploadTemplate,
  uploadTemplateTranslation,
  type DocumentTemplate,
  type TemplateLanguage,
} from "../api/templates.api";
import AppLayout from "../components/layout/AppLayout.vue";
import { useAppToast } from "../composables/useAppToast";
import { fieldErrorsFromApiError, setFieldError, type FieldErrors } from "../utils/formErrors";
import { useI18n } from "../i18n";

const contractTypes: ContractType[] = ["STANDARD", "IMPORT_33A", "CBAM", "SENT"];
const translationLanguages: Array<Exclude<TemplateLanguage, "PL">> = ["EN", "UA", "RU"];

const templates = ref<DocumentTemplate[]>([]);
const selectedContractType = ref<ContractType | "">("");
const activeOnly = ref(true);
const toast = useAppToast();
const { t } = useI18n();
const fieldErrors = ref<FieldErrors>({});
const isLoading = ref(false);
const isUploading = ref(false);
const form = ref({
  code: "",
  name: "",
  contractType: "STANDARD" as ContractType,
  baseLanguage: "PL" as TemplateLanguage,
  file: null as File | null,
});

const fieldError = (path: string) => fieldErrors.value[path];

const loadTemplates = async () => {
  isLoading.value = true;

  try {
    templates.value = (await fetchTemplates(selectedContractType.value, activeOnly.value)).templates;
  } catch (error) {
    toast.error(error, "Failed to load templates");
  } finally {
    isLoading.value = false;
  }
};

const archive = async (templateId: number) => {
  try {
    await archiveTemplate(templateId);
    toast.success("Template archived");
    await loadTemplates();
  } catch (error) {
    toast.error(error, "Failed to archive template");
  }
};

const restore = async (templateId: number) => {
  try {
    await restoreTemplate(templateId);
    toast.success("Template restored");
    await loadTemplates();
  } catch (error) {
    toast.error(error, "Failed to restore template");
  }
};

const onTemplateFile = (event: Event) => {
  form.value.file = (event.target as HTMLInputElement).files?.[0] ?? null;
};

const submitTemplate = async () => {
  fieldErrors.value = {};

  if (!form.value.file) {
    fieldErrors.value = setFieldError({}, "file", t("Template DOCX file is required"));
    toast.error(new Error("Fix highlighted fields"));
    return;
  }

  isUploading.value = true;

  try {
    await uploadTemplate({
      code: form.value.code,
      name: form.value.name,
      contractType: form.value.contractType,
      baseLanguage: form.value.baseLanguage,
      file: form.value.file,
    });
    form.value = {
      code: "",
      name: "",
      contractType: "STANDARD",
      baseLanguage: "PL",
      file: null,
    };
    toast.success("Template imported");
    await loadTemplates();
  } catch (error) {
    fieldErrors.value = fieldErrorsFromApiError(error);
    toast.error(error, "Failed to upload template");
  } finally {
    isUploading.value = false;
  }
};

const submitTranslation = async (
  templateId: number,
  language: Exclude<TemplateLanguage, "PL">,
  event: Event,
) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) {
    return;
  }

  try {
    await uploadTemplateTranslation(templateId, language, file);
    input.value = "";
    toast.success(t("{language} translation attached", { language }));
    await loadTemplates();
  } catch (error) {
    toast.error(error, "Failed to attach translation");
  }
};

onMounted(loadTemplates);
</script>

<template>
  <AppLayout>
    <div class="mb-6">
      <h2 class="text-2xl font-semibold text-highlighted">{{ t("Templates") }}</h2>
      <p class="mt-1 text-sm text-muted">{{ t("Import DOCX templates and parse database placeholders.") }}</p>
    </div>

    <div class="grid min-w-0 gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
      <UCard>
        <template #header><h3 class="font-medium text-highlighted">{{ t("Import template") }}</h3></template>
        <form class="space-y-4" novalidate @submit.prevent="submitTemplate">
          <UFormField :label="t('Name')" :error="fieldError('name')">
            <UInput v-model="form.name" class="w-full" />
          </UFormField>
          <UFormField :label="t('Code')">
            <UInput v-model="form.code" :placeholder="t('auto from filename')" class="w-full" />
          </UFormField>
          <UFormField :label="t('Contract type')">
            <select v-model="form.contractType" class="h-9 w-full rounded-md border border-default bg-default px-3 text-sm">
              <option v-for="type in contractTypes" :key="type" :value="type">{{ type }}</option>
            </select>
          </UFormField>
          <UFormField :label="t('Base language')">
            <select v-model="form.baseLanguage" class="h-9 w-full rounded-md border border-default bg-default px-3 text-sm">
              <option value="PL">PL</option>
            </select>
          </UFormField>
          <UFormField :label="t('DOCX file')" :error="fieldError('file')">
            <input type="file" accept=".docx" class="w-full text-sm" @change="onTemplateFile" />
          </UFormField>
          <UButton type="submit" icon="i-lucide-upload" :label="t('Import')" block :loading="isUploading" />
        </form>
      </UCard>

      <UCard>
        <template #header>
          <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h3 class="font-medium text-highlighted">{{ t("Generation list") }}</h3>
            <div class="flex items-center gap-2">
              <UCheckbox v-model="activeOnly" :label="t('Active only')" @change="loadTemplates" />
              <select v-model="selectedContractType" class="h-9 rounded-md border border-default bg-default px-3 text-sm">
                <option value="">{{ t("All") }}</option>
                <option v-for="type in contractTypes" :key="type" :value="type">{{ type }}</option>
              </select>
              <UButton icon="i-lucide-refresh-cw" :label="t('Refresh')" variant="outline" @click="loadTemplates" />
            </div>
          </div>
        </template>

        <div v-if="isLoading" class="py-10 text-center text-sm text-muted">{{ t("Loading templates...") }}</div>
        <div v-else class="space-y-4">
          <div v-for="template in templates" :key="template.id" class="rounded-md border border-default p-4">
            <div class="mb-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <p class="font-medium text-highlighted">{{ template.fileName }}</p>
                <p class="text-sm text-muted">
                  {{ template.name }} &middot; {{ template.contractType }} &middot; {{ template.code }}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <UBadge :color="template.isActive ? 'success' : 'neutral'" variant="soft">
                  {{ template.isActive ? t("Active") : t("Archived") }}
                </UBadge>
                <UBadge color="neutral" variant="soft">{{ template.baseLanguage }}</UBadge>
                <UButton
                  v-if="template.isActive"
                  size="xs"
                  color="error"
                  variant="soft"
                  icon="i-lucide-archive"
                  :label="t('Archive')"
                  @click="archive(template.id)"
                />
                <UButton
                  v-else
                  size="xs"
                  color="primary"
                  variant="soft"
                  icon="i-lucide-rotate-ccw"
                  :label="t('Restore')"
                  @click="restore(template.id)"
                />
              </div>
            </div>

            <div class="mb-4 grid gap-3 md:grid-cols-2">
              <div>
                <p class="mb-2 text-sm font-medium text-highlighted">{{ t("Parsed placeholders") }}</p>
                <div class="flex flex-wrap gap-1">
                  <UBadge v-for="path in template.placeholders" :key="path" color="success" variant="soft">
                    {{ path }}
                  </UBadge>
                  <span v-if="!template.placeholders.length" class="text-sm text-muted">{{ t("None") }}</span>
                </div>
              </div>
              <div>
                <p class="mb-2 text-sm font-medium text-highlighted">{{ t("Unsupported") }}</p>
                <div class="flex flex-wrap gap-1">
                  <UBadge
                    v-for="path in template.unsupportedPlaceholders"
                    :key="path"
                    color="error"
                    variant="soft"
                  >
                    {{ path }}
                  </UBadge>
                  <span v-if="!template.unsupportedPlaceholders.length" class="text-sm text-muted">{{ t("None") }}</span>
                </div>
              </div>
            </div>

            <div class="grid gap-3 md:grid-cols-3">
              <div v-for="language in translationLanguages" :key="language">
                <p class="mb-1 text-xs font-medium text-muted">{{ language }} {{ t("translation") }}</p>
                <input
                  type="file"
                  accept=".docx"
                  class="w-full text-xs"
                  @change="submitTranslation(template.id, language, $event)"
                />
                <p class="mt-1 text-xs text-muted">
                  {{
                    template.translations.find((translation) => translation.language === language)?.fileName ??
                    t("Not attached")
                  }}
                </p>
              </div>
            </div>
          </div>
          <p v-if="!templates.length" class="py-10 text-center text-sm text-muted">{{ t("No templates imported.") }}</p>
        </div>
      </UCard>
    </div>
  </AppLayout>
</template>
