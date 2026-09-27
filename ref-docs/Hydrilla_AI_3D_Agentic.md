# Hydrilla AI — 3D Agent & Production Engine
## Cursor Implementation Specification

**Status:** Build specification — v1 foundation  
**Date:** 20 September 2026  
**Primary client:** Browser web application  
**Primary technical language:** TypeScript  
**3D runtime:** Three.js / React Three Fiber  
**Agent framework:** Google Agent Development Kit (ADK) for TypeScript  
**Primary 3D interchange format:** GLB / glTF 2.0  
**Core product goal:** Produce high-quality, usable 3D assets and complete 3D scenes through an AI-native production workflow.

---

# 0. IMPORTANT: THIS FILE IS THE IMPLEMENTATION CONTRACT

This document is intended to be given directly to an AI coding agent such as Cursor.

The agent should treat the decisions in this file as the current architecture contract.

## Do not do these things without an explicit architecture review

- Replace Google ADK with another agent runtime.
- Introduce Pi, OpenAI Agents SDK, OpenCode, Eve, Conductor, LangGraph, or another orchestration framework as a second runtime.
- Make Three.js/R3F source code the canonical project representation.
- Make raw GLB files the complete source of truth.
- Build a generic coding-agent/IDE product.
- Add a large number of agents without a measurable quality reason.
- Add a cloud-model implementation before the provider abstraction is ready.
- Spread `@google/adk` imports throughout every package.
- Create an architecture where the browser directly owns authoritative project state.

Prefer small, composable packages and explicit interfaces.

When a future requirement is not covered by this document, preserve the architectural principles rather than inventing a competing architecture.

---

# 1. Product Definition

Hydrilla is:

> **An AI-native 3D production engine that turns natural-language intent into production-quality 3D assets and scenes, with structured project state, specialized agents, visual verification, and professional export.**

The product is similar in spirit to:

- Cursor/Codex for intelligent task execution
- Lovable/v0 for browser-native creation
- Blender for 3D production control
- Meshy/Tripo/Kaedim for AI asset generation

but Hydrilla is **not** primarily a coding product.

The main output is the **3D result**.

---

# 2. Core Product Principle

## Scene-first + Asset-first

Do not optimize the architecture around:

```text
prompt
  ↓
generate JavaScript
  ↓
run Three.js
  ↓
done
```

Hydrilla instead operates on:

```text
User Intent
    ↓
Production Plan
    ↓
Asset Plan + Scene Plan + Experience Plan
    ↓
Generate / Import / Refine Assets
    ↓
Assemble Scene
    ↓
Render
    ↓
Visual QA
    ↓
Repair
    ↓
Render Again
    ↓
Performance QA
    ↓
Approve
    ↓
Export / Share
```

The user cares about the quality and usability of the resulting 3D content, not how many lines of TypeScript the agent created.

---

# 3. Architecture Decision

## 3.1 Agent Runtime

Use:

```text
Google ADK for TypeScript
```

The current official TypeScript package is:

```bash
npm install @google/adk
npm install -D @google/adk-devtools
```

Current official ADK TypeScript documentation states that the TypeScript SDK supports Node.js and browser runtimes, typed tools with Zod, multi-agent orchestration, sequential/parallel/loop/routed workflows, sessions, tools, MCP, and development tooling. The current prerequisite documented by the project is Node.js 20.19 or newer. citeturn628024search1

For Hydrilla:

> **Run the authoritative agent runtime server-side.**

The browser is the user experience and 3D viewport.

---

# 4. Runtime Boundary

Google ADK must sit behind a Hydrilla abstraction.

Use:

```text
Hydrilla Application
       ↓
Hydrilla Agent Runtime API
       ↓
Hydrilla ADK Adapter
       ↓
Google ADK TypeScript
       ↓
Model Provider Layer
```

Only the adapter layer should know Google ADK implementation details.

The rest of the system should consume Hydrilla-owned interfaces such as:

```ts
HydrillaAgent
HydrillaSession
HydrillaTool
HydrillaWorkflow
HydrillaEvent
HydrillaContext
HydrillaArtifactRef
```

This is a hard boundary.

---

# 5. Why Google ADK

Hydrilla needs an execution system capable of expressing:

```text
Director
  ↓
Plan
  ↓
Parallel asset/environment work
  ↓
QA
  ↓
Scene assembly
  ↓
Loop:
  render
  inspect
  repair
  render again
```

ADK's current TypeScript architecture provides code-first agents, typed tools, sessions/state, multi-agent composition, sequential/parallel/loop/routed workflows, callbacks/plugins, MCP integration and developer tooling. citeturn628024search1turn813038search0turn813038search1

This means Hydrilla can concentrate engineering effort on the 3D-specific layer rather than recreating a generic agent framework.

---

# 6. Agent Framework Scope

Google ADK is the **generic runtime**.

Hydrilla owns:

```text
3D domain intelligence
3D state
3D tools
3D workflows
asset processing
scene processing
quality systems
visual verification
export
```

Do not move domain logic into arbitrary ADK configuration when it belongs in a Hydrilla package.

---

# 7. Browser Architecture

The user-facing product is fully browser-based.

```text
Browser
|
+-- Next.js / React
+-- Chat UI
+-- Three.js / R3F viewport
+-- Asset Library
+-- Scene Controls
+-- Progress / QA UI
|
v
Hydrilla API
|
+-- Agent Runtime
+-- Project State
+-- Asset Services
+-- Render Services
+-- QA Services
+-- Export Services
```

The browser should never be the authoritative owner of project state.

The browser is:

- interactive
- visual
- responsive
- preview-oriented

The backend is:

- authoritative
- persistent
- agent-driven
- asset-aware
- quality-aware

---

# 8. Recommended Runtime Deployment Shape

Initial production shape:

```text
                  Browser
                     |
                 HTTPS / SSE
                     |
              Hydrilla API
                     |
          +----------+----------+
          |                     |
      Agent Runtime         Project Service
          |                     |
      Google ADK            Postgres
          |
      Tools / Agents
          |
    +-----+------+----------------+
    |            |                |
 Asset Service Scene Service   QA/Render
    |            |                |
 Object Storage  Project State   Renderer
```

The exact cloud vendor is intentionally not hardcoded into the domain layer.

If the existing Hydrilla infrastructure already uses PostgreSQL/Supabase, it may provide the first implementation of the persistence adapter.

---

# 9. Source-of-Truth Hierarchy

This is one of the most important decisions.

```text
1. Hydrilla Project State
          ↓
2. Scene IR + Asset IR + Visual Bible
          ↓
3. Canonical Production Artifacts
          ↓
4. Browser Runtime Representation
          ↓
5. Generated Implementation Code
```

Do not reverse this hierarchy.

Three.js code is downstream.

GLB is a production/interchange artifact.

Neither should silently become the project database.

---

# 10. Scene IR

Scene IR is Hydrilla's canonical logical representation of a scene.

It should describe:

- scene identity
- object instances
- asset references
- hierarchy
- transforms
- cameras
- lights
- environments
- fog
- material overrides
- animation bindings
- effects
- composition constraints
- visibility
- metadata
- quality requirements

Example:

```ts
interface SceneIR {
  sceneId: string;
  version: number;

  environment: {
    type?: string;
    background?: BackgroundSpec;
    fog?: FogSpec;
  };

  cameras: CameraSpec[];
  activeCameraId?: string;

  lights: LightSpec[];

  objects: SceneObjectInstance[];

  constraints: SceneConstraint[];

  visualOverrides?: VisualOverride[];

  qualityTarget: QualityTarget;
}

interface SceneObjectInstance {
  id: string;
  name: string;
  assetVersionId: string;

  parentId?: string;

  transform: {
    position: [number, number, number];
    rotation: [number, number, number, number];
    scale: [number, number, number];
  };

  visible: boolean;

  materialOverrides?: MaterialOverride[];

  animationBindings?: AnimationBinding[];
}
```

The exact schema may evolve, but the conceptual boundary must remain.

---

# 11. Asset IR

Asset IR is the canonical logical representation of a production asset.

It should include:

