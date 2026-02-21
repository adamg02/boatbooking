// RowBook locale configuration
// Supports en-GB (UK), en-US (US), en-AU (Australia), en-NZ (New Zealand)

export type Locale = "en-GB" | "en-US" | "en-AU" | "en-NZ";

export const DEFAULT_LOCALE: Locale = "en-GB";

export interface LocaleDict {
  locale: Locale;
  /** BCP 47 lang tag used on <html> */
  htmlLang: string;
  /** Intl currency code */
  currency: string;
  /** Currency symbol for display */
  currencySymbol: string;
  /** Intl locale string used for number/date formatting */
  dateLocale: string;

  // ── Homepage ──────────────────────────────────────────────────────
  homepage: {
    badge: string;
    headline1: string;
    headline2: string;
    heroParagraph: string;
    featureCalendarTitle: string;
    featureCalendarBody: string;
    featureGroupTitle: string;
    featureGroupBody: string;
    featureMobileTitle: string;
    featureMobileBody: string;
    featureAuthTitle: string;
    featureAuthBody: string;
    featureDailyTitle: string;
    featureDailyBody: string;
    featureMultiTitle: string;
    featureMultiBody: string;
    featuresHeading: string;
    featuresParagraph: string;
    howItWorksHeading: string;
    howItWorksParagraph: string;
    step1Title: string;
    step1Body: string;
    step2Title: string;
    step2Body: string;
    step3Title: string;
    step3Body: string;
    ctaHeading: string;
    ctaParagraph: string;
    footerText: string;
  };

  // ── Subscription / pricing ────────────────────────────────────────
  subscription: {
    monthlyDisplayPrice: string;   // e.g. "£12.99" or "$14.99"
    monthlyLabel: string;          // e.g. "£12.99 / month"
    yearlyDisplayPrice: string;    // e.g. "£9.99" or "$11.99"
    yearlyBilledAs: string;        // e.g. "Billed £119.88 / year"
    yearlyAdminLabel: string;      // e.g. "£9.99 / month (annual)"
    yearlyMonthlyLabel: string;    // e.g. "£12.99 / month"
    /** Raw amounts in lowest denomination (pence / cents) */
    monthlyAmount: number;
    yearlyAmount: number;
  };

  // ── Miscellaneous UI ─────────────────────────────────────────────
  ui: {
    signingIn: string;
    settingUp: string;
    welcomeTitle: string;
    welcomeBody: string;
  };
}

const enGB: LocaleDict = {
  locale: "en-GB",
  htmlLang: "en-GB",
  currency: "GBP",
  currencySymbol: "£",
  dateLocale: "en-GB",

  homepage: {
    badge: "Built for rowing clubs",
    headline1: "Boat booking,",
    headline2: "finally simple.",
    heroParagraph:
      "RowBook gives your rowing club a clean, mobile-friendly way to manage boat reservations. No spreadsheets. No group chats. Just book and row.",
    featureCalendarTitle: "Calendar-based booking",
    featureCalendarBody:
      "Members pick a date and reserve a 2-hour slot or a full day – no spreadsheets, no phone calls, no double-bookings.",
    featureGroupTitle: "Group-based access control",
    featureGroupBody:
      "Restrict specific boats to specific squads or weight classes. Admins assign members to groups and the app handles the rest automatically.",
    featureMobileTitle: "Mobile-first design",
    featureMobileBody:
      "Optimised for phones so members can book on the way to the boathouse. Works just as well on tablet and desktop.",
    featureAuthTitle: "Secure social sign-in",
    featureAuthBody:
      "Members log in with their existing Google, Microsoft, or Facebook account – no passwords to forget or manage.",
    featureDailyTitle: "Daily bookings view",
    featureDailyBody:
      "See every reservation for any day at a glance. Admins can cancel bookings; members can cancel their own. Perfect for coxes and coaches.",
    featureMultiTitle: "Multi-club support",
    featureMultiBody:
      "Each club gets its own isolated workspace. Share an invite code with your members and everyone's data stays completely separate.",
    featuresHeading: "Everything your club needs",
    featuresParagraph:
      "A focused set of features that solves the real problems rowing clubs face when managing shared equipment.",
    howItWorksHeading: "Up and running in minutes",
    howItWorksParagraph: "No installation, no IT department, no credit card required.",
    step1Title: "Create your club",
    step1Body:
      "Sign in and set up your club in seconds. You'll get a unique join code to share with your squad.",
    step2Title: "Add your boats",
    step2Body:
      "Enter each boat with its name, type, and weight class. Assign boats to groups to control who can book what.",
    step3Title: "Members join & book",
    step3Body:
      "Members sign in with Google, Microsoft, or Facebook, enter the join code, and start booking straight away.",
    ctaHeading: "Ready to simplify your bookings?",
    ctaParagraph:
      "Sign in with your Google, Microsoft, or Facebook account and set up your club in under 5 minutes.",
    footerText: "Built for rowing clubs.",
  },

  subscription: {
    monthlyDisplayPrice: "£12.99",
    monthlyLabel: "£12.99 / month",
    yearlyDisplayPrice: "£9.99",
    yearlyBilledAs: "Billed £119.88 / year",
    yearlyAdminLabel: "£9.99 / month (annual)",
    yearlyMonthlyLabel: "£12.99 / month",
    monthlyAmount: 1299,
    yearlyAmount: 11988,
  },

  ui: {
    signingIn: "Signing in...",
    settingUp: "Setting up your account…",
    welcomeTitle: "Welcome to RowBook!",
    welcomeBody: "Setting up your account…",
  },
};

