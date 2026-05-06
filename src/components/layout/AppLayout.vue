<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth.store";
import { useI18n } from "../../i18n";
import LanguageSelect from "../shared/LanguageSelect.vue";

const auth = useAuthStore();
const router = useRouter();
const { t } = useI18n();

const navItems = computed(() => [
  { label: t("Dashboard"), icon: "i-lucide-layout-dashboard", to: "/" },
  { label: t("Clients"), icon: "i-lucide-building-2", to: "/clients" },
  { label: t("Offers"), icon: "i-lucide-file-clock", to: "/offers" },
  { label: t("Contracts"), icon: "i-lucide-file-check-2", to: "/contracts" },
  { label: t("Templates"), icon: "i-lucide-file-text", to: "/templates" },
  ...(auth.can("ADMIN") ? [{ label: t("Users"), icon: "i-lucide-users", to: "/users" }] : []),
]);

const handleLogout = async () => {
  await auth.logout();
  await router.push("/login");
};
</script>

<template>
  <div class="min-h-screen overflow-x-hidden bg-default text-default">
    <aside
      class="fixed inset-y-0 left-0 hidden w-64 border-r border-default bg-muted px-4 py-5 lg:block"
    >
      <div class="mb-8">
        <p class="text-sm font-medium text-muted">{{ t("Client Way") }}</p>
        <h1 class="mt-1 text-lg font-semibold text-highlighted">{{ t("Contract Workspace") }}</h1>
      </div>

      <nav class="space-y-1">
        <UButton
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :icon="item.icon"
          :label="item.label"
          color="neutral"
          variant="ghost"
          block
          class="justify-start"
        />
      </nav>
    </aside>

    <div class="min-w-0 lg:pl-64">
      <header
        class="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-default bg-default/95 px-4 backdrop-blur lg:px-8"
      >
        <div>
          <p class="text-sm text-muted">{{ t("Signed in as") }}</p>
          <p class="font-medium text-highlighted">{{ auth.state.user?.fullName }}</p>
        </div>

        <div class="flex items-center gap-2">
          <LanguageSelect />
          <UButton
            icon="i-lucide-log-out"
            :label="t('Logout')"
            color="neutral"
            variant="outline"
            @click="handleLogout"
          />
        </div>
      </header>

      <main class="min-w-0 px-4 py-6 lg:px-8">
        <slot />
      </main>
    </div>
  </div>
</template>