```text
Asset identity
Source / provenance
Type
Style
Importance
Geometry metadata
Topology metadata
UV metadata
Materials
Textures
Rig
Animations
LODs
Bounds
Pivot
Scale
QA results
Versions
Preview references
Canonical artifact references
```

Example:

```ts
interface AssetIR {
  assetId: string;
  version: number;

  type: AssetType;
  name: string;

  source: AssetSource;

  importance: AssetImportance;

  styleProfile?: string;

  geometry: GeometryMetadata;
  uv?: UVMetadata;
  materials: MaterialMetadata[];
  textures: TextureMetadata[];

  rig?: RigMetadata;
  animations?: AnimationMetadata[];
  lods?: LODMetadata[];

  bounds: BoundingBox;
  pivot: [number, number, number];
  unitScale: number;

  qa: AssetQAResult;

  artifacts: AssetArtifactRefs;
}
```

---

# 12. Binary Asset Storage Rule

Do **not** store large GLBs, textures, rendered images, or similar binary files directly in Scene IR or Asset IR.

Store references:

```text
Asset IR
   |
   +-- glbArtifactId
   +-- previewArtifactId
   +-- textureArtifactIds
   +-- sourceArtifactIds
```

Use object/blob storage for the actual binary data.

The metadata database contains:

- IDs
- versions
- metadata
- state
- relationships
- QA
- storage references

This keeps the domain model small and queryable.

---

# 13. ADK Artifacts vs Hydrilla Assets

ADK has an artifact abstraction that can store/retrieve/version agent-produced artifacts. citeturn813038search3turn813038search11

Hydrilla should use that capability where it fits the agent/session workflow, but:

> **ADK's artifact abstraction is not the authoritative long-term asset database for Hydrilla.**

Hydrilla needs a dedicated Asset Storage / Artifact Storage layer because:

- GLBs can be large
- textures can be large
- multiple versions must be managed
- assets must be searchable outside an agent session
- scenes reference assets across sessions
- assets belong to the product, not only a conversation

Therefore:

```text
ADK Artifact
    = agent workflow artifact/reference

Hydrilla Asset Storage
    = authoritative production asset storage
```

---

# 14. GLB / glTF Strategy

GLB/glTF is the primary interchange and delivery format.

glTF 2.0 is explicitly designed as a runtime/interchange format rather than a full authoring format. It can represent scenes, nodes, transforms, meshes, materials, cameras, skins and animations, while being designed for efficient delivery to web and runtime environments. citeturn628024search0

Therefore:

```text
Hydrilla Asset IR
       ↓
Canonical GLB
       ↓
Web / Blender / Game Engines
```

Do not make GLB the complete internal production representation.

---

# 15. Three.js Integration

Three.js natively supports glTF loading through `GLTFLoader` and exporting through `GLTFExporter`.

Current `GLTFLoader` supports common glTF extensions including Draco, Meshopt, KTX2/Basis-related and multiple PBR-related extensions. citeturn727385search3

Current `GLTFExporter` can export GLB and glTF and supports scenes/objects, animations and selected glTF extensions. citeturn727385search2

Hydrilla should use:

```ts
GLTFLoader
GLTFExporter
```

through a dedicated renderer/export package.

---

# 16. Blender Compatibility

Blender supports glTF 2.0 import/export, including meshes, materials, textures, cameras, punctual lights, extras and animation-related functionality. citeturn727385search4

Hydrilla should therefore design exports with Blender compatibility as a first-class requirement.

The product goal is not:

> "Download a mesh."

The goal is:

> "Download a useful production asset."

Where supported, preserve:

- geometry
- materials
- textures
- UVs
- rig
- animation
- hierarchy
- transforms
- naming
- metadata

---

# 17. Imported GLB Pipeline

A user-uploaded GLB becomes a first-class Hydrilla Asset.

Pipeline:

```text
Upload GLB
   ↓
Validate container
   ↓
Parse glTF
   ↓
Analyze scene/node hierarchy
   ↓
Analyze meshes
   ↓
Analyze materials
   ↓
Analyze textures
   ↓
Analyze skins/animations
   ↓
Measure bounds / scale / pivot
   ↓
Normalize if required
   ↓
Create Asset IR
   ↓
Store canonical artifact reference
   ↓
Add to Asset Library
```

Never treat an uploaded GLB as an opaque file after ingestion.

---

# 18. Asset Identity

Hydrilla must distinguish:

```text
Original Asset
Generated Asset
Imported Asset
Derived Asset
Processed Version
Material Variant
Optimized Version
Animation Variant
```

Use stable IDs.

Example:

```text
asset_01
asset_01:v1
asset_01:v2
asset_01:v3
```

A scene should reference:

```text
assetVersionId
```

not "latest asset."

---

# 19. Asset Versioning

A regenerated asset must not silently change an existing scene.

Example:

```text
Scene v12
 |
 +-- car_asset:v4
 +-- tree_asset:v2
 +-- building_asset:v7
```

Later:

```text
car_asset:v5
```

can be used by a new scene revision without breaking Scene v12.

---

# 20. Asset Library

Persistent asset library:

```text
Asset
|
+-- Thumbnail
+-- Preview
+-- Name
+-- Type
+-- Tags
+-- Dimensions
+-- Polycount
+-- Texture footprint
+-- Materials
+-- Rig
+-- Animation
+-- LOD
+-- Style
+-- Quality
+-- Source
+-- Versions
```

The agent must be able to search the library.

Examples:

```text
"medieval wooden barrel"
"cinematic sports car"
"stylized pine tree"
"low-poly rock"
```

---

# 21. Asset Agent

The Asset Agent is a major Hydrilla subsystem.

It is not:

```text
prompt → generator → GLB
```

It is:

```text
Asset Specification
        ↓
Generate / Retrieve / Import
        ↓
Analyze
        ↓
Repair
        ↓
Retopology
        ↓
UV
        ↓
Textures / Materials
        ↓
Rig / Animation when required
        ↓
LOD
        ↓
Optimization
        ↓
Visual QA
        ↓
Approval
        ↓
Canonical GLB
```

The Asset Agent should be treated as a production specialist.

---

# 22. Asset Specification

The Asset Agent must determine or receive:

```text
asset type
purpose
style
importance
scene context
camera distance
expected visibility
poly budget
texture target
material requirements
realism/stylization target
animation requirements
rig requirements
LOD requirements
export requirements
```

This allows differentiated quality.

A hero character near the camera should receive more processing and QA than a distant background prop.

---

# 23. Asset Importance

Use:

```text
HERO
HIGH
MEDIUM
BACKGROUND
```

Importance affects:

- asset processing
- texture resolution
- mesh density
- retopology
- QA strictness
- iteration budget
- performance requirements

---

# 24. Asset QA

Asset QA should evaluate:

## Geometry

- malformed geometry
- obvious artifacts
- topology issues
- broken normals
- excessive/unjustified complexity
- problematic intersections

## UV

- missing UVs
- problematic overlap
- poor texel density
- stretching
- wasted space

## Materials

- missing material data
- incorrect PBR values
- broken references
- scene-style mismatch

## Textures

- missing maps
- low resolution
- artifacts
- stretching
- inconsistent style
- incorrect color handling

## Transform

- bad scale
- incorrect orientation
- bad pivot
- unexpected bounds

## Animation / Rig

- invalid hierarchy
- broken skinning
- broken animations
- incompatible animation metadata

## Runtime

- triangle count
- draw calls
- texture memory
- file size
- animation cost

---

# 25. Scene Agent

The Scene Agent is responsible for the world-level visual composition.

It reasons about:

```text
Focal Subject
Secondary Subjects
Supporting Props
Foreground
Midground
Background
Camera
Lighting
Depth
Scale
Density
Atmosphere
Composition
```

It modifies Scene IR.

It should not use raw source-code manipulation as its primary control mechanism.

---

# 26. Director Agent

Director is the high-level production coordinator.

Responsibilities:

1. understand intent
2. inspect project state
3. build a production plan
4. decide which specialists are needed
5. delegate
6. combine results
7. evaluate overall output
8. trigger refinement
9. approve completion

