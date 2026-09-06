import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/react";
import * as challengeApi from "../api/challenges";

/**
 * Hook for managing the current user's challenges.
 * Provides the open challenge (if any), plus action handlers.
 */
export function useChallenges() {
  const { getToken } = useAuth();
  // We store the user's current open challenge (created by them)
  const [myChallenge, setMyChallenge] = useState(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  /** Create a new challenge and store the result */
  const createChallenge = useCallback(
    async (variant) => {
      setCreating(true);
      setError(null);
      try {
        const token = await getToken();
        const res = await challengeApi.createChallenge(variant, token);
        setMyChallenge(res.challenge);
        return res.challenge;
      } catch (err) {
        setError(err.code || err.message);
        throw err;
      } finally {
        setCreating(false);
      }
    },
    [getToken]
  );

  /** Cancel the open challenge */
  const cancelChallenge = useCallback(
    async (id) => {
      const token = await getToken();
      await challengeApi.cancelChallenge(id, token);
      setMyChallenge(null);
    },
    [getToken]
  );

  /** Accept a challenge by code (for incoming challenges) */
  const acceptChallenge = useCallback(
    async (code) => {
      const token = await getToken();
      const res = await challengeApi.acceptChallenge(code, token);
      return res.challenge;
    },
    [getToken]
  );

  /** Look up a challenge by code */
  const lookupChallenge = useCallback(
    async (code) => {
      const token = await getToken();
      const res = await challengeApi.lookupChallenge(code, token);
      return res.challenge;
    },
    [getToken]
  );

  return {
    myChallenge,
    creating,
    error,
    createChallenge,
    cancelChallenge,
    acceptChallenge,
    lookupChallenge,
    clearMyChallenge: () => setMyChallenge(null)
  };
}
