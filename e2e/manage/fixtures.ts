/**
 * Shared constants describing the seeded manage fixtures and the inputs used
 * across the manage e2e tests.
 *
 * The seeded data lives in `public/e2e/rebuild/` and is fetched by the app at
 * runtime (see `magicFetch` in `app/utils/nuxt/fetch.ts`, which prefixes paths
 * with `e2e/` when `__NB_BUILDTIME_VITESTING__` is true).
 */

/** Base URL of the test server (`pnpm dev-for-test` / `prod-for-test`). */
export const BASE_URL = "http://localhost:13000";

/** Password seeded for every encrypted fixture below. */
export const TEST_PASSWORD = "123";

/**
 * localStorage key used by `useStaging`.
 * Kept in sync with `STAGING_KEY` in `app/utils/hooks/useStaging.ts`.
 */
export const STAGING_KEY = "nb-staged-items";

/**
 * Every ciphertext the app produces is CryptoJS AES, i.e. base64 of
 * `Salted__…`, so it always starts with `U2Fs`. Used to assert that a field
 * was actually encrypted before being committed.
 */
export const ENCRYPTED_PREFIX = "U2Fs";

/**
 * The three seeded articles in `public/e2e/rebuild/json/articles.json`, one per
 * encryption mode the manage UI must support. Ids double as the `[id]` route
 * segment, e.g. `/manage/articles/1111`.
 */
export const ARTICLES = {
  /** Plain, unencrypted article. */
  plain: {
    id: 1111,
    title: "test",
    tags: ["tag1", "tag2"]
  },
  /** Article with two `[encrypt]…[/encrypt]` blocks (partial encryption). */
  blockEncrypted: {
    id: 2222,
    title: "test",
    blockCount: 2
  },
  /** Fully encrypted article — title and body are both ciphertext. */
  fullEncrypted: {
    id: 3333,
    /** Stored encrypted; decrypts to `"test"` with {@link TEST_PASSWORD}. */
    encryptedTitle: "U2FsdGVkX18wyEu7vCLMOGilOsG2cQdWY+kvi3b+AZE="
  }
} as const;

/** Number of seeded articles. */
export const ARTICLE_COUNT = 3;

/** `[id]` route segment used to create a brand-new item. */
export const NEW_ID = 0;

export const articleListPath = () => "/manage/articles";
export const articlePath = (id: number | string) => `/manage/articles/${id}`;
export const configPath = () => "/manage/config";