Example:

```text
User:
"Create a cinematic medieval village."

Director
   ↓
Asset plan
   ↓
Scene plan
   ↓
Asset Agent
   ↓
Scene Agent
   ↓
Experience Agent
   ↓
Render
   ↓
Visual QA
   ↓
Repair if required
   ↓
Final QA
```

---

# 27. Experience / Animation Agent

Responsible for:

- character animation
- environmental animation
- camera movement
- transitions
- particles
- effects
- interaction
- timeline behavior

It uses the same Scene IR and Asset IR.

Never create a parallel independent scene representation.

---

# 28. Visual QA Agent

Visual QA is part of the core product loop.

The system must evaluate the rendered result rather than simply checking whether execution succeeded.

Core loop:

```text
BUILD
  ↓
RENDER
  ↓
CAPTURE
  ↓
INSPECT
  ↓
IDENTIFY DEFECTS
  ↓
REPAIR
  ↓
RENDER AGAIN
```

Potential checks:

```text
composition
framing
camera
lighting
style consistency
asset quality
object scale
object intersections
visual artifacts
environment density
foreground/background depth
material consistency
scene storytelling
```

---

# 29. Visual QA Output

Visual QA must return structured findings.

Example:

```ts
interface VisualQAFinding {
  severity: "critical" | "major" | "minor";
  category:
    | "composition"
    | "camera"
    | "lighting"
    | "asset"
    | "material"
    | "scale"
    | "intersection"
    | "style"
    | "density"
    | "other";

  objectIds?: string[];
  description: string;
  recommendedAction?: string;
}
```

Result:

```ts
interface VisualQAResult {
  passed: boolean;
  findings: VisualQAFinding[];
  checkedAt: string;
  renderArtifactId: string;
}
```

This allows the Director to reason from structured QA.

---

# 30. Performance QA

Performance QA checks:

```text
FPS
frame time
draw calls
triangle count
texture memory
shader complexity
animation overhead
scene load time
asset load time
```

Potential repairs:

```text
LOD generation
mesh simplification
texture resizing
texture compression
instancing
asset reuse
lazy loading
scene reduction
```

A beautiful scene that is unusable in the browser is not a finished scene.

---

# 31. Visual Bible

Style must be persistent structured project data.

```text
Visual Bible
|
+-- Art Direction
+-- Color Palette
+-- Lighting
+-- Camera Language
+-- Composition
+-- Material Language
+-- Geometry Style
+-- Character Style
+-- Environment Style
+-- Density
+-- Scale
+-- Reference Images
```

The Visual Bible is used by:

- Director
- Asset Agent
- Scene Agent
- Experience Agent
- Visual QA

It should not be reconstructed from the chat transcript on every request.

---

# 32. Hydrilla Skills

Create a dedicated skill layer.

Suggested initial skills:

```text
scene-planning
asset-specification
asset-generation
asset-ingestion
asset-qa
retopology
uv
materials
texturing
lighting
camera
composition
animation
glb-export
blender-export
performance
visual-review
```

A skill is domain knowledge/instructions.

A tool is executable capability.

An agent reasons using skills and tools.

---

# 33. Tool Architecture

Tools must represent semantic 3D operations.

## Scene tools

```text
create_scene
inspect_scene
add_object
remove_object
duplicate_object
move_object
rotate_object
scale_object
parent_object
set_camera
set_lighting
set_environment
set_visibility
set_material_override
```

## Asset tools

```text
generate_asset
import_asset
search_assets
inspect_asset
regenerate_asset
retopologize_asset
generate_uv
generate_texture
set_material
rig_asset
animate_asset
generate_lod
optimize_asset
approve_asset
export_asset
```

## Render / QA tools

```text
render_scene
capture_view
inspect_render
compare_renders
detect_intersections
run_asset_qa
run_scene_qa
measure_performance
run_visual_regression
```

## Project tools

```text
get_project_state
get_scene_state
get_asset_state
save_project
create_scene_version
create_asset_version
restore_version
export_project
```

---

# 34. Tool Design Rule

Prefer:

```text
move_object(objectId, transform)
```

over:

```text
scene.children[7].position.x += 3
```

Prefer:

```text
set_camera(...)
```

over:

```text
new THREE.PerspectiveCamera(...)
```

Reason:

Semantic tools provide:

- validation
- constraints
- observability
- undo
- reliable execution
- versioning
- future runtime flexibility

---

# 35. Tool Execution Contract

Every tool call should produce:

```text
callId
toolName
input
status
output
error
duration
affectedAssetIds
affectedObjectIds
```

Example event:

```ts
interface ToolExecutionEvent {
  callId: string;
  toolName: string;
  status: "started" | "completed" | "failed";
  startedAt: string;
  completedAt?: string;
  affectedAssetIds?: string[];
  affectedObjectIds?: string[];
  error?: ToolError;
}
```

---

# 36. Event System

Create a Hydrilla-owned event system.

Events:

```text
project.created
project.updated
session.started
session.completed
agent.started
agent.completed
agent.failed
tool.started
tool.completed
tool.failed
asset.created
asset.version.created
asset.ingestion.completed
asset.qa.started
asset.qa.failed
asset.qa.passed
scene.updated
scene.version.created
render.started
render.completed
visual.qa.started
visual.qa.failed
visual.qa.passed
performance.qa.failed
performance.qa.passed
export.started
export.completed
export.failed
```

The browser UI consumes these events to show production progress.

---

# 37. ADK State

ADK supports session state and state updates through events/runner/session services. citeturn813038search0turn813038search1turn813038search10

Use ADK session state for:

- current agent execution state
- short/medium-lived workflow state
- temporary coordination
- session-level values

Do not put the entire Hydrilla database into ADK session state.

Hydrilla database state remains authoritative.

---

# 38. Session State vs Project State

Keep these distinct.

```text
ADK Session State
    = current agent execution context

Hydrilla Project State
    = durable product state
```

Example:

```text
ADK:
current_plan
current_step
temporary_findings
agent_outputs

Hydrilla:
scene versions
asset versions
asset metadata
visual bible
project configuration
render history
QA history
export records
```

---

# 39. Memory

Use separate memory concepts.

## Project Memory

Stable facts about the project.

## Style Memory

Visual Bible.

## Asset Memory

Known assets, versions, usage, relationships.

## Session Memory

Current conversation/workflow.

## Learned Preferences

Repeated user corrections/preferences.

Never treat raw conversation history as the only memory mechanism.

---

# 40. Agent Communication

Agents should communicate with structured task/result contracts.

Example:

```ts
interface AgentTask {
  taskId: string;
  type: string;
  projectId: string;
  sceneId?: string;
  assetId?: string;
  requirements: Record<string, unknown>;
  constraints: Record<string, unknown>;
  styleContext?: VisualBibleSnapshot;
}

interface AgentResult {
  taskId: string;
  status: "success" | "partial" | "failed";
  changes: ProjectChange[];
  findings?: Finding[];
  artifactRefs?: ArtifactRef[];
}
```

Use text only where natural-language reasoning is actually required.

---

# 41. Multi-Agent Workflow

Initial hierarchy:

```text
                    DIRECTOR
                       |
          +------------+------------+
          |            |            |
        ASSET        SCENE      EXPERIENCE
          |            |            |
          +------------+------------+
                       |
                  VISUAL QA
                       |
                PERFORMANCE QA
```

The Director should not delegate everything blindly.

It should invoke specialists based on task requirements.

---

# 42. Workflow Examples

## Example A — Create Asset

```text
Asset Specification
        ↓
Asset Agent
        ↓
Generate / Retrieve
        ↓
Inspect
        ↓
Process
        ↓
QA
        ↓
Approve
        ↓
Store
```

## Example B — Create Scene

```text
User Intent
        ↓
Director
        ↓
Scene Plan
        ↓
Asset Plan
        ↓
Parallel Asset Work
        ↓
Asset QA
        ↓
Scene Assembly
        ↓
Render
        ↓
Visual QA
        ↓
Repair Loop
        ↓
Performance QA
        ↓
Approve
```

