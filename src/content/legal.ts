export const LEGAL_LAST_UPDATED = "October 2, 2026";

export type LegalSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export const privacySections: LegalSection[] = [
  {
    id: "overview",
    title: "Overview",
    paragraphs: [
      "Mise (“we”, “us”) is an adaptive meal-planning and cooking companion operated as a personal project. This Privacy Policy describes how we collect, use, and share information when you use the Mise web app at cookwithmise.vercel.app and related services (the “Service”).",
      "This document reflects the MVP product as shipped: weekly plans, shopping lists, Kitchen Mode, and Sodie (AI coaching and proposals). It is not legal advice.",
    ],
  },
  {
    id: "collect",
    title: "Information we collect",
    paragraphs: ["We collect and store the following when you use the Service:"],
    bullets: [
      "Account data: name, email, and credentials you provide at registration.",
      "Cooking preferences and pantry items you enter in Settings.",
      "Weekly meal plans, plan entries, servings, prep timelines, shopping lists, and check-off state (including offline queue data synced when you reconnect).",
      "Recipe progress and feedback (including difficulty feedback such as “too hard”).",
      "Personal recipes and revisions created or approved through Sodie proposals.",
      "Sodie conversations: thread metadata, messages, and action proposals. Some chats are marked private or temporary; private settings chats avoid sending full profile dumps to the model.",
      "Kitchen Mode session data stored on your device (timers, step progress) and optional context sent to Sodie while you cook (e.g., current step, active timers).",
      "Analytics Tips interactions when you opt in on the Analytics page.",
      "Technical data needed to operate the Service (e.g., authentication tokens in browser storage, request logs on the server).",
    ],
  },
  {
    id: "use",
    title: "How we use information",
    paragraphs: [
      "We use your information to authenticate you, generate and verify weekly plans, build shopping lists, power Sodie coaching and proposals, show your history, and improve reliability of the Service.",
      "We do not sell your personal information. We do not use your data for third-party advertising.",
    ],
  },
  {
    id: "ai",
    title: "AI and third-party processors",
    paragraphs: [
      "Sodie and plan generation use large language models (currently via OpenAI APIs configured on the backend). Prompts may include recipe text, your preferences, pantry items, plan context, and chat history relevant to the page you are on.",
      "Content may be moderated using OpenAI moderation models before or during processing.",
      "Recipe hero images may come from Pexels; we store image URLs and photographer attribution when available.",
      "Hosting, database, and deployment providers process data on our behalf to run the Service. They are used only to provide infrastructure, not for their own marketing.",
    ],
  },
  {
    id: "local",
    title: "On-device features",
    paragraphs: [
      "Kitchen Mode read-aloud uses your browser’s speech synthesis (speechSynthesis). Text is processed on your device; we do not send read-aloud audio to our servers.",
      "Kitchen timers alert while the app is open in the foreground. Mise does not send push notifications to a locked phone or native OS notification channels in the current MVP.",
    ],
  },
  {
    id: "retention",
    title: "Retention and deletion",
    paragraphs: [
      "We retain account and app data while your account is active.",
      "You can delete your account in Settings → Account. Deletion removes your user record and associated app data handled by our delete-account API, subject to backup and log retention on infrastructure providers.",
      "You can start a new Sodie chat or use private/temporary session modes where offered; durable chat history remains until deleted with your account or cleared by operators during maintenance.",
    ],
  },
  {
    id: "rights",
    title: "Your choices",
    paragraphs: [
      "You can update preferences, pantry, and account details in Settings. You can opt in or out of Analytics Tips on the Analytics page.",
      "To request access, correction, or deletion beyond in-app controls, contact Mise by opening an issue on the public GitHub repository: https://github.com/meleongg/mise-frontend. Include enough detail for us to identify your request (do not post passwords or other secrets in the issue).",
    ],
  },
  {
    id: "contact",
    title: "Contact",
    paragraphs: [
      "Questions about this Privacy Policy or your data: open an issue at https://github.com/meleongg/mise-frontend.",
    ],
  },
  {
    id: "security",
    title: "Security",
    paragraphs: [
      "We use industry-standard practices such as HTTPS, password hashing on the server, and authenticated API access. No method of transmission or storage is completely secure.",
    ],
  },
  {
    id: "children",
    title: "Children",
    paragraphs: [
      "The Service is not directed at children under 13. We do not knowingly collect personal information from children under 13.",
    ],
  },
  {
    id: "changes",
    title: "Changes",
    paragraphs: [
      "We may update this policy as the product changes. We will revise the “Last updated” date at the top. Continued use after changes means you accept the updated policy.",
    ],
  },
];