const enUS: LocaleDict = {
  locale: "en-US",
  htmlLang: "en-US",
  currency: "USD",
  currencySymbol: "$",
  dateLocale: "en-US",

  homepage: {
    badge: "Built for rowing clubs",
    headline1: "Boat booking,",
    headline2: "finally simple.",
    heroParagraph:
      "RowBook gives your rowing club a clean, mobile-friendly way to manage boat reservations. No spreadsheets. No group chats. Just book and row.",
    featureCalendarTitle: "Calendar-based booking",
    featureCalendarBody:
      "Members pick a date and reserve a 2-hour slot or a full day – no spreadsheets, no phone calls, no double-bookings.",
    featureGroupTitle: "Group-based access control",
    featureGroupBody:
      "Restrict specific boats to specific squads or weight classes. Admins assign members to groups and the app handles the rest automatically.",
    featureMobileTitle: "Mobile-first design",
    featureMobileBody:
      "Optimized for phones so members can book on the way to the boathouse. Works just as well on tablet and desktop.",
    featureAuthTitle: "Secure social sign-in",
    featureAuthBody:
      "Members log in with their existing Google, Microsoft, or Facebook account – no passwords to forget or manage.",
    featureDailyTitle: "Daily bookings view",
    featureDailyBody:
      "See every reservation for any day at a glance. Admins can cancel bookings; members can cancel their own. Perfect for coxswains and coaches.",
    featureMultiTitle: "Multi-club support",
    featureMultiBody:
      "Each club gets its own isolated workspace. Share an invite code with your members and everyone's data stays completely separate.",
    featuresHeading: "Everything your club needs",
    featuresParagraph:
      "A focused set of features that solves the real problems rowing clubs face when managing shared equipment.",
    howItWorksHeading: "Up and running in minutes",
    howItWorksParagraph: "No installation, no IT department, no credit card required.",
    step1Title: "Create your club",
    step1Body:
      "Sign in and set up your club in seconds. You'll get a unique join code to share with your squad.",
    step2Title: "Add your boats",
    step2Body:
      "Enter each boat with its name, type, and weight class. Assign boats to groups to control who can book what.",
    step3Title: "Members join & book",
    step3Body:
      "Members sign in with Google, Microsoft, or Facebook, enter the join code, and start booking right away.",
    ctaHeading: "Ready to simplify your bookings?",
    ctaParagraph:
      "Sign in with your Google, Microsoft, or Facebook account and set up your club in under 5 minutes.",
    footerText: "Built for rowing clubs.",
  },

  subscription: {
    monthlyDisplayPrice: "$14.99",
    monthlyLabel: "$14.99 / month",
    yearlyDisplayPrice: "$11.99",
    yearlyBilledAs: "Billed $143.88 / year",
    yearlyAdminLabel: "$11.99 / month (annual)",
    yearlyMonthlyLabel: "$14.99 / month",
    monthlyAmount: 1499,
    yearlyAmount: 14388,
  },

  ui: {
    signingIn: "Signing in...",
    settingUp: "Setting up your account…",
    welcomeTitle: "Welcome to RowBook!",
    welcomeBody: "Setting up your account…",
  },
};