## Example C — Modify Existing Scene

```text
User:
"Make the scene feel less crowded."

        ↓
Director
        ↓
Inspect Scene IR
        ↓
Analyze density
        ↓
Scene Agent
        ↓
Remove/reposition selected objects
        ↓
Render
        ↓
Visual QA
        ↓
Approve
```

---

# 43. ADK Workflow Mapping

Use ADK workflows for the execution structure.

Conceptually:

```text
Sequential
    ↓
planning
    ↓
Parallel
    ├── asset tasks
    ├── environment tasks
    └── reference analysis
    ↓
Sequential
    ↓
assembly
    ↓
Loop
    ├── render
    ├── visual QA
    └── repair
```

ADK's workflow model is appropriate for this pattern. citeturn628024search1

The exact ADK implementation should remain behind the Hydrilla workflow abstraction.

---

# 44. Loop Safety

Every iterative quality loop must have:

```text
maxIterations
timeout
failure threshold
termination condition
```

Never build an unbounded:

```text
render → inspect → repair → render
```

loop.

Example:

```text
maxIterations: 5
```

When the limit is reached:

```text
status = "needs_review"
```

rather than continuing indefinitely.

---

# 45. Browser Viewport

The viewport is a first-class application surface.

Responsibilities:

- render Scene IR
- display asset previews
- select objects
- transform objects
- inspect scene
- communicate selected IDs to agent
- capture renders
- show QA annotations
- show loading/progress states

It should not own the authoritative Scene IR.

---

# 46. Direct Manipulation

Users should be able to:

```text
select object
move
rotate
scale
delete
duplicate
```

These actions should become structured project changes.

Example:

```text
user moved object X
    ↓
Scene IR update
    ↓
version/operation
    ↓
viewport update
```

This gives the agent the actual latest state.

---

# 47. Chat + Viewport + Asset Library

Primary UI:

```text
+----------------------------------------+
|                Hydrilla                |
+--------------------+-------------------+
|                    |                   |
|   Chat / Agent     |   3D Viewport    |
|                    |                   |
|   instructions     |   Three.js/R3F   |
|   progress         |                   |
|   QA               |                   |
|                    |                   |
+--------------------+-------------------+
|            Asset Library               |
+----------------------------------------+
```

Do not build a large code editor as a primary product feature.

---

# 48. Implementation Code

Three.js/R3F implementation files can exist.

For example:

```text
generated/
    scene/
        runtime.ts
        effects.ts
        animation.ts
```

But they should be generated from project state where possible.

The agent should generally change:

```text
Scene IR
Asset IR
```

through tools.

The implementation layer then reflects those changes.

---

# 49. Code Agent Role

There may be an implementation/code specialist.

But:

> **Code Agent is not a top-level product agent.**

Use it when the experience requires:

- custom shader logic
- custom interaction
- complex animation behavior
- procedural geometry
- renderer-specific implementation
- custom visual effects

The high-level system remains outcome-driven.

---

# 50. Asset Processing Pipeline

Create an explicit asset processing pipeline abstraction.

```ts
interface AssetProcessor {
  process(input: AssetProcessInput): Promise<AssetProcessResult>;
}
```

Possible stages:

```text
ingestion
validation
normalization
geometry cleanup
retopology
UV
texture
material
rig
animation
LOD
optimization
export
```

Each stage should be separately testable.

---

# 51. Asset Provider Abstraction

Cloud/model implementation is intentionally deferred.

Still define:

```ts
interface AssetGenerationProvider {
  generate(input: AssetGenerationRequest): Promise<AssetGenerationResult>;
}

interface TextureProvider {
  generate(input: TextureGenerationRequest): Promise<TextureGenerationResult>;
}

interface RetopologyProvider {
  process(input: RetopologyRequest): Promise<RetopologyResult>;
}

interface RiggingProvider {
  process(input: RiggingRequest): Promise<RiggingResult>;
}
```

Do not hardcode one provider in Asset Agent logic.

The current goal is to make the provider interchangeable.

---

# 52. Object Storage

Binary production files should live in object storage.

Examples:

```text
assets/{assetId}/versions/{version}/model.glb
assets/{assetId}/versions/{version}/preview.webp
assets/{assetId}/versions/{version}/textures/...
renders/{projectId}/{renderId}/...
```

Use signed URLs for browser delivery where appropriate.

Store storage references in database metadata.

---

# 53. Database Model

At minimum, model:

```text
users
projects
project_members
sessions
scene_versions
scene_objects
assets
asset_versions
asset_artifacts
asset_qa_results
scene_qa_results
render_jobs
renders
visual_bibles
agent_runs
tool_runs
workflow_runs
exports
```

Do not prematurely normalize every nested property.

Store stable relational identity and use JSON columns for evolving structured specifications where appropriate.

---

# 54. Project Relationships

Core relationships:

```text
Project
  ├── Scenes
  ├── Assets
  ├── Visual Bible
  ├── Sessions
  ├── Renders
  ├── QA
  └── Exports

Scene
  └── Scene Version
         └── Asset Version references

Asset
  └── Asset Version
         └── Artifact references
```

---

# 55. Version Model

Use immutable production versions where possible.

```text
Asset v1
Asset v2
Asset v3
```

and:

```text
Scene v1
Scene v2
Scene v3
```

Each version records:

```text
createdBy
createdAt
sourceVersion
reason
changes
artifactRefs
```

---

# 56. Undo / Revert

Meaningful operations should be reversible.

Example:

```text
Operation 1
Added five street lights

Operation 2
Moved camera

Operation 3
Changed lighting

Operation 4
Replaced hero car
```

Allow:

```text
undo operation
restore scene version
restore asset version
```

Avoid destructive operations when an immutable version can be created cheaply.

---

# 57. Quality Levels

Support:

```text
DRAFT
PREVIEW
PRODUCTION
HERO
```

Quality level can affect:

- processing depth
- texture size
- geometry target
- QA strictness
- optimization
- iteration budget

Do not build expensive high-quality processing for every background asset.

---

# 58. Scene Quality Gates

Before final approval:

```text
[ ] scene structure valid
[ ] all referenced assets available
[ ] camera valid
[ ] composition acceptable
[ ] lighting acceptable
[ ] no critical intersections
[ ] style consistent
[ ] visual QA passed
[ ] performance QA passed
[ ] export successful
```

---

# 59. Asset Quality Gates

Before approval:

```text
[ ] source valid
[ ] geometry valid
[ ] topology acceptable
[ ] UV acceptable
[ ] materials valid
[ ] textures valid
[ ] transforms normalized
[ ] rig valid if required
[ ] animation valid if required
[ ] LOD valid if required
[ ] visual QA passed
[ ] runtime metrics acceptable
[ ] canonical GLB generated
```

---

# 60. Evaluation Harness

Hydrilla needs evaluations from the beginning.

## Asset evaluations

Measure:

```text
generation success
invalid asset rate
QA failure rate
rework rate
export success
user acceptance
```

## Scene evaluations

Measure:

```text
completion
visual QA pass rate
iteration count
correction count
approval time
```

## Performance evaluations

Measure:

```text
FPS
frame time
draw calls
memory
load time
```

## Product evaluations

Measure:

```text
time to first useful result
time to final result
asset reuse
export rate
project completion
user modifications
```

---

# 61. Visual Regression

Maintain known test projects.

Example:

```text
Test: Cyberpunk Street

Expected:
- clear focal subject
- correct camera framing
- wet road
- night lighting
- neon style
- adequate environment density
```

Store reference renders.

Detect large visual regressions after changes.

---

# 62. Asset Evaluation Dataset

Maintain representative tasks:

```text
character
vehicle
building
prop
environment
vegetation
stylized asset
realistic asset
mechanical object
organic object
```

For each task, store:

```text
input prompt
style
quality target
expected properties
reference images
QA requirements
```

This will become an important engineering asset.

---

# 63. Agent Observability

Track:

```text
agent run
workflow run
model call
tool call
handoff/delegation
render
QA
asset processing
export
```

For each:

```text
id
parentId
projectId
sessionId
startedAt
completedAt
status
duration
error
metadata
```

