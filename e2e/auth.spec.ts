import { test, expect } from "@playwright/test";
import {
  ADMIN_CREDENTIALS,
  AGENT_CREDENTIALS,
  submitLoginForm,
  loginAsAdmin,
  loginAsAgent,
  logout,
  expectAuthenticated,
  assertProtectedRedirect,
  getNavLink,
  setHistoryRedirectState,
} from "./helpers/auth";

test.describe("1. Unauthenticated Access & Route Protection", () => {
  test("visiting / redirects unauthenticated guest to /login", async ({ page }) => {
    await assertProtectedRedirect(page, "/");
    await expect(page.getByLabel(/email address/i)).toBeVisible();
    await expect(page.getByLabel(/^password/i)).toBeVisible();
  });

  test("visiting /users directly redirects unauthenticated guest to /login", async ({ page }) => {
    await assertProtectedRedirect(page, "/users");
  });

  test("visiting /tickets directly redirects unauthenticated guest to /login", async ({ page }) => {
    await assertProtectedRedirect(page, "/tickets");
  });
});

test.describe("2. Form Validation & Failed Logins", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("submitting empty form displays required field errors", async ({ page }) => {
    await submitLoginForm(page);

    await expect(page.getByText("Email is required")).toBeVisible();
    await expect(page.getByText("Password is required")).toBeVisible();
    await expect(page).toHaveURL("/login");
  });

  test("submitting malformed email displays email format validation error", async ({ page }) => {
    await submitLoginForm(page, {
      email: "not-a-valid-email",
      password: ADMIN_CREDENTIALS.password,
    });

    await expect(page.getByText("Please enter a valid email address")).toBeVisible();
    await expect(page).toHaveURL("/login");
  });

  test("submitting short password displays password length validation error", async ({ page }) => {
    await submitLoginForm(page, {
      email: AGENT_CREDENTIALS.email,
      password: "12345",
    });

    await expect(page.getByText("Password must be at least 6 characters")).toBeVisible();
    await expect(page).toHaveURL("/login");
  });

  test("submitting wrong credentials displays error alert and remains unauthenticated", async ({ page }) => {
    await submitLoginForm(page, {
      email: ADMIN_CREDENTIALS.email,
      password: "wrong-password-999",
    });

    // Verify error alert is displayed
    const alert = page.getByRole("alert");
    await expect(alert).toBeVisible();
    await expect(page.getByText(/sign in failed/i)).toBeVisible();

    // Verify user is not authenticated and stays on /login
    await expect(page).toHaveURL("/login");
  });
});

test.describe("3. Agent Authentication & RBAC", () => {
  test("agent login lands on dashboard with AGENT badge and restricted navigation", async ({ page }) => {
    await loginAsAgent(page);

    // Agent navigation must NOT show admin-only /users link
    const usersNavLink = getNavLink(page, "Users");
    await expect(usersNavLink).not.toBeAttached();

    // Direct navigation to /users must bounce agent back to /
    await page.goto("/users");
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  });
});

test.describe("4. Admin Authentication & RBAC", () => {
  test("admin login lands on dashboard, displays ADMIN badge, and can access /users", async ({ page }) => {
    await loginAsAdmin(page);

    // Header displays the /users navigation link
    const usersNavLink = getNavLink(page, "Users");
    await expect(usersNavLink).toBeVisible();

    // Admin clicks /users and views the Users management page
    await usersNavLink.click();
    await expect(page).toHaveURL("/users");
    await expect(page.getByRole("heading", { name: "Users", exact: true })).toBeVisible();
  });
});

test.describe("5. Open Redirect Defense & Redirection Logic", () => {
  test("redirects correctly to original protected route after authentication", async ({ page }) => {
    // Attempting to visit protected /tickets sends guest to /login with state
    await assertProtectedRedirect(page, "/tickets");

    // Complete login, redirecting to intended route
    await loginAsAdmin(page, { expectedPath: "/tickets" });

    // Post-login redirect goes to intended route (/tickets), not default (/)
    await expect(page.getByRole("heading", { name: /support ticket queue/i })).toBeVisible();
  });

  const maliciousRedirectCases = [
    {
      description: "protocol-relative open redirect (//evil.com)",
      target: "//evil.com",
      disallowedSubstring: "evil.com",
    },
    {
      description: "backslash-relative open redirect (/\\evil.com)",
      target: "/\\evil.com",
      disallowedSubstring: "evil.com",
    },
    {
      description: "absolute URL open redirect (https://attacker.com)",
      target: "https://attacker.com",
      disallowedSubstring: "attacker.com",
    },
  ];

  for (const { description, target, disallowedSubstring } of maliciousRedirectCases) {
    test(`sanitizes ${description} and defaults to /`, async ({ page }) => {
      await page.goto("/login");
      await setHistoryRedirectState(page, target);
      await loginAsAdmin(page);

      // Must safely fallback to / and not navigate to malicious target
      await expect(page).toHaveURL("/");
      await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
      expect(page.url()).not.toContain(disallowedSubstring);
    });
  }
});

