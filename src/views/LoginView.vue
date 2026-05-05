<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ApiError } from "../api/http";
import { useAuthStore } from "../stores/auth.store";

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const email = ref("");
const password = ref("");
const errorMessage = ref("");

const submit = async () => {
  errorMessage.value = "";

  try {
    await auth.login(email.value, password.value);
    await router.push(typeof route.query.redirect === "string" ? route.query.redirect : "/");
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : "Login failed";
  }
};
</script>

<template>
  <main class="grid min-h-screen grid-cols-1 bg-default lg:grid-cols-[1fr_420px]">
    <section class="hidden border-r border-default bg-muted px-12 py-10 lg:flex lg:flex-col">
      <div>
        <p class="text-sm font-medium text-muted">Client Way</p>
        <h1 class="mt-3 max-w-xl text-4xl font-semibold tracking-normal text-highlighted">
          Employee access for contract and document workflows
        </h1>
      </div>

      <div class="mt-auto grid grid-cols-3 gap-3">
        <UCard>
          <p class="text-2xl font-semibold text-highlighted">Auth</p>
          <p class="mt-1 text-sm text-muted">Named accounts</p>
        </UCard>
        <UCard>
          <p class="text-2xl font-semibold text-highlighted">API</p>
          <p class="mt-1 text-sm text-muted">JWT protected</p>
        </UCard>
        <UCard>
          <p class="text-2xl font-semibold text-highlighted">UI</p>
          <p class="mt-1 text-sm text-muted">Nuxt UI shell</p>
        </UCard>
      </div>
    </section>

    <section class="flex items-center justify-center px-4 py-10">
      <UCard class="w-full max-w-md">
        <template #header>
          <div>
            <h2 class="text-xl font-semibold text-highlighted">Sign in</h2>
            <p class="mt-1 text-sm text-muted">Use your employee account.</p>
          </div>
        </template>

        <form class="space-y-4" @submit.prevent="submit">
          <UAlert
            v-if="errorMessage"
            color="error"
            variant="soft"
            icon="i-lucide-circle-alert"
            :title="errorMessage"
          />

          <UFormField label="Email">
            <UInput v-model="email" type="email" autocomplete="email" class="w-full" required />
          </UFormField>

          <UFormField label="Password">
            <UInput
              v-model="password"
              type="password"
              autocomplete="current-password"
              class="w-full"
              required
            />
          </UFormField>

          <UButton
            type="submit"
            label="Login"
            icon="i-lucide-log-in"
            block
            :loading="auth.state.isLoading"
          />
        </form>
      </UCard>
    </section>
  </main>
</template>
