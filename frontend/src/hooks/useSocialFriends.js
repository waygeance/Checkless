import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/react";
import * as socialApi from "../api/social";

/**
 * Hook that provides friends list, friend requests, and social action handlers.
 * Requires an authenticated user.
 */
export function useSocialFriends() {
  const { getToken } = useAuth();
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      const token = await getToken();
      const [friendsRes, requestsRes] = await Promise.all([
        socialApi.listFriends(token, controller.signal),
        socialApi.listRequests(token, controller.signal)
      ]);
      setFriends(friendsRes.friends || []);
      setRequests(requestsRes.requests || []);
      setError(null);
    } catch (err) {
      if (err.name !== "AbortError") setError(err);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  /** Send a friend request by username */
  const sendRequest = useCallback(
    async (username) => {
      const token = await getToken();
      const res = await socialApi.sendRequest(username, token);
      await load();
      return res;
    },
    [getToken, load]
  );

  /** Accept or decline a friend request */
  const respondRequest = useCallback(
    async (id, action) => {
      const token = await getToken();
      const res = await socialApi.respondRequest(id, action, token);
      await load();
      return res;
    },
    [getToken, load]
  );

  /** Cancel an outgoing request */
  const cancelRequest = useCallback(
    async (id) => {
      const token = await getToken();
      const res = await socialApi.cancelRequest(id, token);
      await load();
      return res;
    },
    [getToken, load]
  );

  /** Remove a friend by userId */
  const removeFriend = useCallback(
    async (userId) => {
      const token = await getToken();
      const res = await socialApi.removeFriend(userId, token);
      await load();
      return res;
    },
    [getToken, load]
  );

  return {
    friends,
    requests,
    loading,
    error,
    refetch: load,
    sendRequest,
    respondRequest,
    cancelRequest,
    removeFriend
  };
}

/**
 * Hook for managing block list.
 */
export function useBlocks() {
  const { getToken } = useAuth();
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const token = await getToken();
    const res = await socialApi.listBlocks(token);
    setBlocks(res.blocks || []);
    setLoading(false);
  }, [getToken]);

  useEffect(() => {
    load();
  }, [load]);

  const blockUser = useCallback(
    async (username) => {
      const token = await getToken();
      await socialApi.blockUser(username, token);
      await load();
    },
    [getToken, load]
  );

  const unblockUser = useCallback(
    async (userId) => {
      const token = await getToken();
      await socialApi.unblockUser(userId, token);
      await load();
    },
    [getToken, load]
  );

  return { blocks, loading, refetch: load, blockUser, unblockUser };
}
