import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/react";
import * as adminApi from "../api/admin";
import { useDebounce } from "./useApi";

/**
 * Hook powering the admin moderation panel.
 * Searches users and games with debounce, and exposes suspend/restore actions.
 */
export function useAdminSearch() {
  const { getToken } = useAuth();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 400);
  const [users, setUsers] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // userId being acted on
  const abortRef = useRef(null);

  const search = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const [usersRes, gamesRes] = await Promise.all([
        adminApi.searchAdminUsers(debouncedQuery, token, controller.signal),
        adminApi.searchAdminGames(debouncedQuery, token, controller.signal)
      ]);
      setUsers(usersRes.users || []);
      setGames(gamesRes.games || []);
    } catch (err) {
      if (err.name !== "AbortError") setError(err);
    } finally {
      setLoading(false);
    }
  }, [getToken, debouncedQuery]);

  useEffect(() => {
    search();
    return () => abortRef.current?.abort();
  }, [search]);

  const suspend = useCallback(
    async (userId, reason) => {
      setActionLoading(userId);
      try {
        const token = await getToken();
        const res = await adminApi.suspendUser(userId, reason, token);
        // Update local state to avoid full refetch
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, status: "SUSPENDED" } : u))
        );
        return res;
      } finally {
        setActionLoading(null);
      }
    },
    [getToken]
  );

  const restore = useCallback(
    async (userId, reason) => {
      setActionLoading(userId);
      try {
        const token = await getToken();
        const res = await adminApi.restoreUser(userId, reason, token);
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, status: "ACTIVE" } : u))
        );
        return res;
      } finally {
        setActionLoading(null);
      }
    },
    [getToken]
  );

  return {
    query,
    setQuery,
    users,
    games,
    loading,
    error,
    actionLoading,
    suspend,
    restore
  };
}
