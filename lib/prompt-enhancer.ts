/**
 * Local, deterministic prompt enhancer (no network). Detects what the user is asking for,
 * then adds only what they left out: structure, materials, style, and framing for the engine.
 */

export type EnhanceTarget = {
  engine: "water" | "cloud";
  mode: "create" | "edit";
};

export type PromptCategory =
  | "vehicle"
  | "character"
  | "animal"
  | "furniture"
  | "architecture"
  | "electronics"
  | "apparel"
  | "food"
  | "nature"
  | "prop"
  | "object";

type Recipe = {
  category: PromptCategory;
  match: RegExp;
  /** Named parts for Water's procedural build. */
  parts: string[];
  materials: string;
  detail: string;
};

const RECIPES: Recipe[] = [
  {
    category: "vehicle",
    match: /\b(car|truck|bus|van|jeep|suv|kart|tractor|train|tram|tank|bike|bicycle|motorcycle|motorbike|scooter|boat|ship|yacht|submarine|plane|airplane|aircraft|jet|helicopter|drone|rocket|spaceship|vehicle)s?\b/,
    parts: ["body", "wheels", "windows", "lights", "trim"],
    materials: "painted metal body, rubber tires, tinted glass, chrome trim",
    detail: "correct wheelbase and ride height, panel lines and small details",
  },
  {
    category: "character",
    match: /\b(person|man|woman|boy|girl|kid|child|human|robot|android|mech|knight|warrior|wizard|witch|soldier|astronaut|pirate|ninja|samurai|hero|villain|character|mascot|elf|dwarf|zombie)s?\b/,
    parts: ["head", "torso", "arms", "hands", "legs", "feet", "accessories"],
    materials: "clear material zones for skin, cloth, and gear",
    detail: "neutral standing pose with arms slightly away from the body, appealing proportions",
  },
  {
    category: "animal",
    match: /\b(dog|puppy|cat|kitten|horse|pony|cow|pig|sheep|goat|lion|tiger|bear|wolf|fox|rabbit|bunny|deer|elephant|giraffe|monkey|bird|owl|eagle|parrot|duck|chicken|penguin|fish|shark|whale|dolphin|turtle|frog|snake|dragon|dinosaur|creature|monster|animal)s?\b/,
    parts: ["head", "body", "legs", "tail", "ears", "eyes"],
    materials: "fur, scale, or feather surfaces with natural color variation",
    detail: "natural standing pose, anatomically believable proportions",
  },
  {
    category: "furniture",
    match: /\b(chair|armchair|stool|bench|sofa|couch|table|desk|bed|shelf|shelves|bookshelf|cabinet|dresser|wardrobe|drawer|nightstand|lamp|ottoman|throne)s?\b/,
    parts: ["seat or top", "legs", "frame", "backrest", "cushions", "hardware"],
    materials: "wood grain, woven fabric upholstery, brushed metal hardware",
    detail: "realistic dimensions, visible joinery and soft cushion edges",
  },
  {
    category: "architecture",
    match: /\b(house|home|cottage|cabin|hut|building|tower|skyscraper|castle|fortress|temple|church|shop|store|cafe|barn|windmill|lighthouse|bridge|gazebo|tent|garage|school)s?\b/,
    parts: ["foundation", "walls", "roof", "door", "windows", "chimney", "trim"],
    materials: "brick or plaster walls, roof tiles, painted wood trim, glass windows",
    detail: "believable scale, clean rooflines, inset windows and doors",
  },
  {
    category: "electronics",
    match: /\b(phone|smartphone|laptop|computer|pc|tablet|camera|headphones?|earbuds?|speaker|tv|television|monitor|console|controller|gamepad|keyboard|mouse|watch|smartwatch|radio|microphone|router)s?\b/,
    parts: ["housing", "screen", "buttons", "ports", "lens or grille"],
    materials: "matte plastic housing, anodized aluminum, glossy glass screen",
    detail: "crisp bevels, tight panel gaps, precise button layout",
  },
  {
    category: "apparel",
    match: /\b(shoe|sneaker|boot|sandal|heel|hat|cap|beanie|helmet|jacket|coat|hoodie|shirt|dress|bag|backpack|handbag|purse|wallet|glasses|sunglasses|ring|necklace|bracelet|earring|crown|watch strap)s?\b/,
    parts: ["main body", "sole or base", "straps or laces", "stitching", "hardware"],
    materials: "stitched leather, canvas, rubber sole, metal eyelets",
    detail: "visible seams and stitching, realistic fabric thickness",
  },
  {
    category: "food",
    match: /\b(burger|pizza|cake|cupcake|donut|doughnut|cookie|bread|croissant|sandwich|sushi|taco|ice cream|apple|banana|orange|fruit|coffee|drink|cocktail)s?\b/,
    parts: ["base", "layers", "toppings", "garnish", "plate or wrapper"],
    materials: "appetizing surfaces with soft subsurface look and glossy highlights",
    detail: "generous layering and natural imperfections",
  },
  {
    category: "nature",
    match: /\b(tree|plant|flower|rose|tulip|cactus|succulent|bush|shrub|mushroom|rock|stone|boulder|crystal|log|stump|leaf|grass|coral)s?\b/,
    parts: ["base or pot", "trunk or stem", "branches", "leaves or petals"],
    materials: "natural bark, leaf, and mineral surfaces with subtle color variation",
    detail: "organic shapes, varied leaf or petal sizes",
  },
  {
    category: "prop",
    match: /\b(sword|axe|hammer|shield|bow|arrow|spear|dagger|staff|wand|gun|rifle|pistol|blaster|wrench|tool|key|lantern|torch|chest|barrel|crate|box|bottle|cup|mug|vase|jar|book|clock|trophy|guitar|violin|drum|piano|umbrella|candle)s?\b/,
    parts: ["handle or grip", "main body", "guard or rim", "fasteners", "decorative details"],
    materials: "forged steel, wrapped leather, polished wood, brass accents",
    detail: "sharp readable shapes, subtle wear on edges",
  },
];

