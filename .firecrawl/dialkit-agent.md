dialkit.md

````
# DialKit

> Live controls for tuning interfaces. Adjust values, compare versions, and edit animation timing in your running app.

DialKit is an open-source library created by [Josh Puckett](https://joshpuckett.me), author of [Interface Craft](https://interfacecraft.dev/). It is available under the MIT license.

- Website: https://dialkit.dev
- Package: dialkit (npm)
- Source and README: https://github.com/joshpuckett/dialkit
- API reference: https://github.com/joshpuckett/dialkit/blob/main/docs/reference.md
- Timeline guide: https://github.com/joshpuckett/dialkit/blob/main/docs/timeline.md
- Interactive demo: https://dialkit.dev/photostack

## What it is for

DialKit helps designers, developers, and coding agents make interface details feel right. Put live controls beside the interface you are building, connect them to real values in your code, and tune the result by eye instead of repeatedly editing constants and reloading.

Use it to adjust:

- Layout: spacing, padding, dimensions, grid gaps, and corner radii.
- Appearance: colors, shadows, opacity, images, and typography.
- Motion: spring duration, bounce, easing curves, scale, and position.
- Animation sequences: clip timing, overlapping animations, and individual property tracks.
- Alternatives: save versions, compare them, and copy the chosen values back into source code.

DialKit supplies the controls and live values. Your component uses those values in its styles, animation library, or rendering code. It can be added to an existing interface or used while building a new one.

## Workflow for coding agents

1. Inspect the project to identify its framework, package manager, and existing component conventions.
2. Read the DialKit README and API reference for the installed version before using an unfamiliar API.
3. Install the matching adapter dependencies below, using the project's package manager.
4. Mount one DialKit root and load the adapter's styles. In Next.js App Router, put interactive DialKit code in a client component.
5. Add a small, useful set of controls to the component being tuned. Start with its existing values and choose sensible ranges and steps.
6. Bind the returned live values to the actual styles or animation properties. Preserve the framework's reactivity rules.
7. Group related controls in folders. Add a replay action when an animation needs to be triggered again.
8. Let the user tune and compare versions. When given copied DialKit values, apply them to the corresponding defaults or production code.
9. Check the interface and run the project's build or relevant checks.

## Installation and basic usage

Supported frameworks: React 18+, Solid 1.6+, Svelte 5.8+, Vue 3.3+, and plain JavaScript. The vanilla adapter has no runtime dependencies.

The examples below use npm. Use the equivalent add command for pnpm, Yarn, or Bun when that is the project's package manager.

### React

```bash
npm install dialkit motion
```

Mount one DialRoot and use the useDialKit hook to bind live values to your interface. In Next.js App Router, use a client component.

```tsx
'use client'

import { DialRoot, useDialKit } from 'dialkit'
import 'dialkit/styles.css'

export default function App() {
const values = useDialKit('Card', {
    radius: [24, 0, 64],
    color: '#a78bfa',
})

return (
    <>
      <div style={{
        borderRadius: values.radius,
        background: values.color,
      }}>
        Card
      </div>
      <DialRoot />
    </>
)
}
```

### Solid

```bash
npm install dialkit motion
```

Mount one DialRoot and call createDialKit in your component. It returns an accessor: read live values with values().radius.

```tsx
import { createDialKit, DialRoot } from 'dialkit/solid'
import 'dialkit/styles.css'

export default function App() {
const values = createDialKit('Card', {
    radius: [24, 0, 64],
})

return (
    <>
      <div style={{ 'border-radius': values().radius + 'px' }}>Card</div>
      <DialRoot />
    </>
)
}
```

### Svelte

```bash
npm install dialkit
```

Read live values directly from the reactive object. DialRoot injects the styles automatically, so there’s no CSS import or extra dependency.

```svelte
<script>
import { createDialKit, DialRoot } from 'dialkit/svelte'

const values = createDialKit('Card', {
    radius: [24, 0, 64],
})
</script>

<div style:border-radius={values.radius + 'px'}>Card</div>
<DialRoot />
```

### Vue

```bash
npm install dialkit motion motion-v
```

Mount one DialRoot and use the useDialKit hook. Values are a computed ref: read values.value.radius in script; templates unwrap it automatically.

```vue
<script setup>
import { DialRoot, useDialKit } from 'dialkit/vue'
import 'dialkit/styles.css'

const values = useDialKit('Card', {
radius: [24, 0, 64],
})
</script>

<template>
<div :style="{ borderRadius: values.radius + 'px' }">Card</div>
<DialRoot />
</template>
```

### JavaScript

```bash
npm install dialkit
```

No framework or runtime dependencies. Add an element with id="card" to your page, then subscribe to apply values immediately and whenever they change.

```js
import { createDialKit, createDialRoot } from 'dialkit/vanilla'
import 'dialkit/vanilla/styles.css'

const card = document.querySelector('#card')
const root = createDialRoot()
const kit = createDialKit('Card', {
radius: [24, 0, 64],
})

kit.subscribe(values => {
card.style.borderRadius = values.radius + 'px'
})

// When removing the controls from the page:
// kit.destroy()
// root.destroy()
```

## Defining controls

Define controls with an object. Keys become labels, and returned values preserve the same nesting. Slider tuples are [default, min, max, step?].

```ts
const config = {
radius: [24, 0, 64],
gap: [16, 0, 48, 2],
visible: true,
title: 'Hello',
accent: '#a78bfa',
layout: { type: 'select', options: ['stack', 'grid'] },
cover: { type: 'image', options: ['/cover.jpg'] },
position: { type: 'pad' },
spring: { type: 'spring', visualDuration: 0.3, bounce: 0.2 },
easing: { type: 'easing', duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
replay: { type: 'action' },
shadow: {
    _collapsed: true,
    blur: [12, 0, 40],
    opacity: [0.15, 0, 1, 0.01],
},
}
```

- Numbers and slider tuples return numbers; booleans return booleans.
- Text, colors, selects, and images return strings. A pad returns an object with x and y values.
- A nested object creates a folder; read nested values such as values.shadow.blur.
- _collapsed is folder metadata and is omitted from returned values.
- Spring and easing controls return transition configurations. Bind them to the animation you are tuning.
- Actions call the panel's onAction callback with the control path, such as 'replay'.
- For a separate TypeScript config, use satisfies DialConfig with the type imported from your adapter to retain useful inference.

## Panel options and saved versions

React and Vue use useDialKit(name, config, options). Solid, Svelte, and vanilla use createDialKit(name, config, options).

Common options:

- id: a stable panel ID for sharing values across mounts.
- persist: save values and versions in browser storage; defaults to false.
- defaultCollapsed: set to true to start a panel closed.
- onAction: handle an action button's control path.
- shortcuts: assign keyboard shortcuts by control path.

For example, in React:

```tsx
const values = useDialKit('Card', {
radius: [24, 0, 64],
replay: { type: 'action' },
}, {
id: 'card',
persist: true,
onAction: (path) => {
    if (path === 'replay') replayAnimation()
},
})
```

Here replayAnimation is your component's animation restart function.

The panel's + button saves a version. Edits update the selected version. Copy puts current values and an instruction for applying them to the config on the clipboard. Copying values does not edit source files automatically.

For updates from code, use useDialKitController in React or Vue, or createDialKitController in Solid or Svelte. The vanilla createDialKit function already returns a controller. Controllers support setValue, setValues, resetValues, and setOpen.

## Root placement and production behavior

Mount one DialRoot for the app's control panels. The root supports position ('top-right', 'top-left', 'bottom-right', or 'bottom-left'), theme ('system', 'light', or 'dark'), and mode ('popover' or 'inline').

```tsx
<DialRoot position="top-right" theme="dark" />
```

Framework roots are hidden in production unless productionEnabled is true. Vanilla roots are visible by default; pass productionEnabled: false to hide them. This setting controls the editor UI; it does not remove the code consuming live values.

In vanilla, call kit.destroy() and root.destroy() when removing their controls. Keep the root and controls on the same adapter entry so they share a store.

## Animation timelines

Use a timeline when tuning the timing of an animation sequence. Define named clips with at, duration, from, to, and transition, then bind each clip's current values to the interface so it follows the playhead.

```tsx
'use client'

import { DialTimeline, useDialTimeline } from 'dialkit'
import 'dialkit/styles.css'

export default function Card() {
const timeline = useDialTimeline('Card', {
    enter: {
      at: 0,
      duration: 0.6,
      from: { y: 24, opacity: 0 },
      to: { y: 0, opacity: 1 },
      transition: { type: 'spring', bounce: 0.2 },
    },
})

return (
    <>
      <div style={{
        opacity: timeline.enter.current.opacity,
        transform: 'translateY(' + timeline.enter.current.y + 'px)',
      }}>
        Card
      </div>
      <DialTimeline />
    </>
)
}
```

React and Vue use useDialTimeline. Solid, Svelte, and vanilla use createDialTimeline. Follow the adapter's reactive access pattern: timeline.enter.current in React and Svelte, timeline().enter.current in Solid, timeline.value.enter.current in Vue script, and timeline.values.enter.current or subscribe in vanilla.

Mount DialTimeline once, or createDialTimelineRoot() in vanilla. The timeline dock works independently of DialRoot. Use play(), pause(), replay(), and seek(seconds) to control playback. It supports scrubbing, moving and resizing clips, groups, loops, versions, and persistence.

After tuning, use Copy to transfer the chosen settings into the production animation. Replace sampled current bindings before removing the timeline; hiding the dock alone leaves them running. See the timeline guide for the full API.

## Example requests

- Add DialKit to this hover animation so I can tune spring duration, bounce, scale, and shadow blur.
- Add sliders for this grid's gap, padding, column count, and card radius. Group card controls in a folder.
- Add a timeline for this card entrance so I can scrub and adjust when the text and image appear.
- Apply these copied DialKit values to the component's defaults.

## Further reading

- [README and quick start](https://github.com/joshpuckett/dialkit#readme)
- [Full API reference](https://github.com/joshpuckett/dialkit/blob/main/docs/reference.md)
- [Timeline guide](https://github.com/joshpuckett/dialkit/blob/main/docs/timeline.md)
- [Plain JavaScript example](https://github.com/joshpuckett/dialkit/tree/main/examples/vanilla)
- [Report an issue](https://github.com/joshpuckett/dialkit/issues)
- [MIT license](https://github.com/joshpuckett/dialkit/blob/main/LICENSE)
````