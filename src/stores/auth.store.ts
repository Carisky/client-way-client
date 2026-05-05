import { computed, reactive } from "vue";
import type { User, UserRole } from "../api/auth.api";
import { loginRequest, logoutRequest, meRequest } from "../api/auth.api";
import { getAuthToken, setAuthToken } from "../api/http";

type AuthState = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
};

const state = reactive<AuthState>({
  user: null,
  token: getAuthToken(),
  isLoading: false,
});

export const useAuthStore = () => {
  const isAuthenticated = computed(() => Boolean(state.token && state.user));

  const login = async (email: string, password: string) => {
    state.isLoading = true;

    try {
      const response = await loginRequest(email, password);
      state.user = response.user;
      state.token = response.token;
      setAuthToken(response.token);
    } finally {
      state.isLoading = false;
    }
  };

  const logout = async () => {
    if (state.token) {
      await logoutRequest().catch(() => undefined);
    }

    state.user = null;
    state.token = null;
    setAuthToken(null);
  };

  const loadMe = async () => {
    if (!state.token || state.user) {
      return;
    }

    state.isLoading = true;

    try {
      const response = await meRequest();
      state.user = response.user;
    } catch {
      state.user = null;
      state.token = null;
      setAuthToken(null);
    } finally {
      state.isLoading = false;
    }
  };

  const can = (roles: UserRole | UserRole[]) => {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    return Boolean(state.user && allowedRoles.includes(state.user.role));
  };

  return {
    state,
    isAuthenticated,
    login,
    logout,
    loadMe,
    can,
  };
};