const FALLBACK: Recipe = {
  category: "object",
  match: /$^/,
  parts: ["main body", "base", "secondary parts", "details"],
  materials: "materials chosen to fit the object",
  detail: "accurate proportions and fine surface detail",
};

const STYLE_WORDS =
  /\b(low[- ]?poly|high[- ]?poly|stylized|stylised|cartoon|cartoony|toon|cel[- ]?shaded|anime|chibi|realistic|photoreal(istic)?|hyper[- ]?realistic|voxel|pixel|minimal(ist)?|clay|claymation|isometric|sci[- ]?fi|steampunk|cyberpunk|fantasy|retro|vintage|futuristic)\b/i;

const MATERIAL_WORDS =
  /\b(wood|wooden|oak|walnut|bamboo|metal|metallic|steel|iron|aluminum|aluminium|gold|golden|silver|chrome|brass|copper|bronze|glass|plastic|leather|fabric|cloth|velvet|denim|wool|stone|marble|granite|ceramic|porcelain|rubber|concrete|brick|paper|cardboard|fur|crystal)\b/i;

const LEAD_IN =
  /^(please\s+)?(can you\s+|could you\s+|i want\s+|i need\s+)?(to\s+)?(create|make|generate|build|design|model|render|draw|give me|show me)\s+(me\s+)?(a\s+|an\s+)?(3d\s+)?(model\s+of\s+|render\s+of\s+|asset\s+of\s+)?/i;

/** Sentences only the enhancer writes; used to detect an already-enhanced prompt. */
const SIGNATURES = {
  water: "Build it as separate, clearly named parts",
  cloud: "isolated on a seamless neutral background",
  edit: "Keep everything else unchanged",
} as const;

const MAX_LENGTH = 800;

export function isEnhancedPrompt(text: string): boolean {
  return Object.values(SIGNATURES).some((sig) => text.includes(sig));
}

export function detectCategory(text: string): PromptCategory {
  return findRecipe(text.toLowerCase()).category;
}

function findRecipe(lower: string): Recipe {
  return RECIPES.find((r) => r.match.test(lower)) ?? FALLBACK;
}

function cleanSubject(raw: string, stripLeadIn: boolean): string {
  const collapsed = raw.replace(/\s+/g, " ").trim().replace(/[.!?,;:\s]+$/, "");
  const stripped = (stripLeadIn && collapsed.replace(LEAD_IN, "").trim()) || collapsed;
  return stripped.charAt(0).toUpperCase() + stripped.slice(1);
}

function fit(sentences: string[]): string {
  let out = "";
  for (const sentence of sentences) {
    const next = out ? `${out} ${sentence}` : sentence;
    if (next.length > MAX_LENGTH) break;
    out = next;
  }
  return out;
}

export function enhancePrompt(raw: string, target: EnhanceTarget): { text: string; category: PromptCategory } {
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();
  const recipe = findRecipe(lower);
  if (!trimmed || isEnhancedPrompt(trimmed)) return { text: trimmed, category: recipe.category };

  const subject = cleanSubject(trimmed, target.mode === "create");

  if (target.mode === "edit") {
    return {
      text: fit([
        `${subject}.`,
        target.engine === "water"
          ? `${SIGNATURES.edit}: keep the same parts, part names, proportions, and materials, and only modify what is described.`
          : `${SIGNATURES.edit}: keep the same subject, shape, proportions, colors, lighting, and camera angle.`,
      ]),
      category: recipe.category,
    };
  }

  const hasStyle = STYLE_WORDS.test(lower);
  const hasMaterials = MATERIAL_WORDS.test(lower);

  if (target.engine === "water") {
    return {
      text: fit([
        `${subject}.`,
        hasStyle ? "" : "Clean stylized look with crisp, readable forms.",
        `${SIGNATURES.water}: ${recipe.parts.join(", ")}.`,
        hasMaterials
          ? "Physically based materials with distinct color and roughness per part."
          : `${capitalize(recipe.materials)}, physically based with distinct roughness per part.`,
        `${capitalize(recipe.detail)}.`,
        "Readable silhouette from a three-quarter view, centered at the origin and resting on the ground, no ground plane or background.",
      ].filter(Boolean)),
      category: recipe.category,
    };
  }

  return {
    text: fit([
      `${subject}.`,
      hasStyle ? "" : "Realistic, high-detail product render.",
      hasMaterials ? "" : `${capitalize(recipe.materials)}.`,
      `${capitalize(recipe.detail)}.`,
      `Single object in full view, centered, three-quarter angle, soft studio lighting, ${SIGNATURES.cloud}, no text or watermark.`,
    ].filter(Boolean)),
    category: recipe.category,
  };
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
