/**
 * Auth loading timeouts (single source of truth for "max wait" before showing login).
 * Used by AuthContext only; index and other screens rely on isLoading from context.
 */

/** Allow time for Firebase to restore persisted session when we have no cached user (e.g. first open or after clear). */
export const AUTH_RESTORE_TIMEOUT_MS = 1500;

/** When cached user exists, wait longer before giving up so slow networks can restore Firebase session. */
export const AUTH_RESTORE_TIMEOUT_WITH_CACHE_MS = 3500;
