export type Locale = "en";

type Dict = Record<string, string>;

export const dictionaries: Record<Locale, Dict> = {
  en: {
    "nav.hosting": "Hosting",
    "nav.infrastructure": "Infrastructure",
    "nav.pricing": "Pricing",
    "nav.features": "Features",
    "nav.developers": "Developers",
    "nav.support": "Support",
    "nav.login": "Login",
    "nav.deploy": "Deploy Now",
    "nav.search": "Search",
    "footer.tagline":
      "Modern infrastructure for Discord bots, Node.js, and Python. Bare-metal performance with a developer-grade dashboard.",
    "footer.product": "Product",
    "footer.developers": "Developers",
    "footer.company": "Company",
    "footer.legal": "Legal",
    "footer.rights": "© 2026 Ptero Infrastructure. All rights reserved.",
    "home.headlineA": "Ship Discord bots & apps on",
    "home.headlineAccent": "bare-metal",
    "home.headlineB": "in seconds",
    "home.sub":
      "Deploy Discord bots, Node.js, and Python apps on Ryzen infrastructure. Git push, watch it go live, and monitor it in realtime — no DevOps required.",
    "home.deploy": "Deploy Now",
    "home.viewPricing": "View Pricing",
    "auth.signinTitle": "Sign in to Ptero",
    "auth.signinSub": "Welcome back. Pick up right where you left off.",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.forgot": "Forgot password?",
    "auth.keep": "Keep me signed in",
    "auth.signin": "Sign in",
    "auth.signingIn": "Signing in…",
    "auth.orContinue": "or continue with",
    "auth.newToPtero": "New to Ptero?",
    "auth.createAccount": "Create an account",
    "auth.createTitle": "Create your account",
    "auth.createSub": "Deploy your first bot in under 60 seconds.",
    "auth.haveAccount": "Already have an account?",
    "auth.signinLink": "Sign in",
  },
};
