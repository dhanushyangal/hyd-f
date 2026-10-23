import { PRICING, SLOT_PRICING } from "@/lib/pricing";

export type FaqItem = {
  question: string;
  answer: string;
};

/** Canonical FAQ copy. Rendered on /faq (SSR) and emitted as FAQPage JSON-LD. */
export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Who is Hydrilla designed for?",
    answer:
      "Hydrilla is built for creators, studios, and teams who need fast generation of production-ready 3D assets for games, film, architecture, and digital products.",
  },
  {
    question: "How fast is generation?",
    answer:
      "Hydrilla can generate structured 3D assets in minutes, so teams spend less time on early modeling and concept asset production. Final hero quality still needs an artist pass.",
  },
  {
    question: "Is there a free plan available?",
    answer:
      `Yes. Free is $${PRICING.free.monthly}/month with ${PRICING.free.credits.toLocaleString("en-US")} credits and GLB export. No card required.`,
  },
  {
    question: "Can I change or cancel my plan anytime?",
    answer:
      "Yes. All paid plans start with a 14-day free trial and are billed monthly afterward. Manage changes and cancellation anytime from account settings.",
  },
  {
    question: "How many 3D models can I generate each month?",
    answer:
      "Free covers 3 model generations each month (100 credits). Starter and Hourly include 30 model generations each month (900 credits). Pro and Hourly Pro include 100 model generations per month (3,000 credits).",
  },
  {
    question: "What are Hourly and Hourly Pro?",
    answer:
      `Hourly includes 30 monthly model generations and premium plugins at $${SLOT_PRICING.slot.monthly}/month with a 1-hour daily generation window. Hourly Pro includes 100 monthly model generations and the full plugin suite at $${SLOT_PRICING.slot_pro.monthly}/month with a 2-hour daily window. Both start with a 14-day free trial.`,
  },
  {
    question: "Is Hydrilla difficult to learn?",
    answer:
      "No. If you already work in Unity, Unreal, or Blender, you generate, preview, and export into the same formats you already import.",
  },
  {
    question: "What inputs does Hydrilla support?",
    answer:
      "Text prompts and reference images.",
  },
  {
    question: "What is BlueFox 3D?",
    answer:
      "BlueFox 3D is the model family built by Hawan Research Labs. BlueFox 1 is the current model that runs generation inside Hydrilla.",
  },
  {
    question: "What is Hawan Research Labs?",
    answer:
      "Hawan Research Labs is the research lab that builds BlueFox. Hydrilla is the product you use to run it.",
  },
  {
    question: "Can Hydrilla integrate with my pipeline?",
    answer:
      "Yes. Export GLB, FBX, OBJ, and USDZ. Pro plans include API access for production workflows. See https://hydrilla.ai/api and https://hydrilla.ai/docs.",
  },
  {
    question: "Do I own what I generate?",
    answer:
      "Yes. Hydrilla’s terms grant personal and commercial use of generated content. Read the Terms for the full license.",
  },
  {
    question: "What formats does Hydrilla export?",
    answer:
      "GLB, FBX, OBJ, and USDZ. Free exports GLB. Starter, Pro, Hourly, and Hourly Pro export all four.",
  },
  {
    question: "Which engines and tools?",
    answer:
      "Native Blender add-on and a local Bridge, plus Unity, Unreal, Godot, MCP, and REST API. See https://hydrilla.ai/integrations.",
  },
];

export function faqByQuestions(questions: string[]): FaqItem[] {
  return questions
    .map((question) => FAQ_ITEMS.find((item) => item.question === question))
    .filter((item): item is FaqItem => Boolean(item));
}
