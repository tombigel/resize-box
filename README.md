# Resizable Box Component

A TypeScript library built with Vite to make HTML elements draggable and resizable, with optional wireframe support.

[Demo](https://tombigel.github.io/resize-box/)

## Features

*   Drag and/or resize HTML elements (can be enabled independently).
*   Constrain movement/sizing within a specified container element.
*   Set minimum and maximum dimensions.
*   Optional "wireframe" mode: interactions happen on a duplicate element, preventing layout shifts of the original during drag/resize.
*   Customizable handles (add only the ones you need: `all`, `sides`, `corners`, specific list, or `none`).
*   Pointer event listeners for `onStart`, `onMove`, `onEnd` callbacks.
*   Optional aspect ratio locking.

## Installation

```bash
npm install resize-box # Or your preferred package manager
# Or directly use from CDN (e.g., jsDelivr - check releases for URLs)
```

## Usage

### 1. Import Functions and CSS

```typescript
import {
    setResizableBoxEvents, 
    createDocumentWireframe, 
    makeWireframeElementResizable, 
    type ResizableBoxOptions,
    type MakeWireframeResizableOptions,
    type HandleName,
    type ResizeHandlesOption
} from 'resize-box';

// Import the core CSS for handles and basic styling
import 'resize-box/index.css'; 
```

### 2. HTML Structure

**For direct element manipulation (`setResizableBoxEvents`):**

Requires handles to be present in the HTML if resizing is needed.

```html
<div id="myBox" class="resizable-box" style="position: absolute; top: 50px; left: 50px; width: 200px; height: 150px;">
    <div class="content">
        Draggable and Resizable
    </div>
    <!-- Add handles as needed -->
    <div class="resizable-box-handle" data-handle="top-left"></div>
    <div class="resizable-box-handle" data-handle="top-right"></div>
    <div class="resizable-box-handle" data-handle="bottom-left"></div>
    <div class="resizable-box-handle" data-handle="bottom-right"></div>
    <!-- <div class="resizable-box-handle" data-handle="top"></div> ... -->
</div>

<div id="dragOnlyBox" style="position: absolute; top: 250px; left: 50px; width: 100px; height: 100px;">
    Draggable Only
</div>
```

**For wireframe mode (`createDocumentWireframe` + `makeWireframeElementResizable`):**

Just have your target element in the DOM. The wireframe and handles (if specified) will be created dynamically.

```html
<div id="myTargetElement" style="position: relative; width: 300px; height: 200px; border: 1px solid blue;">
   Original Content Here (Wireframe Resize)
</div>

<!-- Optional: Container for bounds -->
<div id="container" style="width: 80vw; height: 80vh; border: 1px dashed gray; position: relative;"></div> 
```

### 3. Initialize

**Direct Element:**

```typescript
const box = document.getElementById('myBox') as HTMLElement;
const dragOnlyBox = document.getElementById('dragOnlyBox') as HTMLElement;

if (box) {
    // Draggable and resizable (corners only)
    const options: ResizableBoxOptions = {
        minWidth: 50,
        minHeight: 50,
        draggable: true, // Default is true anyway
        keepAspectRatio: false,
        onEnd: (e) => console.log('Box Resized/Moved!', e)
    };
    setResizableBoxEvents(box, options);
}

if (dragOnlyBox) {
    // Draggable only, no resize handles needed in HTML or options
    setResizableBoxEvents(dragOnlyBox, { draggable: true });
}
```

**Wireframe Mode:**

```typescript
const targetElement = document.getElementById('myTargetElement') as HTMLElement;
const containerElement = document.getElementById('container'); // Optional

if (targetElement) {
    const [wire] = createDocumentWireframe([targetElement]);

    const options: MakeWireframeResizableOptions = {
        handles: ['top-left', 'bottom-right'], // Specify only TL and BR handles
        draggable: false, // Make wireframe non-draggable itself (only handles work)
        keepAspectRatio: true, // Lock aspect ratio
        container: containerElement?.id, // Use optional chaining
        minWidth: 100,
        minHeight: 80,
        onStart: () => console.log('Start'),
        onMove: () => console.log('Move'),
        onEnd: () => console.log('End')
    };
    makeWireframeElementResizable(wire, options);
}
```

## Development

1.  Clone the repository.
2.  Install dependencies: `npm install`
3.  Run the development server (serves the demo): `npm run dev`
4.  Build the library and demo: `npm run build`
5.  Run tests: `npm test`

## API

### Types

*   `HandleName`: `'top' | 'left' | 'bottom' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'`
*   `ResizeHandlesOption`: `'all' | 'sides' | 'corners' | 'none' | HandleName[]`
*   `ResizableBoxOptions`: Interface defining options for `setResizableBoxEvents`.
*   `MakeWireframeResizableOptions`: Interface defining options for `makeWireframeElementResizable`.

### Core Functions

#### `setResizableBoxEvents(box: HTMLElement, options?: ResizableBoxOptions): void`

Adds resize and/or drag event listeners directly to an existing HTML element. If resizing is desired, handle elements (`<div class="resizable-box-handle" data-handle="..."></div>`) must exist within the `box` element's HTML structure.

**Options (`ResizableBoxOptions`)**

| Option                | Type                       | Default                        | Description                                                                                                |
| :-------------------- | :------------------------- | :----------------------------- | :--------------------------------------------------------------------------------------------------------- |
| `draggable`           | `boolean`                  | `true`                         | Whether the element itself is draggable via pointer events on its body.                                      |
| `keepAspectRatio`     | `boolean`                  | `false`                        | Maintains the element's aspect ratio during resize operations. Also reads `data-resizable-aspect="keep"`.    |
| `invertOnContainerEdge`| `boolean`                  | `false`                        | If `true`, dragging a handle past the container edge continues resizing from the opposite edge.          |
| `minWidth`            | `number`                   | `10`                           | Minimum allowed width in pixels.                                                                           |
| `minHeight`           | `number`                   | `10`                           | Minimum allowed height in pixels.                                                                          |
| `maxWidth`            | `number`                   | Container's `offsetWidth`      | Maximum allowed width in pixels. Defaults to the width of the container element.                           |
| `maxHeight`           | `number`                   | Container's `offsetHeight`     | Maximum allowed height in pixels. Defaults to the height of the container element.                         |
| `onStart`             | `(e: PointerEvent) => void`| `undefined`                    | Callback function triggered on `pointerdown` (start of drag/resize).                                       |
| `onMove`              | `(e: PointerEvent) => void`| `undefined`                    | Callback function triggered on `pointermove` during drag/resize.                                           |
| `onEnd`               | `(e: PointerEvent) => void`| `undefined`                    | Callback function triggered on `pointerup` or `pointercancel` (end of drag/resize).                        |

*Note: The container element is determined by the `data-resizable-container="containerId"` attribute on the `box` element, defaulting to `document.body` if the attribute or the specified element is not found.*

#### `createDocumentWireframe(elementsListOrSelector: HTMLElement[] | NodeListOf<HTMLElement> | string): HTMLElement[]`

Creates wireframe `div` elements that visually mirror the position and size of the provided target elements. It automatically handles creating layers and synchronizing styles. Returns an array of the created wireframe elements. Wireframe elements will have IDs like `wire-{originalElementId}`.

#### `makeWireframeElementResizable(wireElementOrId: HTMLElement | string, options?: MakeWireframeResizableOptions): void`

Adds resize handles, draggability, and event listeners to a *wireframe* element previously created by `createDocumentWireframe`. The wireframe then controls the size and position of its corresponding original element.

**Options (`MakeWireframeResizableOptions`)**

These options extend `ResizableBoxOptions`, inheriting all its properties and defaults (`draggable`, `keepAspectRatio`, `invertOnContainerEdge`, `minWidth`, etc.), with the following additions/overrides:

| Option      | Type                  | Default     | Description                                                                                                                                  |
| :---------- | :-------------------- | :---------- | :------------------------------------------------------------------------------------------------------------------------------------------- |
| `handles`   | `ResizeHandlesOption` | `'all'`     | Specifies which resize handles to add to the wireframe. Can be `'all'`, `'sides'`, `'corners'`, `'none'`, or an array of `HandleName` strings. |
| `container` | `string`              | `undefined` | The `id` of the HTML element to use as the bounding container for dragging and resizing. Overrides any container set via data attributes.    |

*Note: `keepAspectRatio` and `draggable` options apply to the wireframe's behavior. The original element remains static until the drag/resize operation on the wireframe ends.*

### Utility Functions

#### `clamp(n1: number, n2?: number, n3?: number): number`

A utility function that limits a number (`n2`) between two bounds (`n1` and `n3`). The order of bounds doesn't matter. Defaults `n2` to `n1` and `n3` to `n2` if omitted.

### CSS

#### `index.css`

Provides necessary base CSS for handles, wireframe layers, and dragging states (e.g., `[data-dragging]`). This file should be imported into your project for the component to function correctly.