test.describe("6. Session Persistence", () => {
  test("reloading the page preserves authentication state without bouncing to /login", async ({ page }) => {
    await loginAsAgent(page);

    // Reload the page
    await page.reload();

    // Session must persist: still on /, AGENT badge still visible, not redirected to /login
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
    await expectAuthenticated(page, "AGENT");
  });
});

test.describe("7. Sign Out Flow", () => {
  test("clicking Sign Out terminates session and blocks subsequent access to protected routes", async ({ page }) => {
    await loginAsAdmin(page);
    await logout(page);

    // Attempting to visit / immediately redirects back to /login
    await assertProtectedRedirect(page, "/");

    // Attempting to visit /users redirects back to /login
    await assertProtectedRedirect(page, "/users");
  });
});

test.describe("8. Backend API Authentication & Authorization Boundaries", () => {
  test("unauthenticated requests to protected endpoints return 401 Unauthorized", async ({ request }) => {
    const meRes = await request.get("/api/me");
    expect(meRes.status()).toBe(401);
    const meJson = await meRes.json();
    expect(meJson.error).toBe("Unauthorized");

    const adminRes = await request.get("/api/admin");
    expect(adminRes.status()).toBe(401);
    const adminJson = await adminRes.json();
    expect(adminJson.error).toBe("Unauthorized");

    const createUserRes = await request.post("/api/admin/users", {
      data: {
        email: "test@example.com",
        password: ADMIN_CREDENTIALS.password,
        name: "Test User",
      },
    });
    expect(createUserRes.status()).toBe(401);
    const createJson = await createUserRes.json();
    expect(createJson.error).toBe("Unauthorized");
  });

  test("agent session can access /api/me but receives 403 Forbidden for admin endpoints", async ({ page }) => {
    await loginAsAgent(page);

    // Agent request to /api/me succeeds
    const meRes = await page.request.get("/api/me");
    expect(meRes.status()).toBe(200);
    const meJson = await meRes.json();
    expect(meJson.user.email).toBe(AGENT_CREDENTIALS.email);
    expect(meJson.user.role).toBe("AGENT");

    // Agent request to /api/admin is forbidden
    const adminRes = await page.request.get("/api/admin");
    expect(adminRes.status()).toBe(403);
    const adminJson = await adminRes.json();
    expect(adminJson.error).toBe("Forbidden");

    // Agent request to POST /api/admin/users is forbidden
    const createUserRes = await page.request.post("/api/admin/users", {
      data: {
        email: "unauthorized-agent-create@example.com",
        password: AGENT_CREDENTIALS.password,
        name: "Unauthorized Create",
      },
    });
    expect(createUserRes.status()).toBe(403);
    const createJson = await createUserRes.json();
    expect(createJson.error).toBe("Forbidden");
  });

  test("admin session can access /api/admin and provision users via POST /api/admin/users", async ({ page }) => {
    await loginAsAdmin(page);

    // Admin request to /api/admin succeeds
    const adminRes = await page.request.get("/api/admin");
    expect(adminRes.status()).toBe(200);
    const adminJson = await adminRes.json();
    expect(adminJson.message).toBe("Admin access granted");
    expect(adminJson.user.role).toBe("ADMIN");

    // Admin creates a new agent user
    const uniqueEmail = `new-agent-${Date.now()}@example.com`;
    const createRes = await page.request.post("/api/admin/users", {
      data: {
        email: uniqueEmail,
        password: "SecurePassword123!",
        name: "Newly Provisioned Agent",
        role: "AGENT",
      },
    });
    expect(createRes.status()).toBe(201);
    const createJson = await createRes.json();
    expect(createJson.message).toBe("User created successfully");
    expect(createJson.user.email).toBe(uniqueEmail);
    expect(createJson.user.role).toBe("AGENT");

    // Admin receives 400 Bad Request if validation fails (e.g. short password)
    const badReqRes = await page.request.post("/api/admin/users", {
      data: {
        email: "invalid-payload@example.com",
        password: "short",
        name: "Bad",
      },
    });
    expect(badReqRes.status()).toBe(400);
    const badReqJson = await badReqRes.json();
    expect(badReqJson.error).toBe("Bad Request");
  });
});
