import { randomBytes } from "node:crypto";
import { createAdminUser, getAdminUserByEmail } from "../server/db";

async function main() {
  const email = "dashboard.test.admin@messaging-gateway.local";
  const username = "dashboard-test-admin";
  const password = randomBytes(18).toString("base64url");

  const existing = await getAdminUserByEmail(email);
  if (existing) {
    console.log(JSON.stringify({
      created: false,
      email,
      username: existing.username,
      reason: "already-exists",
      password: null,
    }));
    return;
  }

  const result = await createAdminUser({
    username,
    email,
    password,
    role: "admin",
  });

  console.log(JSON.stringify({
    created: true,
    id: result.id,
    email,
    username,
    password,
  }));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