Keep observability separate from product state.

---

# 64. User-Facing Progress

Show production-oriented progress:

```text
Creating scene...

✓ Understanding request
✓ Planning environment
✓ Preparing hero assets
✓ Processing materials
✓ Building composition
● Rendering preview
○ Visual quality review
○ Performance review
○ Final export
```

Do not expose raw internal framework traces by default.

---

# 65. Failure Handling

Tools and agents will fail.

Each failure must be classified:

```text
retryable
user-action-required
provider-failure
invalid-input
internal-error
quality-failure
timeout
```

Retry only retryable failures.

Do not repeatedly retry permanent failures.

---

# 66. Idempotency

Production tools should be idempotent where practical.

Example:

```text
generate_lod(assetVersionId, target)
```

should be safe to retry.

Long-running asset jobs should have stable job IDs.

---

# 67. Concurrency

Parallelize where independent.

Example:

```text
Scene task
   |
   +-- Asset A
   +-- Asset B
   +-- Asset C
```

Do not parallelize conflicting mutations of the same Scene IR without explicit conflict handling.

Prefer:

```text
parallel generation
      ↓
merge
      ↓
scene mutation
```

---

# 68. Scene Mutation Safety

When multiple agents can affect the scene:

```text
read version
  ↓
compute change
  ↓
validate against current version
  ↓
apply
  ↓
create new version
```

Avoid silent last-write-wins for complex scene operations.

---

# 69. Tool Permissions

Define permission levels.

```text
READ_PROJECT
EDIT_SCENE
CREATE_ASSET
EDIT_ASSET
DELETE_ASSET
EXPORT
RESTORE_VERSION
```

Destructive or high-impact operations should be explicitly controlled.

Example:

Deleting an asset used by multiple scenes should require confirmation or a safe replacement strategy.

---

# 70. Security Boundary

Do not allow arbitrary agent-generated code to have unrestricted access to:

- production database
- secrets
- arbitrary filesystem
- credentials
- private customer assets

Generated/custom code should run in a controlled execution environment.

Sandboxing can be added to the runtime architecture as the need increases.

---

# 71. MCP

MCP is an integration mechanism.

Use it for:

- external services
- external knowledge
- optional third-party tools

Do not make all core Hydrilla 3D operations MCP calls.

Core Hydrilla operations should be first-class typed tools for:

- performance
- validation
- observability
- stable semantics
- direct product ownership

---

# 72. Export Architecture

Create:

```text
packages/exporter
```

with an abstraction:

```ts
interface Exporter {
  exportAsset(input: ExportAssetInput): Promise<ExportResult>;
  exportScene(input: ExportSceneInput): Promise<ExportResult>;
}
```

Implement initially:

```text
GLB
```

Add other formats as required:

```text
FBX
USD / USDZ where appropriate
OBJ
STL
```

Do not implement every format in the first sprint.

---

# 73. GLB Export Rules

When exporting:

- preserve intended hierarchy
- preserve transforms
- preserve materials
- preserve textures
- preserve animations when required
- preserve names
- include supported extensions when needed
- validate resulting GLB
- store the resulting artifact
- associate the export with exact Asset/Scene version

Three.js `GLTFExporter` supports GLB output and animation export. citeturn727385search2

---

# 74. GLB Validation

After every canonical GLB export:

```text
export
  ↓
parse
  ↓
validate
  ↓
load back
  ↓
check bounds
  ↓
check materials
  ↓
check animations
  ↓
check scene graph
  ↓
mark export valid
```

Do not trust generation success alone.

---

# 75. Browser Asset Loading

Use:

```text
GLTFLoader
```

with appropriate decoders/compression loaders when the asset uses supported compression/extensions.

Current Three.js documentation lists support for Draco, Meshopt, KTX2/Basis-related, WebP/AVIF texture paths and multiple glTF extensions. citeturn727385search3

The browser asset layer must also correctly dispose:

- geometries
- materials
- textures
- animation resources

to avoid memory leaks.

---

# 76. Rendering

Create a renderer abstraction:

```ts
interface SceneRenderer {
  render(input: RenderRequest): Promise<RenderResult>;
}
```

The first renderer is browser/Three.js-oriented.

The architecture must remain open for a higher-fidelity server-side production renderer later.

Do not assume browser rendering is the only future render path.

---

# 77. Render Artifacts

Every important render should produce:

```text
renderId
projectId
sceneVersionId
cameraId
settings
thumbnail
full preview
timestamp
```

Visual QA references a specific render artifact.

---

# 78. Render-to-QA Loop

Example:

```text
Scene v8
   ↓
Render R17
   ↓
Visual QA
   ↓
3 findings
   ↓
Repair
   ↓
Scene v9
   ↓
Render R18
   ↓
Visual QA
   ↓
PASS
```

This creates an inspectable production history.

---

# 79. Asset-to-Scene Relationship

Assets are reusable.

Example:

```text
Asset:
sports_car:v4
```

can appear in:

```text
Scene A
Scene B
Scene C
```

Each scene instance owns:

```text
transform
visibility
material overrides where allowed
animation binding
```

The base asset remains shared.

---

# 80. Material Overrides

Allow scene-level overrides without mutating the base asset when appropriate.

Example:

```text
Base car:
black paint

Scene A:
red paint

Scene B:
blue paint
```

The system should represent this as:

```text
asset reference
+
material override
```

rather than creating duplicate geometry unnecessarily.

---

# 81. Scene Constraints

Support structured constraints such as:

```text
objectA must be near objectB
objectA must face objectB
character must remain on ground
car must stay on road
hero object must remain in camera framing
```

These will make natural-language modification more reliable.

---

# 82. Spatial Semantics

Hydrilla should eventually support semantic relationships:

```text
beside
behind
in front of
inside
on top of
near
far from
facing
centered on
aligned with
```

These should translate into Scene IR constraints/operations where possible.

---

# 83. Natural Language Modification

Examples:

```text
"Move the car closer to the camera."

"Put the dragon behind the castle."

"Make the trees denser around the road."

"Keep the hero character visible but move everyone else back."

"Make the lighting more cinematic."

"Replace the current vehicle with this uploaded GLB."
```

The Director should map these requests to semantic tools and Scene/Asset IR changes.

---

# 84. Project Creation Flow

```text
Create Project
   ↓
Create initial Scene
   ↓
Initialize Visual Bible
   ↓
Initialize Asset Library
   ↓
Create ADK session
   ↓
User prompt
   ↓
Director
```

Every project should have stable IDs from the beginning.

---

# 85. First User Journey

```text
User enters:
"Create a cinematic cyberpunk street."

Hydrilla:

✓ Understand intent
✓ Create production plan
✓ Create asset plan
✓ Generate/select assets
✓ Inspect assets
✓ Build scene
✓ Render
✓ Visual QA
✓ Repair
✓ Render again
✓ Performance QA
✓ Approve

User sees:
finished scene
asset library
downloadable GLB
```

---

# 86. Example: External GLB Workflow

```text
User uploads motorcycle.glb
        ↓
Hydrilla ingestion
        ↓
Asset IR
        ↓
QA
        ↓
Asset Library
        ↓
User:
"Place this beside the car and make it look like it belongs."
        ↓
Director
        ↓
Scene Agent
        ↓
material/style adjustments where supported
        ↓
Render
        ↓
Visual QA
```

---

# 87. Example: Hero Asset Workflow

```text
User:
"Create a realistic warrior for the center of this shot."

Director
   ↓
Asset Specification
   ↓
HERO importance
   ↓
Asset Agent
   ↓
Generation
   ↓
Geometry
   ↓
UV
   ↓
Textures
   ↓
Materials
   ↓
Rig
   ↓
Animation if required
   ↓
Visual QA
   ↓
Scene fit QA
   ↓
Canonical GLB
```

---

# 88. What Makes Hydrilla Different From a Thin 3D Generator

Do not reduce the product to:

```text
prompt → 3D API → GLB
```

Hydrilla should provide:

