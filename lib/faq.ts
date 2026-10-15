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
      "Yes. Hydrilla plans are monthly. Manage changes and cancellation from account settings. Switching to or from a Slot plan requires cancelling the current paid plan first.",
  },
  {
    question: "How many 3D models can I generate each month?",
    answer:
      "At default quality, Free covers about 2 models from text or 3 from uploaded images. Starter and Slot cover about 20 from text or 30 from images. Pro and Slot Pro cover about 66 from text or 100 from images. Actual usage depends on the generation steps and quality you choose.",
  },
  {
    question: "What are Slot and Slot Pro?",
    answer:
      `Slot uses the Starter credit budget at $${SLOT_PRICING.slot.monthly}/month for one generation hour a day. Slot Pro uses the Pro credit budget at $${SLOT_PRICING.slot_pro.monthly}/month for two hours a day. You choose the window in Billing and see it in local time.`,
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
      "GLB, FBX, OBJ, and USDZ. Free exports GLB. Starter, Pro, Slot, and Slot Pro export all four.",
  },
  {
    question: "Which engines and tools?",
    answer:
      "Native plugins and a local Bridge for Blender, Maya, 3ds Max, Unity, Unreal, and Godot, plus an MCP server and REST API. See https://hydrilla.ai/integrations.",
  },
];

export function faqByQuestions(questions: string[]): FaqItem[] {
  return questions
    .map((question) => FAQ_ITEMS.find((item) => item.question === question))
    .filter((item): item is FaqItem => Boolean(item));
}
