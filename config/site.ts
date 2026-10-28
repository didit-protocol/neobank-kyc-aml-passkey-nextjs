export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Alder",
  description: "A fictional neobank running Didit end to end: a passkey sign-up, KYC and AML before the IBAN, a 5,000 EUR transfer to a new payee confirmed with a passkey and released by a selfie, and an account takeover blocked at sign-in.",
  /** This app's public URL. Callbacks and redirects are built from it. */
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, ""),
  links: {
    console: "https://business.didit.me",
    docs: "https://docs.didit.me",
    website: "https://didit.me",
  },
};