```text
generation
+
asset understanding
+
asset processing
+
asset quality
+
style consistency
+
scene awareness
+
visual QA
+
performance QA
+
persistent asset library
+
versioning
+
professional export
```

This broader system is the product.

---

# 89. Initial Monorepo Structure

Recommended:

```text
hydrilla/
|
+-- apps/
|   +-- web/
|   +-- api/
|
+-- packages/
|   +-- agent-runtime/
|   +-- adk-adapter/
|   +-- orchestrator/
|   +-- agents/
|   |   +-- director/
|   |   +-- asset/
|   |   +-- scene/
|   |   +-- experience/
|   |   +-- visual-qa/
|   |   +-- performance-qa/
|   |
|   +-- scene-ir/
|   +-- asset-ir/
|   +-- project-state/
|   +-- tool-registry/
|   +-- scene-tools/
|   +-- asset-tools/
|   +-- render-tools/
|   +-- qa/
|   +-- renderer/
|   +-- exporter/
|   +-- asset-storage/
|   +-- visual-bible/
|   +-- skills/
|   +-- events/
|   +-- shared/
|
+-- services/
|   +-- asset-processing/
|   +-- rendering/
|   +-- export/
|
+-- evals/
|   +-- assets/
|   +-- scenes/
|   +-- visual/
|   +-- performance/
|
+-- docs/
|   +-- architecture/
|   +-- agents/
|   +-- scene-ir/
|   +-- asset-ir/
|   +-- quality/
```

Adapt to the existing Hydrilla monorepo if one already exists. Do not create a second repository unnecessarily.

---

# 90. Package Responsibilities

## `agent-runtime`

Hydrilla-owned runtime interfaces.

## `adk-adapter`

Google ADK implementation.

## `orchestrator`

Hydrilla production workflow logic.

## `agents`

Specialized agents.

## `scene-ir`

Scene schema, validation, migrations.

## `asset-ir`

Asset schema, validation, migrations.

## `project-state`

Durable persistence.

## `tool-registry`

Tool registration and discovery.

## `scene-tools`

Semantic scene operations.

## `asset-tools`

Semantic asset operations.

## `qa`

Quality systems.

## `renderer`

Three.js/R3F and render abstractions.

## `exporter`

GLB/export pipeline.

## `asset-storage`

Binary artifact storage abstraction.

## `visual-bible`

Style state and validation.

## `skills`

Domain knowledge/instruction packages.

## `events`

Hydrilla event model.

---

# 91. TypeScript Standards

Use:

- strict TypeScript
- Zod for runtime validation where appropriate
- explicit schemas for tool inputs/outputs
- discriminated unions for domain events
- exhaustive switch handling
- small domain packages
- unit tests around transformation logic

Google ADK TypeScript itself uses Zod-based typed tool parameter validation. citeturn628024search1

---

# 92. Tool Schemas

Every agent-facing tool must have:

```text
name
description
input schema
output schema
permission
timeout
idempotency strategy
affected resource type
```

Do not expose an untyped `any`-based tool interface.

---

# 93. Error Types

Define common errors:

```ts
type HydrillaErrorCode =
  | "INVALID_INPUT"
  | "RESOURCE_NOT_FOUND"
  | "VERSION_CONFLICT"
  | "TOOL_FAILED"
  | "QUALITY_FAILED"
  | "EXPORT_FAILED"
  | "RENDER_FAILED"
  | "ASSET_INVALID"
  | "SCENE_INVALID"
  | "TIMEOUT"
  | "PERMISSION_DENIED"
  | "PROVIDER_ERROR";
```

---

# 94. State Validation

Scene IR and Asset IR must validate before persistence.

For every mutation:

```text
input
  ↓
schema validation
  ↓
domain validation
  ↓
conflict check
  ↓
mutation
  ↓
version
  ↓
event
```

Never persist known-invalid state.

---

# 95. Database / Storage Rule

Binary files:

```text
Object Storage
```

Structured metadata:

```text
Postgres
```

Agent session execution:

```text
ADK session services
```

Hydrilla must connect these through its own services.

Do not use one storage mechanism for every type of state.

ADK's current session architecture includes in-memory services for development and production-oriented database/session service options in its broader runtime ecosystem; in-memory storage should remain development/test only. citeturn813038search0turn813038search8

---

# 96. Development Environment

Current ADK TypeScript baseline:

```bash
npm install @google/adk
npm install -D @google/adk-devtools
```

Current official project documentation requires Node.js `20.19+`. citeturn628024search1

Use a pinned Node version in the repository.

---

# 97. Local Agent Development

Build a minimal ADK root agent for local testing.

Conceptually:

```ts
export const rootAgent = new LlmAgent({
  name: "hydrilla_director",
  model: MODEL,
  description: "...",
  instruction: "...",
  tools: [...]
});
```

The actual Hydrilla agent API should wrap this.

Use ADK dev tools for development/debugging rather than building a custom debugging UI first. Google provides current ADK development tooling for local agent testing/debugging. citeturn628024search1turn727385search5

---

# 98. Production Agent Runtime

Production architecture:

```text
HTTP/SSE request
       ↓
Hydrilla Session
       ↓
Director workflow
       ↓
ADK runner
       ↓
Agent/tool events
       ↓
Hydrilla event translation
       ↓
Persist
       ↓
Stream to browser
```

The browser should receive Hydrilla events rather than raw framework-specific objects.

---

# 99. Streaming

The browser should receive:

```text
agent progress
tool progress
asset progress
render progress
QA findings
completion
errors
```

Use SSE/WebSocket depending on the existing API architecture.

Do not expose provider-specific streaming formats directly to the UI.

---

# 100. Long-Running Jobs

Long-running operations should be job-based.

Examples:

```text
asset_generation
asset_processing
render
export
```

Each should have:

```text
jobId
status
progress
startedAt
completedAt
error
outputRefs
```

Agent execution can wait for job completion or resume after completion.

---

# 101. Asset Job Example

```text
Asset Agent
   ↓
create asset job
   ↓
job = processing
   ↓
worker processes
   ↓
job progress events
   ↓
job completed
   ↓
Asset Agent continues
   ↓
QA
```

This is more robust than blocking the whole request on every expensive operation.

---

# 102. Cloud Model Architecture

Intentionally deferred.

For v1:

```text
AssetGenerationProvider
```

is an interface.

Do not yet decide:

- which model
- which GPU provider
- hosting topology
- inference engine
- model routing
- GPU autoscaling

Those can be added behind the provider abstraction later.

---

# 103. Runtime Replaceability

Although Google ADK is the current foundation, Hydrilla must not architect itself so that replacing it would require rewriting the entire product.

The boundary:

```text
Hydrilla agent interfaces
        ↓
ADK adapter
```

must remain stable.

This is an engineering hedge, not a reason to support multiple runtimes simultaneously.

---

# 104. Do Not Add Another Agent Framework

For v1, the architecture should contain exactly one agent framework:

```text
Google ADK
```

Do not install or integrate:

```text
Pi
OpenAI Agents SDK
OpenCode
Eve
Conductor
LangGraph
```

as additional orchestration frameworks.

They are not part of the implementation.

---

# 105. Initial Agents to Implement

Implement only:

```text
1. Director
2. Asset Agent
3. Scene Agent
4. Experience/Animation Agent
5. Visual QA Agent
6. Performance QA Agent
```

No more.

Add specialists only after evaluations identify a real quality bottleneck.

---

# 106. Agent Responsibilities Matrix

| Agent | Owns |
|---|---|
| Director | Intent, planning, delegation, completion |
| Asset Agent | Asset specification, generation, processing, asset QA coordination |
| Scene Agent | Placement, composition, camera, lighting, scene structure |
| Experience Agent | Animation, interaction, effects, motion |
| Visual QA | Render inspection and visual defects |
| Performance QA | Runtime performance and optimization findings |

---

# 107. Agent Non-Responsibilities

Director should not:

- directly manipulate low-level geometry

Asset Agent should not:

- redesign the whole scene

Scene Agent should not:

- regenerate an unrelated asset unless requested

Visual QA should not:

- directly make arbitrary changes without an explicit repair path

Performance QA should not:

- reduce quality blindly