const enAU: LocaleDict = {
  locale: "en-AU",
  htmlLang: "en-AU",
  currency: "AUD",
  currencySymbol: "A$",
  dateLocale: "en-AU",

  homepage: {
    badge: "Built for rowing clubs",
    headline1: "Boat booking,",
    headline2: "finally simple.",
    heroParagraph:
      "RowBook gives your rowing club a clean, mobile-friendly way to manage boat reservations. No spreadsheets. No group chats. Just book and row.",
    featureCalendarTitle: "Calendar-based booking",
    featureCalendarBody:
      "Members pick a date and reserve a 2-hour slot or a full day – no spreadsheets, no phone calls, no double-bookings.",
    featureGroupTitle: "Group-based access control",
    featureGroupBody:
      "Restrict specific boats to specific squads or weight classes. Admins assign members to groups and the app handles the rest automatically.",
    featureMobileTitle: "Mobile-first design",
    featureMobileBody:
      "Optimised for phones so members can book on the way to the boathouse. Works just as well on tablet and desktop.",
    featureAuthTitle: "Secure social sign-in",
    featureAuthBody:
      "Members log in with their existing Google, Microsoft, or Facebook account – no passwords to forget or manage.",
    featureDailyTitle: "Daily bookings view",
    featureDailyBody:
      "See every reservation for any day at a glance. Admins can cancel bookings; members can cancel their own. Perfect for coxes and coaches.",
    featureMultiTitle: "Multi-club support",
    featureMultiBody:
      "Each club gets its own isolated workspace. Share an invite code with your members and everyone's data stays completely separate.",
    featuresHeading: "Everything your club needs",
    featuresParagraph:
      "A focused set of features that solves the real problems rowing clubs face when managing shared equipment.",
    howItWorksHeading: "Up and running in minutes",
    howItWorksParagraph: "No installation, no IT department, no credit card required.",
    step1Title: "Create your club",
    step1Body:
      "Sign in and set up your club in seconds. You'll get a unique join code to share with your squad.",
    step2Title: "Add your boats",
    step2Body:
      "Enter each boat with its name, type, and weight class. Assign boats to groups to control who can book what.",
    step3Title: "Members join & book",
    step3Body:
      "Members sign in with Google, Microsoft, or Facebook, enter the join code, and start booking straight away.",
    ctaHeading: "Ready to simplify your bookings?",
    ctaParagraph:
      "Sign in with your Google, Microsoft, or Facebook account and set up your club in under 5 minutes.",
    footerText: "Built for rowing clubs.",
  },

  subscription: {
    monthlyDisplayPrice: "A$19.99",
    monthlyLabel: "A$19.99 / month",
    yearlyDisplayPrice: "A$14.99",
    yearlyBilledAs: "Billed A$179.88 / year",
    yearlyAdminLabel: "A$14.99 / month (annual)",
    yearlyMonthlyLabel: "A$19.99 / month",
    monthlyAmount: 1999,
    yearlyAmount: 17988,
  },

  ui: {
    signingIn: "Signing in...",
    settingUp: "Setting up your account…",
    welcomeTitle: "Welcome to RowBook!",
    welcomeBody: "Setting up your account…",
  },
};

