import { createRouter, createWebHashHistory } from "vue-router";
import { useAuthStore } from "../stores/auth.store";
import LoginView from "../views/LoginView.vue";
import DashboardView from "../views/DashboardView.vue";
import UsersView from "../views/UsersView.vue";

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/login",
      name: "login",
      component: LoginView,
      meta: { public: true },
    },
    {
      path: "/",
      component: DashboardView,
      meta: { requiresAuth: true },
    },
    {
      path: "/users",
      component: UsersView,
      meta: { requiresAuth: true, roles: ["ADMIN"] },
    },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  if (auth.state.token && !auth.state.user) {
    await auth.loadMe();
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated.value) {
    return { path: "/login", query: { redirect: to.fullPath } };
  }

  const roles = to.meta.roles as string[] | undefined;

  if (roles && !roles.includes(auth.state.user?.role ?? "")) {
    return "/";
  }

  if (to.meta.public && auth.isAuthenticated.value) {
    return "/";
  }
});