This reduces agent conflicts.

---

# 108. Repair Model

A QA failure should produce an explicit repair task.

Example:

```json
{
  "category": "composition",
  "severity": "major",
  "description": "Hero car is partially outside the intended focal region.",
  "recommendedAction": "Move the car 1.5m toward frame center and adjust camera target."
}
```

Director decides whether to:

- delegate repair
- accept tradeoff
- ask user
- terminate

---

# 109. User Approval Model

The system should automatically handle normal low-risk production operations.

Require approval when an action is:

```text
destructive
expensive beyond a threshold
irreversible
affects multiple user projects/resources
```

Do not create excessive confirmation dialogs for ordinary scene editing.

---

# 110. Project State Changes

All important changes should produce a project operation.

Example:

```ts
interface ProjectChange {
  changeId: string;
  type: string;
  projectId: string;
  sceneVersionId?: string;
  assetVersionId?: string;
  before?: unknown;
  after?: unknown;
  actor: "user" | "agent" | "system";
  createdAt: string;
}
```

This creates an audit trail.

---

# 111. Rendering Quality Strategy

The browser renderer is for:

```text
interactive visualization
fast preview
selection
editing
visual QA feedback
```

Keep the architecture open for a separate production rendering path later.

Do not force final-quality rendering into the browser if doing so compromises reliability or quality.

---

# 112. Scene Preview Strategy

Every scene should support:

```text
viewport preview
named camera views
QA camera
final camera
```

A render should always record:

```text
sceneVersionId
cameraId
render settings
```

so QA results are reproducible.

---

# 113. Asset Preview Strategy

Every asset version should have:

```text
thumbnail
quick preview
optional turntable
```

The Asset Library should not need to instantiate the entire production scene to show an asset.

---

# 114. Asset Validation Before Scene Use

When adding an asset to a scene:

```text
Asset exists
  ↓
Asset version approved
  ↓
Asset artifact available
  ↓
Metadata valid
  ↓
Scene placement allowed
```

Do not allow broken asset references.

---

# 115. Asset Replacement

User:

> Replace this building with my uploaded GLB.

Hydrilla:

```text
select object
   ↓
identify asset slot
   ↓
validate uploaded asset
   ↓
create Asset Version
   ↓
replace scene reference
   ↓
preserve transform
   ↓
render
   ↓
visual QA
```

This should be a standard operation.

---

# 116. Scene Composition Intelligence

The Scene Agent should reason about:

```text
framing
balance
depth
negative space
scale
occlusion
visual hierarchy
focal point
camera angle
camera distance
foreground
midground
background
```

These become structured instructions/tools where possible.

---

# 117. Style Consistency

When a scene uses multiple generated/imported assets:

```text
Asset A
Asset B
Asset C
```

the system should assess whether they belong to the same style.

Use:

```text
Visual Bible
+
Scene context
+
Reference images
+
Visual QA
```

to identify mismatches.

---

# 118. Asset Search and Reuse

Before generating a new asset, the Asset Agent should consider:

```text
Does an acceptable existing asset already exist?
```

Potential flow:

```text
request
  ↓
search Asset Library
  ↓
evaluate candidates
  ↓
reuse acceptable asset
  OR
generate new asset
```

This reduces unnecessary duplication.

---

# 119. Asset Deduplication

Store fingerprints/metadata to detect:

```text
same asset
near-duplicate asset
derived asset
material variant
```

Do not create duplicate artifacts unnecessarily.

---

# 120. Cost-Aware Planning

Even though model infrastructure is deferred, the architecture should retain:

```text
quality target
asset importance
processing budget
iteration budget
```

so production policies can later optimize resource use.

---

# 121. Quality Policy

Default policy:

```text
Hero asset:
maximum quality

Important asset:
high quality

Normal asset:
production quality

Background asset:
efficient quality
```

The Director should make quality decisions based on scene context.

---

# 122. Performance Policy

Default rules should avoid obviously wasteful scenes.

For example:

```text
many identical objects
    → consider instancing

far object
    → consider LOD

huge texture
    → check required resolution

unused asset
    → don't load
```

These are production policies, not hardcoded universal limits.

---

# 123. Evaluation-Driven Agent Expansion

Add a new specialist only when:

```text
evaluation shows repeated failure
AND
specialization produces measurable improvement
```

Do not add:

```text
"Tree Agent"
"Car Agent"
"Rock Agent"
```

unless evidence supports it.

Prefer capability-based specialists:

```text
Asset Agent
Scene Agent
Lighting Specialist
```

where needed.

---

# 124. Initial Development Sequence

## Phase 0 — Repository Inspection

Before writing code:

```text
inspect existing Hydrilla repo
identify existing apps/packages
identify existing Next.js setup
identify database
identify storage
identify auth
identify current Three.js/R3F code
identify build/test tooling
```

Do not replace working infrastructure unnecessarily.

---

# 125. Phase 1 — Runtime Skeleton

Build:

```text
@google/adk
Hydrilla runtime interfaces
ADK adapter
Director skeleton
session abstraction
event abstraction
tool registry
```

Acceptance:

```text
user request
  ↓
Director
  ↓
typed tool call
  ↓
result
  ↓
streamed event
```

---

# 126. Phase 2 — Scene IR

Build:

```text
Scene IR types
validation
persistence
versioning
basic semantic mutation tools
```

Acceptance:

```text
create scene
add object
move object
rotate object
scale object
save version
restore version
```

---

# 127. Phase 3 — Browser Viewport

Build:

```text
Scene IR → Three.js/R3F
GLB loading
object selection
transform controls
camera
basic lighting
```

Acceptance:

```text
Scene IR changes
   ↓
browser updates correctly
```

---

# 128. Phase 4 — Asset IR + Ingestion

Build:

```text
Asset IR
asset versions
GLB ingestion
GLTF parsing
metadata extraction
asset library
```

Acceptance:

```text
upload GLB
  ↓
inspect
  ↓
create Asset IR
  ↓
store
  ↓
show in library
  ↓
insert into scene
```

---

# 129. Phase 5 — Asset Tools

Build the first native asset tools:

```text
import_asset
inspect_asset
search_assets
approve_asset
export_asset
```

Then connect generation through:

```text
AssetGenerationProvider
```

without hardcoding a provider.

---

# 130. Phase 6 — Asset QA

Implement:

```text
geometry QA
material QA
texture QA
transform QA
runtime QA
visual preview QA
```

Acceptance:

```text
invalid asset
   ↓
QA failure
   ↓
structured findings
```

---

# 131. Phase 7 — Scene Agent

Implement:

```text
scene planning
placement
camera
lighting
composition
style integration
```

Acceptance:

Natural-language requests should become Scene IR changes rather than raw code edits.

---

# 132. Phase 8 — Visual QA Loop

Implement:

```text
render_scene
capture_view
visual QA
repair task
iteration
```

Acceptance:

```text
bad scene
  ↓
QA finds issue
  ↓
agent repairs
  ↓
new render
  ↓
QA passes
```

with a bounded iteration count.

---

# 133. Phase 9 — Experience Agent

Add:

```text
animation
effects
camera motion
interaction
```

Use the same Scene IR.

---

# 134. Phase 10 — Performance QA

Implement:

```text
draw calls
triangles
FPS/frame time
texture footprint
load time
```

Then optimization recommendations.

---

# 135. Phase 11 — Production Export

Implement:

```text
canonical GLB generation
GLB validation
download
asset export
scene export
Blender compatibility testing
```

---

# 136. Phase 12 — Evaluations

Create:

```text
asset benchmark suite
scene benchmark suite
visual regression suite
performance suite
agent trajectory/evaluation suite
```

Only after these are stable should large-scale optimization begin.

---

# 137. V1 Definition of Done

A user can:

```text
create project
      ↓
describe scene
      ↓
Hydrilla plans scene
      ↓
generate/import assets
      ↓
inspect/process assets
      ↓
assemble scene
      ↓
modify scene naturally
      ↓
render
      ↓
visual QA
      ↓
repair
      ↓
performance QA
      ↓
save version
      ↓
download GLB
      ↓
use asset in Blender
```

