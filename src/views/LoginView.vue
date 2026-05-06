<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAppToast } from "../composables/useAppToast";
import LanguageSelect from "../components/shared/LanguageSelect.vue";
import { useI18n } from "../i18n";
import { useAuthStore } from "../stores/auth.store";
import { setFieldError, type FieldErrors } from "../utils/formErrors";

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const toast = useAppToast();
const { t } = useI18n();

const email = ref("");
const password = ref("");
const fieldErrors = ref<FieldErrors>({});

const fieldError = (path: string) => fieldErrors.value[path];

const validateForm = () => {
  let errors: FieldErrors = {};

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
    errors = setFieldError(errors, "email", t("Invalid email address"));
  }

  if (!password.value) {
    errors = setFieldError(errors, "password", t("Password is required"));
  }

  fieldErrors.value = errors;
  return Object.keys(errors).length === 0;
};

const submit = async () => {
  fieldErrors.value = {};

  if (!validateForm()) {
    toast.error(new Error("Fix highlighted fields"));
    return;
  }

  try {
    await auth.login(email.value, password.value);
    await router.push(typeof route.query.redirect === "string" ? route.query.redirect : "/");
  } catch (error) {
    toast.error(error, "Login failed");
  }
};
</script>

<template>
  <main class="grid min-h-screen grid-cols-1 overflow-x-hidden bg-default lg:grid-cols-[1fr_420px]">
    <section class="hidden border-r border-default bg-muted px-12 py-10 lg:flex lg:flex-col">
      <div>
        <div class="flex items-center justify-between gap-3">
          <p class="text-sm font-medium text-muted">{{ t("Client Way") }}</p>
          <LanguageSelect />
        </div>
        <h1 class="mt-3 max-w-xl text-4xl font-semibold tracking-normal text-highlighted">
          {{ t("Employee access for contract and document workflows") }}
        </h1>
      </div>

      <div class="mt-auto grid grid-cols-3 gap-3">
        <UCard>
          <p class="text-2xl font-semibold text-highlighted">Auth</p>
          <p class="mt-1 text-sm text-muted">{{ t("Named accounts") }}</p>
        </UCard>
        <UCard>
          <p class="text-2xl font-semibold text-highlighted">API</p>
          <p class="mt-1 text-sm text-muted">{{ t("JWT protected") }}</p>
        </UCard>
        <UCard>
          <p class="text-2xl font-semibold text-highlighted">UI</p>
          <p class="mt-1 text-sm text-muted">{{ t("Nuxt UI shell") }}</p>
        </UCard>
      </div>
    </section>

    <section class="flex items-center justify-center px-4 py-10">
      <UCard class="w-full max-w-md">
        <template #header>
          <div>
            <div class="flex items-start justify-between gap-3">
              <div>
                <h2 class="text-xl font-semibold text-highlighted">{{ t("Sign in") }}</h2>
                <p class="mt-1 text-sm text-muted">{{ t("Use your employee account.") }}</p>
              </div>
              <div class="lg:hidden"><LanguageSelect /></div>
            </div>
          </div>
        </template>

        <form class="space-y-4" novalidate @submit.prevent="submit">
          <UFormField :label="t('Email')" :error="fieldError('email')">
            <UInput v-model="email" type="email" autocomplete="email" class="w-full" />
          </UFormField>

          <UFormField :label="t('Password')" :error="fieldError('password')">
            <UInput
              v-model="password"
              type="password"
              autocomplete="current-password"
              class="w-full"
            />
          </UFormField>

          <UButton
            type="submit"
            :label="t('Login')"
            icon="i-lucide-log-in"
            block
            :loading="auth.state.isLoading"
          />
        </form>
      </UCard>
    </section>
  </main>
</template>