const enNZ: LocaleDict = {
  locale: "en-NZ",
  htmlLang: "en-NZ",
  currency: "NZD",
  currencySymbol: "NZ$",
  dateLocale: "en-NZ",

  homepage: {
    badge: "Built for rowing clubs",
    headline1: "Boat booking,",
    headline2: "finally simple.",
    heroParagraph:
      "RowBook gives your rowing club a clean, mobile-friendly way to manage boat reservations. No spreadsheets. No group chats. Just book and row.",
    featureCalendarTitle: "Calendar-based booking",
    featureCalendarBody:
      "Members pick a date and reserve a 2-hour slot or a full day – no spreadsheets, no phone calls, no double-bookings.",
    featureGroupTitle: "Group-based access control",
    featureGroupBody:
      "Restrict specific boats to specific squads or weight classes. Admins assign members to groups and the app handles the rest automatically.",
    featureMobileTitle: "Mobile-first design",
    featureMobileBody:
      "Optimised for phones so members can book on the way to the boathouse. Works just as well on tablet and desktop.",
    featureAuthTitle: "Secure social sign-in",
    featureAuthBody:
      "Members log in with their existing Google, Microsoft, or Facebook account – no passwords to forget or manage.",
    featureDailyTitle: "Daily bookings view",
    featureDailyBody:
      "See every reservation for any day at a glance. Admins can cancel bookings; members can cancel their own. Perfect for coxes and coaches.",
    featureMultiTitle: "Multi-club support",
    featureMultiBody:
      "Each club gets its own isolated workspace. Share an invite code with your members and everyone's data stays completely separate.",
    featuresHeading: "Everything your club needs",
    featuresParagraph:
      "A focused set of features that solves the real problems rowing clubs face when managing shared equipment.",
    howItWorksHeading: "Up and running in minutes",
    howItWorksParagraph: "No installation, no IT department, no credit card required.",
    step1Title: "Create your club",
    step1Body:
      "Sign in and set up your club in seconds. You'll get a unique join code to share with your squad.",
    step2Title: "Add your boats",
    step2Body:
      "Enter each boat with its name, type, and weight class. Assign boats to groups to control who can book what.",
    step3Title: "Members join & book",
    step3Body:
      "Members sign in with Google, Microsoft, or Facebook, enter the join code, and start booking straight away.",
    ctaHeading: "Ready to simplify your bookings?",
    ctaParagraph:
      "Sign in with your Google, Microsoft, or Facebook account and set up your club in under 5 minutes.",
    footerText: "Built for rowing clubs.",
  },

  subscription: {
    monthlyDisplayPrice: "NZ$21.99",
    monthlyLabel: "NZ$21.99 / month",
    yearlyDisplayPrice: "NZ$16.99",
    yearlyBilledAs: "Billed NZ$203.88 / year",
    yearlyAdminLabel: "NZ$16.99 / month (annual)",
    yearlyMonthlyLabel: "NZ$21.99 / month",
    monthlyAmount: 2199,
    yearlyAmount: 20388,
  },

  ui: {
    signingIn: "Signing in...",
    settingUp: "Setting up your account…",
    welcomeTitle: "Welcome to RowBook!",
    welcomeBody: "Setting up your account…",
  },
};

export const locales: Record<Locale, LocaleDict> = {
  "en-GB": enGB,
  "en-US": enUS,
  "en-AU": enAU,
  "en-NZ": enNZ,
};

/** Resolve a locale string from an Accept-Language header value */
export function resolveLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  // Normalise and split by comma
  const tags = acceptLanguage
    .toLowerCase()
    .split(",")
    .map((t) => t.split(";")[0].trim());

  for (const tag of tags) {
    if (tag === "en-us" || tag.startsWith("en-us")) return "en-US";
    if (tag === "en-gb" || tag.startsWith("en-gb")) return "en-GB";
    if (tag === "en-au" || tag.startsWith("en-au")) return "en-AU";
    if (tag === "en-nz" || tag.startsWith("en-nz")) return "en-NZ";
    // Generic "en" defaults – US if clearly American, GB otherwise
    if (tag === "en") {
      // No region specified – can't distinguish, keep scanning
      continue;
    }
  }

  // If "en" appears without a region, try to detect American English from
  // other tags in the header (e.g. es-US, fr-CA are not helpful; just default to en-GB)
  return DEFAULT_LOCALE;
}

/** Get the dictionary for a locale, falling back to en-GB */
export function getDict(locale: Locale | string | undefined): LocaleDict {
  if (locale && locale in locales) return locales[locale as Locale];
  return locales["en-GB"];
}

export const LOCALE_COOKIE = "rowbook-locale";
