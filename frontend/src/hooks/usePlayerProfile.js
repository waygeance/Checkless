import { useEffect, useRef, useState } from "react";
import { getProfile } from "../api/users";
import { listPlayerGames } from "../api/users";

/**
 * Fetches a player's public profile and recent game history.
 *
 * @param {string} username — the URL-encoded username from route params
 * @param {string} [token]  — optional auth token (not required for public profiles)
 */
export function usePlayerProfile(username) {
  const [profile, setProfile] = useState(null);
  const [games, setGames] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (!username) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);

    Promise.all([
      getProfile(username, undefined, controller.signal),
      listPlayerGames(username, { limit: 10 }, undefined, controller.signal)
    ])
      .then(([profileRes, gamesRes]) => {
        setProfile(profileRes.profile);
        setGames(gamesRes.games || []);
        setNextCursor(gamesRes.nextCursor || null);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError(err);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [username]);

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await listPlayerGames(username, { limit: 10, cursor: nextCursor });
      setGames((prev) => [...prev, ...(res.games || [])]);
      setNextCursor(res.nextCursor || null);
    } finally {
      setLoadingMore(false);
    }
  };

  return { profile, games, nextCursor, loading, loadingMore, error, loadMore };
}
