import { expect, type Locator, type Page } from "@playwright/test";

export interface UserCredentials {
  email: string;
  password: string;
}

export const ADMIN_CREDENTIALS: UserCredentials = {
  email: process.env.ADMIN_EMAIL || "admin@example.com",
  password: process.env.ADMIN_PASSWORD || "password123",
};

export const AGENT_CREDENTIALS: UserCredentials = {
  email: process.env.AGENT_EMAIL || "agent@example.com",
  password: process.env.AGENT_PASSWORD || "password123",
};

export interface LoginOptions {
  expectedPath?: string | RegExp;
  verifyAuth?: boolean;
}

/**
 * Returns the locator for the main navigation header.
 */
export function getNavigationHeader(page: Page): Locator {
  return page.locator("header");
}

/**
 * Returns a navigation link within the navigation header by its accessible name.
 */
export function getNavLink(page: Page, name: string | RegExp): Locator {
  return getNavigationHeader(page).getByRole("link", { name });
}

/**
 * Fills in login form fields (if provided) and clicks Sign In without waiting for navigation.
 * Useful for testing validation states and failed authentication attempts.
 */
export async function submitLoginForm(
  page: Page,
  credentials?: { email?: string; password?: string }
): Promise<void> {
  if (credentials?.email !== undefined) {
    await page.getByLabel(/email address/i).fill(credentials.email);
  }
  if (credentials?.password !== undefined) {
    await page.getByLabel(/^password/i).fill(credentials.password);
  }
  await page.getByRole("button", { name: /sign in/i }).click();
}

/**
 * Fills in the login form, clicks Sign In, and waits for successful navigation and session initialization.
 * If the browser is not already on /login, it navigates there first.
 */
export async function login(
  page: Page,
  credentials: UserCredentials,
  options?: LoginOptions
): Promise<void> {
  const currentUrl = page.url();
  if (!currentUrl.includes("/login")) {
    await page.goto("/login");
  }

  await submitLoginForm(page, credentials);

  if (options?.expectedPath) {
    await expect(page).toHaveURL(options.expectedPath);
  } else {
    // Wait for redirect to default authenticated route (/)
    await expect(page).toHaveURL("/");
    // Ensure dashboard header or authenticated greeting is visible
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  }
}

/**
 * Convenience helper to log in using standard ADMIN credentials.
 * Automatically verifies authentication and the ADMIN role badge by default.
 */
export async function loginAsAdmin(page: Page, options?: LoginOptions): Promise<void> {
  await login(page, ADMIN_CREDENTIALS, options);
  if (options?.verifyAuth ?? true) {
    await expectAuthenticated(page, "ADMIN");
  }
}

/**
 * Convenience helper to log in using standard AGENT credentials.
 * Automatically verifies authentication and the AGENT role badge by default.
 */
export async function loginAsAgent(page: Page, options?: LoginOptions): Promise<void> {
  await login(page, AGENT_CREDENTIALS, options);
  if (options?.verifyAuth ?? true) {
    await expectAuthenticated(page, "AGENT");
  }
}

/**
 * Signs out the currently authenticated user via the header Sign Out button
 * and asserts redirection to the /login page.
 */
export async function logout(page: Page): Promise<void> {
  const signOutBtn = getNavigationHeader(page).getByRole("button", { name: /sign out/i });
  await expect(signOutBtn).toBeVisible();
  await signOutBtn.click();

  await expectUnauthenticated(page);
}

/**
 * Asserts that the user is authenticated in the UI, checking the header elements
 * and optionally verifying the exact role badge ("ADMIN" or "AGENT").
 */
export async function expectAuthenticated(page: Page, role?: "ADMIN" | "AGENT"): Promise<void> {
  const header = getNavigationHeader(page);
  if (role) {
    await expect(header.getByText(role, { exact: true })).toBeVisible();
  }
  const signOutBtn = header.getByRole("button", { name: /sign out/i });
  await expect(signOutBtn).toBeVisible();
}

/**
 * Asserts that the user is unauthenticated and redirected to the login form.
 */
export async function expectUnauthenticated(page: Page): Promise<void> {
  await expect(page).toHaveURL("/login");
  await expect(page.getByText("Sign in to Helper AI")).toBeVisible();
}

/**
 * Asserts that visiting a protected path redirects unauthenticated users to /login.
 */
export async function assertProtectedRedirect(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await expectUnauthenticated(page);
}

/**
 * Replaces window history state to simulate a router redirect state from an intended path.
 */
export async function setHistoryRedirectState(page: Page, pathname: string): Promise<void> {
  await page.evaluate((fromPath) => {
    window.history.replaceState({ ...window.history.state, usr: { from: { pathname: fromPath } } }, "");
  }, pathname);
}