export const termsSections: LegalSection[] = [
  {
    id: "acceptance",
    title: "Agreement",
    paragraphs: [
      "By creating an account or using Mise, you agree to these Terms of Service and our Privacy Policy. If you do not agree, do not use the Service.",
    ],
  },
  {
    id: "service",
    title: "The Service",
    paragraphs: [
      "Mise provides adaptive weekly meal planning, recipe browsing, shopping lists, Kitchen Mode, and Sodie AI assistance. Features may change; we may add, modify, or remove functionality during the MVP period.",
      "Mise is a cooking companion, not a medical, nutrition, or allergy emergency service. Always verify ingredients, allergens, and doneness yourself. AI-generated text and plans can be wrong.",
    ],
  },
  {
    id: "account",
    title: "Your account",
    paragraphs: [
      "You are responsible for your login credentials and activity under your account. Provide accurate registration information.",
      "You may delete your account at any time in Settings → Account.",
    ],
  },
  {
    id: "acceptable",
    title: "Acceptable use",
    paragraphs: ["You agree not to:"],
    bullets: [
      "Use the Service for unlawful purposes or to harass others.",
      "Attempt to break, scrape, or overload the Service or bypass authentication.",
      "Submit content that violates others’ rights or contains malware.",
      "Misrepresent AI outputs as professional dietary or medical advice.",
    ],
  },
  {
    id: "content",
    title: "Recipes, images, and your content",
    paragraphs: [
      "Catalog recipes and images are provided for personal home cooking through the Service. Pexels images remain subject to Pexels licensing; attribution is shown when we have photographer metadata.",
      "Personal recipes and chat content you create remain yours; you grant us a limited license to store and process them to operate the Service (including sending relevant portions to AI providers as described in the Privacy Policy).",
    ],
  },
  {
    id: "ai-terms",
    title: "AI features",
    paragraphs: [
      "Sodie proposals (edits, swaps, tips) require your review and approval before they change your recipes or plan where applicable.",
      "We do not guarantee that AI responses are accurate, complete, or safe for your kitchen. Use judgment before following suggestions.",
    ],
  },
  {
    id: "availability",
    title: "Availability",
    paragraphs: [
      "The Service is provided “as is” without warranties of uninterrupted availability. Maintenance, model outages, or third-party failures may affect planning and chat.",
    ],
  },
  {
    id: "liability",
    title: "Limitation of liability",
    paragraphs: [
      "To the fullest extent permitted by law, Mise and its operator are not liable for indirect, incidental, or consequential damages, or for harm arising from reliance on recipes, plans, or AI output. Our total liability for any claim relating to the Service is limited to the amount you paid us in the twelve months before the claim (typically zero for the free MVP).",
    ],
  },
  {
    id: "termination",
    title: "Termination",
    paragraphs: [
      "We may suspend or terminate access if you violate these Terms or if we discontinue the Service. You may stop using the Service at any time by deleting your account.",
    ],
  },
  {
    id: "changes-terms",
    title: "Changes",
    paragraphs: [
      "We may update these Terms. The “Last updated” date will change when we do. Continued use after updates constitutes acceptance.",
    ],
  },
  {
    id: "contact-terms",
    title: "Contact",
    paragraphs: [
      "Questions about these Terms: open an issue on the Mise GitHub repository at https://github.com/meleongg/mise-frontend. Do not post passwords or other secrets in issues.",
    ],
  },
];
