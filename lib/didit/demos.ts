/**
 * The demo definition: brand, workflows (ids come from the environment, see
 * `npm run setup`), the rules the demo enforces and its copy. The Demo bar,
 * the Didit live layer and the route handlers read it from here.
 *
 * No `@/` imports: the setup script loads the policy that reads this file
 * straight from Node.
 */

import { defineDemo, workflowId } from "./config.ts";

export const alder = defineDemo({
  id: "alder",
  route: "/",
  industry: "Fintech",
  brand: { name: "Alder", initial: "A", mark: "#0F3D2E" },
  vendorPrefix: "alder-",
  workflows: {
    onboarding: workflowId("DIDIT_WORKFLOW_ONBOARDING"),
    stepUp: workflowId("DIDIT_WORKFLOW_STEP_UP"),
  },
  rules: {
    kycBeforePayments: "No payments before an approved KYC",
    newPayee: "5,000 EUR or more to a new payee needs a selfie step-up",
    takeover: "A sign-in without the passkey is blocked",
  },
  copy: {
    tagline: "A neobank",
    story:
      "A passkey sign-up, KYC and AML before the IBAN, a 5,000 EUR transfer to a new payee confirmed with a selfie, and an account takeover blocked at sign-in.",
  },
});

export const DEMOS = [alder];
