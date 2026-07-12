import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  type DoseLog,
  type Supplement,
  type UserProfile,
} from "@/context/SupplementContext";

const AUTH_KEY = "@suptracker:auth";

export interface AuthSession {
  token: string;
  email: string;
  userId: string;
}

function apiBase(): string {
  return (
    process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ||
    "http://localhost:5000"
  );
}

export async function getStoredSession(): Promise<AuthSession | null> {
  try {
    const raw = await AsyncStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_KEY);
}

async function saveSession(session: AuthSession): Promise<void> {
  await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(session));
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...init } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${apiBase()}/api${path}`, {
    ...init,
    headers,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof body?.error === "string" ? body.error : `Request failed (${res.status})`
    );
  }
  return body as T;
}

export async function registerAccount(
  email: string,
  password: string,
  name?: string
): Promise<AuthSession> {
  const data = await request<{
    token: string;
    user: { id: string; email: string };
  }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
  const session: AuthSession = {
    token: data.token,
    email: data.user.email,
    userId: data.user.id,
  };
  await saveSession(session);
  return session;
}

export async function loginAccount(
  email: string,
  password: string
): Promise<AuthSession> {
  const data = await request<{
    token: string;
    user: { id: string; email: string };
  }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const session: AuthSession = {
    token: data.token,
    email: data.user.email,
    userId: data.user.id,
  };
  await saveSession(session);
  return session;
}

export async function logoutAccount(): Promise<void> {
  const session = await getStoredSession();
  if (session) {
    try {
      await request("/auth/logout", {
        method: "POST",
        token: session.token,
      });
    } catch {
      // ignore network errors on logout
    }
  }
  await clearSession();
}

export interface SyncPayload {
  supplements: Supplement[];
  doseLogs: DoseLog[];
  profile: UserProfile;
  updatedAt?: string;
}

export async function pushSync(payload: SyncPayload): Promise<SyncPayload> {
  const session = await getStoredSession();
  if (!session) throw new Error("Sign in to sync your data.");
  return request<SyncPayload>("/sync", {
    method: "PUT",
    token: session.token,
    body: JSON.stringify(payload),
  });
}

export async function pullSync(): Promise<SyncPayload> {
  const session = await getStoredSession();
  if (!session) throw new Error("Sign in to sync your data.");
  return request<SyncPayload>("/sync", {
    method: "GET",
    token: session.token,
  });
}
