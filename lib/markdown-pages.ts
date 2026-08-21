import {
  BLUEFOX_LEDE,
  BRAND_SENTENCE,
  CONTACT_EMAIL,
  DEMO_URL,
  MODEL_NAME,
  RESEARCH_LAB,
  RESEARCH_LEDE,
  SITE_NAME,
  SITE_URL,
} from "@/lib/brand";
import { getAllArticles } from "@/lib/content";
import { FAQ_ITEMS } from "@/lib/faq";
import { PRICING } from "@/lib/pricing";

const PAGE_MARKDOWN: Record<string, string> = {
  index: `# ${SITE_NAME}

> ${BRAND_SENTENCE}

Generate from a text prompt or a reference image, preview in the browser, and export GLB, FBX, OBJ, or USDZ into Unity, Unreal, Blender, and other pipelines.

## Entities
- **Hydrilla** is the product: studio, workspaces, credits, preview, and export.
- **BlueFox 3D** is the model family. **${MODEL_NAME}** is the model that runs generation today. ${SITE_URL}/bluefox3d
- **${RESEARCH_LAB}** builds BlueFox. ${SITE_URL}/research

## How it works
1. Describe the asset or drop a reference image.
2. ${MODEL_NAME} generates a segmented mesh with PBR maps (base color, metalness, roughness, normals).
3. Preview in the browser. Inspect materials and parts before you download.
4. Export GLB, FBX, OBJ, or USDZ and drop into your engine or DCC.

Hydrilla is for production-ready generated assets you can refine. It is not CAD, not print-ready engineering, and not a finished hero with no artist pass.

Plans: Free ($${PRICING.free.monthly}, ${PRICING.free.creditsLabel}), Creator ($${PRICING.creator.monthly}/mo), Studio ($${PRICING.studio.monthly}/mo).
`,
  about: `# About Hydrilla

${BRAND_SENTENCE}

Hydrilla is the product: a studio for text-to-3D and image-to-3D, in-browser preview, team workspaces, and exports into real pipelines. It is built for 3D artists, technical artists, and the teams who work with them.

${RESEARCH_LAB} is the research lab that builds the models behind Hydrilla. The first public model family is BlueFox 3D. The model you run in Hydrilla today is ${MODEL_NAME}.

${MODEL_NAME} turns a prompt or a reference image into a segmented mesh with PBR materials, then Hydrilla lets you preview and export GLB, FBX, OBJ, and USDZ for Unity, Unreal, Blender, and other tools.

We do not treat generated meshes as a replacement for art direction. Hydrilla is how you get to a clean, editable base faster, then finish the work in your own pipeline.

Team: ${SITE_URL}/team
Research: ${SITE_URL}/research
BlueFox 3D: ${SITE_URL}/bluefox3d
Contact: ${SITE_URL}/contact
`,
  pricing: `# Hydrilla Pricing

Free: $${PRICING.free.monthly}, ${PRICING.free.creditsLabel}, GLB export.
Creator: $${PRICING.creator.monthly}/mo ($${PRICING.creator.yearlyMonthlyEquivalent}/mo yearly), ${PRICING.creator.creditsLabel}, GLB, FBX, OBJ, USDZ.
Studio: $${PRICING.studio.monthly}/mo ($${PRICING.studio.yearlyMonthlyEquivalent}/mo yearly), ${PRICING.studio.creditsLabel}, seats, REST API (10,000 calls/month), all formats.

Plans can be upgraded, downgraded, or cancelled from account settings.

${SITE_URL}/pricing
`,
  features: `# From first prompt to production.

${BRAND_SENTENCE}

Text-to-3D and image-to-3D, segmented meshes, PBR materials, in-browser preview, and GLB, FBX, OBJ, and USDZ exports for Unity, Unreal, and Blender.

GLB on Free; all formats on Creator and Studio.

${SITE_URL}/features
`,
  bluefox3d: `# BlueFox 3D

${BLUEFOX_LEDE}

${MODEL_NAME} generates production-oriented meshes from a text prompt or a reference image. Meshes arrive segmented into logical parts, with PBR maps (base color, metalness, roughness, normals) you can preview in Hydrilla and export as GLB, FBX, OBJ, or USDZ.

Use it for game props and environments, film and animation concept assets, architectural visualization, XR objects, and product viz. Then refine in Unity, Unreal, Blender, Maya, or your DCC.

${MODEL_NAME} is not a CAD system and not a replacement for a hero-asset artist. It is the fast path to a clean, editable 3D base.

Hydrilla is how you run ${MODEL_NAME}: workspaces, credits, preview, team delivery, and export.

${SITE_URL}/bluefox3d
`,
  docs: `# Get started

1. Create an account and open a workspace.
2. Start a generation with a text prompt or a reference image (${MODEL_NAME}).
3. Wait for the mesh. Inspect parts, PBR, and silhouette in the browser preview.
4. Export GLB (Free) or GLB/FBX/OBJ/USDZ (Creator/Studio).
5. Import into Unity, Unreal, Blender, or your DCC.

Features: ${SITE_URL}/features
Pricing: ${SITE_URL}/pricing
API: ${SITE_URL}/api
FAQ: ${SITE_URL}/faq
`,
  api: `# Hydrilla API

Studio plans include REST API access (10,000 calls/month on Studio). Programmatic generation for pipelines. Partner and volume access via ${SITE_URL}/contact. Email ${CONTACT_EMAIL}.

API access is available on Studio and by partner arrangement. We do not publish a public OpenAPI on this page.

${SITE_URL}/api
`,
  faq: `# Hydrilla FAQ

${FAQ_ITEMS.map((item) => `## ${item.question}\n\n${item.answer}`).join("\n\n")}
`,
  contact: `# Contact Hydrilla

Email: ${CONTACT_EMAIL}
Demo: ${DEMO_URL}
Form: ${SITE_URL}/contact
`,
  research: `# ${RESEARCH_LAB}

${RESEARCH_LEDE}

What we work on: generative 3D from text and images, production-oriented meshes, PBR materials, and exports that land in game, film, architecture, and XR pipelines.

## BlueFox 1 model card

| | |
| --- | --- |
| Model | ${MODEL_NAME} |
| Family | BlueFox 3D |
| Product | Hydrilla |
| Inputs | Text prompt, reference image |
| Outputs | Segmented mesh, PBR maps (base color, metalness, roughness, normals) |
| Exports (via Hydrilla) | GLB, FBX, OBJ, USDZ |
| Intended use | Props, environments, visualization, concept-to-production assets |
| Not intended | CAD, manufacturing drawings, print-ready engineering, finished film/game heroes with no artist pass |

${MODEL_NAME} is available through Hydrilla: ${SITE_URL}/
BlueFox 3D: ${SITE_URL}/bluefox3d
`,
  enterprise: `# Hydrilla Enterprise

Volume generation, seats, and ${MODEL_NAME} API access for studios.

Demo: ${DEMO_URL}
Email: ${CONTACT_EMAIL}
${SITE_URL}/enterprise
`,
  security: `# Hydrilla Security

Accounts via Clerk. Generated assets and exports are private on Creator/Studio as stated on Pricing. Contact ${CONTACT_EMAIL} for enterprise security review. We do not claim SOC 2 or similar certifications on this page.

${SITE_URL}/security
`,
  changelog: `# Hydrilla Changelog

Public product updates for Hydrilla and ${MODEL_NAME}.

${SITE_URL}/changelog
`,
  careers: `# Careers at Hydrilla

We hire people who care about generative 3D and production pipelines. Write to ${CONTACT_EMAIL} with a short note and work.

${SITE_URL}/careers
`,
  team: `# Hydrilla Team

The people building Hydrilla and ${MODEL_NAME} at ${RESEARCH_LAB}.

${SITE_URL}/team
`,
  usecase: `# Hydrilla Use Cases

Games, film and animation, architecture, AR/VR/XR, and product visualization.

${SITE_URL}/usecase
`,
  compare: `# Compare Hydrilla

Honest comparisons: Hydrilla vs Meshy, Luma, and Tripo.

${SITE_URL}/compare
`,
  blog: `# Hydrilla Blog

Guides on BlueFox, pipelines, and 3D generation.

${SITE_URL}/blog
`,
  "privacy-policy": `# Hydrilla Privacy Policy

How Hydrilla collects, uses, and protects data.

${SITE_URL}/privacy-policy
`,
  "terms-and-conditions": `# Hydrilla Terms of Service

Terms for using Hydrilla.

${SITE_URL}/terms-and-conditions
`,
  "cookie-policy": `# Hydrilla Cookie Policy

How hydrilla.ai uses cookies.

${SITE_URL}/cookie-policy
`,
};

export function getMarkdownForSlug(slugParts: string[]): string | null {
  const slug = slugParts.join("/") || "index";

  if (PAGE_MARKDOWN[slug]) return PAGE_MARKDOWN[slug];

  if (slug.startsWith("usecase/")) {
    return `# Hydrilla use case\n\n${BRAND_SENTENCE}\n\n${SITE_URL}/${slug}\n`;
  }

  if (slug.startsWith("blog/") || slug.startsWith("compare/")) {
    const [collection, articleSlug] = slug.split("/");
    const article = getAllArticles().find(
      (item) => item.collection === collection && item.slug === articleSlug
    );
    if (!article) return null;
    return `# ${article.headline}\n\n${article.description}\n\n${article.markdown}\n`;
  }

  return null;
}