This is the minimum meaningful product.

---

# 138. V1 Non-Goals

Do not initially build:

- full code IDE
- terminal emulator
- complete Blender replacement
- every 3D export format
- arbitrary autonomous code execution
- dozens of specialized agents
- multi-runtime orchestration
- custom LLM framework
- custom token/context engine
- cloud model infrastructure
- complex distributed GPU scheduler

---

# 139. Architecture Anti-Patterns

Avoid:

## Anti-pattern 1

```text
Agent writes raw Three.js everywhere.
```

Use Scene IR/tools.

## Anti-pattern 2

```text
All project state lives in chat context.
```

Use durable project state.

## Anti-pattern 3

```text
All assets are raw files with no metadata.
```

Use Asset IR.

## Anti-pattern 4

```text
Every agent can mutate everything.
```

Use ownership + permissions.

## Anti-pattern 5

```text
Visual QA is manual only.
```

Make it part of the execution loop.

## Anti-pattern 6

```text
New agent framework for every new feature.
```

Keep one runtime.

## Anti-pattern 7

```text
Latest asset silently replaces old asset.
```

Version assets.

## Anti-pattern 8

```text
GLB is treated as the whole project database.
```

Use Hydrilla IR.

---

# 140. Implementation Invariants

The following must stay true:

```text
Hydrilla is scene-first.
Hydrilla is asset-first.
Scene IR is canonical.
Asset IR is canonical.
Three.js is a renderer/runtime.
GLB is a first-class interchange artifact.
Imported GLBs become Hydrilla Assets.
Generated assets become Hydrilla Assets.
The Asset Agent owns production quality.
Visual QA is part of the loop.
Performance QA is part of completion.
The browser is not authoritative state.
Project versions are durable.
Agent operations are observable.
Core tools are typed.
ADK is behind an adapter.
Only one agent framework is used in v1.
```

---

# 141. Final Architecture Diagram

```text
                             HYDRILLA WEB
                                  |
                    +-------------+-------------+
                    |                           |
                 Chat UI                  Three.js/R3F
                    |                           |
                    +-------------+-------------+
                                  |
                           HYDRILLA API
                                  |
                         Hydrilla Runtime
                                  |
                            ADK Adapter
                                  |
                     Google ADK TypeScript
                                  |
                             DIRECTOR
                                  |
              +-------------------+-------------------+
              |                   |                   |
          ASSET AGENT         SCENE AGENT       EXPERIENCE AGENT
              |                   |                   |
              +-------------------+-------------------+
                                  |
                           VISUAL QA AGENT
                                  |
                       PERFORMANCE QA AGENT
                                  |
                        HYDRILLA TOOL LAYER
                                  |
       +--------------------------+--------------------------+
       |                          |                          |
    Asset Tools               Scene Tools                 QA Tools
       |                          |                          |
       +--------------------------+--------------------------+
                                  |
                         HYDRILLA PROJECT STATE
                                  |
                    +-------------+-------------+
                    |                           |
                  Asset IR                    Scene IR
                    |                           |
                    +-------------+-------------+
                                  |
                    +-------------+-------------+
                    |                           |
              Canonical Artifacts            Renders
                    |
          +---------+---------+
          |         |         |
         GLB       FBX       USD
          |
   Blender / Web / Games
```

---

# 142. Final Runtime Diagram

```text
Browser
   |
   |  project/session/events
   v
Hydrilla API
   |
   +-------------------------------+
   |                               |
   v                               v
Hydrilla Project Service      Hydrilla Agent Runtime
   |                               |
Postgres                        ADK Adapter
   |                               |
Object Storage                Google ADK
                                   |
                             Model Providers
                                   |
                              Tool Registry
                                   |
                +------------------+------------------+
                |                  |                  |
              Assets             Scene               QA
                |                  |                  |
             Workers            Renderer            Validators
```

---

# 143. Final Mental Model

Hydrilla is not:

```text
AI → code → Three.js
```

Hydrilla is:

```text
AI
 ↓
3D understanding
 ↓
production planning
 ↓
asset intelligence
 ↓
scene intelligence
 ↓
rendering
 ↓
visual evaluation
 ↓
refinement
 ↓
professional output
```

Three.js is the viewport/runtime.

GLB is the primary interchange artifact.

Hydrilla IR is the canonical logical state.

Google ADK is the generic agent execution infrastructure.

Hydrilla's custom 3D systems are the actual product.

---

# 144. Final Engineering Rule

When deciding between two implementations, prefer the implementation that makes this possible:

> **"A user can ask Hydrilla for a high-quality 3D result, upload any compatible GLB, combine it with generated assets, refine the entire scene, visually verify the result, and download a usable production artifact."**

Do not optimize for:

> "The agent wrote sophisticated Three.js code."

The first outcome is the product.

---

# 145. Architecture Decision Summary

| Area | Decision |
|---|---|
| Product | Browser-native AI 3D production engine |
| Agent framework | **Google ADK TypeScript** |
| Agent runtime boundary | **Hydrilla adapter around ADK** |
| Primary representation | **Scene IR + Asset IR** |
| Project source of truth | **Hydrilla Project State** |
| Browser 3D | **Three.js / React Three Fiber** |
| Primary interchange | **GLB / glTF 2.0** |
| Imported GLB | **First-class Hydrilla Asset** |
| Generated asset | **First-class Hydrilla Asset** |
| Main asset specialist | **Asset Agent** |
| Scene specialist | **Scene Agent** |
| High-level coordinator | **Director Agent** |
| Visual verification | **Visual QA Agent** |
| Runtime optimization | **Performance QA** |
| Style system | **Visual Bible** |
| Asset binaries | **Object storage** |
| Structured metadata | **Postgres** |
| Session/workflow state | **ADK + Hydrilla persistence boundary** |
| Main UI | **Chat + Viewport + Asset Library** |
| Code generation | Secondary implementation mechanism |
| Cloud model choice | **Deferred** |
| Multi-runtime strategy | **No, one agent framework in v1** |
| Primary moat | **Asset quality + scene intelligence + visual QA + production workflow** |

---

# 146. Current Verified References

These are architectural references used for this specification and should be checked again if a dependency is upgraded materially.

### Google ADK TypeScript

Official repository and current TypeScript package:

- https://github.com/google/adk-js
- https://google.github.io/adk-docs/

The current official repository describes ADK TypeScript as an open-source, code-first TypeScript toolkit for building, evaluating and deploying AI agents. It documents the `@google/adk` package, Node.js 20.19+ requirement, typed tools, browser/server support and multi-agent workflows. citeturn628024search1

### ADK sessions/state

ADK provides session and state abstractions, including TypeScript examples using `InMemorySessionService`; production persistence should use an appropriate persistent service rather than in-memory state. citeturn813038search0turn813038search1turn813038search8

### ADK artifacts

ADK provides artifact services and artifact interaction through agent/tool contexts. Hydrilla should use this for workflow artifacts where useful, while keeping large production asset binaries in Hydrilla asset storage. citeturn813038search3turn813038search11

### glTF 2.0

Khronos glTF documentation establishes glTF as a runtime/interchange format rather than an authoring format and documents its ability to represent scenes, nodes, transforms, meshes, materials, cameras, skins and animations. citeturn628024search0

### Three.js GLTFLoader / GLTFExporter

Three.js currently provides `GLTFLoader` and `GLTFExporter` for glTF 2.0. `GLTFLoader` supports multiple compression/material/texture extensions; `GLTFExporter` supports GLB output and animations. citeturn727385search3turn727385search2

### Blender

Blender's glTF import/export pipeline supports glTF 2.0 content including meshes, materials, textures, cameras and animation-related data. citeturn727385search4

---

# 147. Final One-Sentence Architecture

> **Hydrilla = Google ADK TypeScript behind a Hydrilla-owned runtime adapter + custom Director/Asset/Scene/Experience/QA agents + Asset IR + Scene IR + semantic 3D tools + Visual Bible + render/visual QA loop + persistent asset library + GLB-first production/export pipeline + browser-native Three.js/R3F experience.**
