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
      "Yes. The Free plan is $0/month with 200 credits and GLB export, so you can generate a limited number of models before upgrading.",
  },
  {
    question: "Can I change or cancel my plan anytime?",
    answer:
      "Yes. Plans can be upgraded, downgraded, or cancelled at any time from account settings.",
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
      "Yes. Export GLB, FBX, OBJ, and USDZ. Studio plans include API access for production workflows. See https://hydrilla.ai/api and https://hydrilla.ai/docs.",
  },
  {
    question: "Do I own what I generate?",
    answer:
      "Yes. Hydrilla’s terms grant personal and commercial use of generated content. Read the Terms for the full license.",
  },
  {
    question: "What formats does Hydrilla export?",
    answer:
      "GLB, FBX, OBJ, and USDZ (GLB on Free; all formats on Creator and Studio).",
  },
  {
    question: "Which engines and tools?",
    answer:
      "Unity, Unreal, Blender, and other DCCs that ingest those formats. Film vertical also names Maya, Cinema 4D, and Houdini as import targets, not plugins we ship.",
  },
];

export function faqByQuestions(questions: string[]): FaqItem[] {
  return questions
    .map((question) => FAQ_ITEMS.find((item) => item.question === question))
    .filter((item): item is FaqItem => Boolean(item));
}
