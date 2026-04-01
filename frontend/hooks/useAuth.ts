"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { loginApi, logoutApi, refreshTokenApi, getMe, getRefreshTokenFromCookie, clearAuthCookies } from "@/lib/auth";

export interface User {
    id: number;
    username: string;
    role: string;
    full_name?: string;
}

interface UseAuthReturn {
    user: User | null;
    loading: boolean;
    error: string | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
    refreshSession: () => Promise<boolean>;
}

const TOKEN_REFRESH_BUFFER = 60 * 1000;

export function useAuth(): UseAuthReturn {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

    const clearRefreshTimer = useCallback(() => {
        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
            refreshTimerRef.current = null;
        }
    }, []);

    const scheduleTokenRefresh = useCallback(() => {
        clearRefreshTimer();
        
        const refreshToken = getRefreshTokenFromCookie();
        if (!refreshToken) return;

        refreshTimerRef.current = setTimeout(async () => {
            try {
                const success = await refreshSession();
                if (success) {
                    scheduleTokenRefresh();
                }
            } catch (err) {
                console.warn("Auto-refresh failed, will retry");
                scheduleTokenRefresh();
            }
        }, 13 * 60 * 1000);
    }, [clearRefreshTimer]);

    const refreshSession = useCallback(async (): Promise<boolean> => {
        const refreshToken = getRefreshTokenFromCookie();
        if (!refreshToken) {
            return false;
        }

        try {
            await refreshTokenApi(refreshToken);
            return true;
        } catch (err) {
            console.warn("Session refresh failed:", err);
            clearAuthCookies();
            setUser(null);
            return false;
        }
    }, []);

    const checkAuth = useCallback(async () => {
        try {
            const userData = await getMe();
            setUser(userData);
            setError(null);
            scheduleTokenRefresh();
            return true;
        } catch (err) {
            console.warn("Auth check failed:", err);
            setUser(null);
            return false;
        } finally {
            setLoading(false);
        }
    }, [scheduleTokenRefresh]);

    useEffect(() => {
        checkAuth();
        return () => clearRefreshTimer();
    }, [checkAuth, clearRefreshTimer]);

    const login = useCallback(async (username: string, password: string) => {
        setLoading(true);
        setError(null);

        try {
            const response = await loginApi({ username, password });
            setUser(response.user);
            scheduleTokenRefresh();
        } catch (err: any) {
            setError(err.message || "Đã xảy ra lỗi khi đăng nhập");
            throw err;
        } finally {
            setLoading(false);
        }
    }, [scheduleTokenRefresh]);

    const logout = useCallback(async () => {
        clearRefreshTimer();

        try {
            await logoutApi();
        } catch (err) {
            console.warn("Logout API call failed:", err);
        }

        clearAuthCookies();
        setUser(null);
        router.push("/login");
    }, [clearRefreshTimer, router]);

    return {
        user,
        loading,
        error,
        login,
        logout,
        isAuthenticated: user !== null,
        refreshSession,
    };
}
