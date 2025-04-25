# Resizable Box Component

A TypeScript library built with Vite to make HTML elements draggable and resizable, with optional wireframe support.

[Demo](https://tombigel.github.io/resize-box/)

## Features

* Drag and resize HTML elements.
* Constrain movement/sizing within a specified container element.
* Set minimum and maximum dimensions.
* Optional "wireframe" mode: interactions happen on a duplicate element, preventing layout shifts of the original during drag/resize.
* Customizable handles (add only the ones you need).
* Pointer event listeners for `onStart`, `onMove`, `onEnd` callbacks.
* Supports different resize modes: `all`, `sides`, `corners`.
* (Planned) Aspect ratio locking.

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
    type MakeWireframeResizableOptions
} from 'resize-box';

// Import the core CSS for handles and basic styling
import 'resize-box/index.css'; 
```

### 2. HTML Structure

**For direct element manipulation (`setResizableBoxEvents`):**

```html
<div id="myBox" class="resizable-box" style="position: absolute; top: 50px; left: 50px; width: 200px; height: 150px;">
    <div class="content">
        My Resizable Content
    </div>
    <!-- Add handles as needed -->
    <div class="resizable-box-handle" data-handle="top-left"></div>
    <div class="resizable-box-handle" data-handle="top-right"></div>
    <div class="resizable-box-handle" data-handle="bottom-left"></div>
    <div class="resizable-box-handle" data-handle="bottom-right"></div>
    <div class="resizable-box-handle" data-handle="top"></div>
    <div class="resizable-box-handle" data-handle="right"></div>
    <div class="resizable-box-handle" data-handle="bottom"></div>
    <div class="resizable-box-handle" data-handle="left"></div>
</div>
```

**For wireframe mode (`createDocumentWireframe` + `makeWireframeElementResizable`):**

Just have your target element in the DOM. The wireframe and handles will be created dynamically.

```html
<div id="myTargetElement" style="position: relative; width: 300px; height: 200px; border: 1px solid blue;">
   Original Content Here
</div>

<!-- Optional: Container for bounds -->
<div id="container" style="width: 80vw; height: 80vh; border: 1px dashed gray; position: relative;"></div> 
```

### 3. Initialize

**Direct Element:**

```typescript
const box = document.getElementById('myBox') as HTMLElement;

if (box) {
    const options: ResizableBoxOptions = {
        minWidth: 50,
        minHeight: 50,
        onEnd: (e) => console.log('Resized/Moved!', e)
    };
    setResizableBoxEvents(box, options);
}
```

**Wireframe Mode:**

```typescript
const targetElement = document.getElementById('myTargetElement') as HTMLElement;
const containerElement = document.getElementById('container'); // Optional

if (targetElement) {
    const [wire] = createDocumentWireframe([targetElement]);

    const options: MakeWireframeResizableOptions = {
        resize: 'all', // 'all' | 'sides' | 'corners' | 'corners-aspect'
        container: containerElement ? containerElement.id : undefined, // Optional container ID
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

1. Clone the repository.
2. Install dependencies: `npm install`
3. Run the development server (serves the demo): `npm run dev`
4. Build the library and demo: `npm run build`
5. Run tests: `npm test`

## API

### `clamp(n1: number, n2?: number, n3?: number): number`

Limits `n2` between `n1` and `n3` (bounds can be in any order). Defaults `n2` to `n1`, `n3` to `n2` if omitted.

### `createDocumentWireframe(elementsListOrSelector: HTMLElement[] | NodeListOf<HTMLElement> | string): HTMLElement[]`

Creates wireframe elements mirroring the position and size of the provided elements or selector results. Returns an array of the created wireframe elements.

### `makeWireframeElementResizable(wireElementOrId: HTMLElement | string, options?: MakeWireframeResizableOptions): void`

Adds resize handles and event listeners to a *wireframe* element.

* `options.resize`: ('all' | 'sides' | 'corners' | 'corners-aspect') - Type of handles to add (default: 'all').
* `options.container`: (string) - ID of the bounding container element.
* Inherits `ResizableBoxOptions`.

### `setResizableBoxEvents(box: HTMLElement, options?: ResizableBoxOptions): void`

Adds resize/drag event listeners directly to an existing element (which should ideally have handles defined in its HTML).

* `options.minWidth`, `options.minHeight`: Minimum dimensions (default: 10).
* `options.maxWidth`, `options.maxHeight`: Maximum dimensions (default: container width/height).
* `options.onStart`, `options.onMove`, `options.onEnd`: Callback functions for pointer events.
* The element can have `data-resizable-container="containerId"` and `data-resizable-aspect="keep"` attributes.

### `index.css`

Provides necessary CSS for handles and basic states (`data-dragging`). You should import this.
