# Resizable Box Component

A TypeScript library built with Vite to make HTML elements draggable and resizable, with optional wireframe support.

[Demo](https://tombigel.github.io/resize-box/)

## Features

*   Drag and/or resize HTML elements (can be enabled independently).
*   Constrain movement/sizing within a specified container element.
*   Set minimum and maximum dimensions.
*   Optional "wireframe" mode for interaction without direct element layout shifts.
*   Customizable handles (`all`, `sides`, `corners`, specific list, or `none`).
*   Pointer event listeners for `onStart`, `onMove`, `onEnd` callbacks.
*   Optional aspect ratio locking.

## Understanding Wireframe Mode

Wireframe mode offers a way to interact (drag/resize) without directly manipulating the original element's style during the interaction.

1.  **`createDocumentWireframe`**: Creates a lightweight, transparent `div` (the "wireframe") positioned exactly over your target element.
2.  **`makeWireframeElementResizable`**: Adds handles and event listeners to this *wireframe*.
3.  **Interaction**: You drag or resize the wireframe.
4.  **Synchronization**: When the interaction ends (`onEnd`), the wireframe's final size and position are applied to the original target element.

This prevents layout reflows of the original element and its surroundings during mouse/touch movement, providing a smoother experience, especially in complex layouts.

## Installation

```bash
npm install resize-box # Or your preferred package manager
# Or directly use from CDN (e.g., jsDelivr - check releases for URLs)
```

## Usage

**1. Import & CSS:**

```typescript
import {
    setResizableBoxEvents,
    createDocumentWireframe,
    makeWireframeElementResizable,
    // Import types if needed: ResizableBoxOptions, MakeWireframeResizableOptions, etc.
} from 'resize-box';

// Import the core CSS for essential layout and functionality
import 'resize-box/index.css'; 

// Optional: Import the default theme for visual styling
// import 'resize-box/theme.css'; 
```

**2. Example: Wireframe Resizing**

This is often the preferred method for complex layouts.

*HTML:*

```html
<!-- The element you want to make resizable -->
<div id="myTargetElement" style="position: relative; width: 300px; height: 200px; border: 1px solid blue;">
   Original Content Here
</div>

<!-- Optional: Container for bounds -->
<div id="container" style="width: 80vw; height: 80vh; border: 1px dashed gray; position: relative;"></div>
```

*TypeScript:*

```typescript
const targetElement = document.getElementById('myTargetElement') as HTMLElement;
const containerElement = document.getElementById('container'); // Optional

if (targetElement) {
    // Create the wireframe element(s)
    const [wire] = createDocumentWireframe([targetElement]); // Returns an array of wireframes

    // Make the wireframe interactive
    makeWireframeElementResizable(wire, {
        handles: 'all',              // Add all handles
        container: containerElement?.id, // Constrain to container
        minWidth: 100,
        minHeight: 80,
        keepAspectRatio: false,
        onStart: () => console.log('Start wireframe interaction'),
        onEnd: () => console.log('End wireframe interaction, target updated')
    });
}
```

**3. Alternative: Direct Element Manipulation**

Use `setResizableBoxEvents` for simpler cases or when you want direct style updates during interaction. Requires handles in the HTML.

*HTML:*

```html
<div id="myBox" class="resizable-box" style="position: absolute; top: 50px; left: 50px; width: 200px; height: 150px;">
    <div class="content">Draggable & Resizable</div>
    <!-- Add handles manually -->
    <div class="resizable-box-handle" data-handle="top-left"></div>
    <div class="resizable-box-handle" data-handle="bottom-right"></div>
    <!-- ... add other handles as needed -->
</div>
```

*TypeScript:*

```typescript
const box = document.getElementById('myBox') as HTMLElement;
if (box) {
    setResizableBoxEvents(box, {
        draggable: true, // Also draggable
        minWidth: 50,
        minHeight: 50,
        // Handles are detected from HTML (data-handle attributes)
        onEnd: (e) => console.log('Box Resized/Moved!', e)
    });
}
```

## API Reference

### Core Functions

*   **`setResizableBoxEvents(box: HTMLElement, options?: ResizableBoxOptions): void`**
    Adds resize/drag listeners directly to an element. Requires HTML handles (`<div class="resizable-box-handle" data-handle="..."></div>`) for resizing.

*   **`createDocumentWireframe(elementsListOrSelector: HTMLElement[] | NodeListOf<HTMLElement> | string): HTMLElement[]`**
    Creates wireframe `div`s mirroring target elements. Returns an array of created wireframes (IDs: `wire-{originalId}`).

*   **`makeWireframeElementResizable(wireElementOrId: HTMLElement | string, options?: MakeWireframeResizableOptions): void`**
    Makes a wireframe element interactive, controlling its original target element.

### Options: `ResizableBoxOptions` (for `setResizableBoxEvents`)

| Option                | Type                       | Default                        | Description                                                                                         |
| :-------------------- | :------------------------- | :----------------------------- | :-------------------------------------------------------------------------------------------------- |
| `draggable`           | `boolean`                  | `true`                         | Allow dragging the element body.                                                                    |
| `keepAspectRatio`     | `boolean`                  | `false`                        | Maintain aspect ratio on resize. Reads `data-resizable-aspect="keep"`.                           |
| `invertOnContainerEdge`| `boolean`                  | `false`                        | Continue resizing from opposite edge if handle crosses container boundary.                           |
| `minWidth`            | `number`                   | `10`                           | Minimum width (px).                                                                                 |
| `minHeight`           | `number`                   | `10`                           | Minimum height (px).                                                                                |
| `maxWidth`            | `number`                   | Container `offsetWidth`      | Maximum width (px). Defaults to container width.                                                  |
| `maxHeight`           | `number`                   | Container `offsetHeight`     | Maximum height (px). Defaults to container height.                                                |
| `onStart`             | `(e: PointerEvent) => void`| `undefined`                    | Callback on `pointerdown`.                                                                        |
| `onMove`              | `(e: PointerEvent) => void`| `undefined`                    | Callback on `pointermove` during interaction.                                                     |
| `onEnd`               | `(e: PointerEvent) => void`| `undefined`                    | Callback on `pointerup` or `pointercancel`.                                                       |
*Container is found via `data-resizable-container="containerId"` on the box, else `document.body`.*

### Options: `MakeWireframeResizableOptions` (for `makeWireframeElementResizable`)

Extends `ResizableBoxOptions` with these additions/overrides:

| Option      | Type                  | Default     | Description                                                                                              |
| :---------- | :-------------------- | :---------- | :------------------------------------------------------------------------------------------------------- |
| `handles`   | `ResizeHandlesOption` | `'all'`     | Which resize handles to add: `'all'`, `'sides'`, `'corners'`, `'none'`, or `HandleName[]`.                 |
| `container` | `string`              | `undefined` | ID of the bounding container element. Overrides `data-resizable-container`.                           |
*Note: `draggable`, `keepAspectRatio`, etc., apply to the *wireframe's* interaction.*

### Types & Utilities

*   **`HandleName`**: `'top' | 'left' | 'bottom' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'`
*   **`ResizeHandlesOption`**: `'all' | 'sides' | 'corners' | 'none' | HandleName[]`
*   **`clamp(n1: number, n2?: number, n3?: number): number`**: Utility to limit a number between two bounds.

## Styling

The library separates styling into two files:

1.  **`index.css` (Required):** Provides essential layout, positioning, and functionality styles for handles, wireframes, and states (like `[data-dragging]`). You *must* import this file.

    ```typescript
    import 'resize-box/index.css';
    ```

2.  **`theme.css` (Optional):** Provides a default visual theme (colors, borders, handle appearance). You can:
    *   Import the default theme:
        ```typescript
        import 'resize-box/theme.css';
        ```
    *   Skip importing `theme.css` and create your own styles targeting the component's classes (e.g., `.resizable-box-handle`, `.resizable-box-wireframe`).
    *   Import the default theme and override specific styles in your own CSS file loaded afterwards.

Key selectors for theming:
*   `.resizable-box-handle`
*   `.resizable-box-wireframe`
*   `.resizable-box` (when using direct manipulation)
*   `[data-dragging]`

## Examples

**Drag Only (No Resize):**

Uses the wireframe approach, disabling handles.

```typescript
// Wireframe (Handles disabled)
const [wire] = createDocumentWireframe([myElement]);
makeWireframeElementResizable(wire, { draggable: true, handles: 'none' });
```

**Resize Only (Corners), Lock Aspect Ratio:**

Uses the wireframe approach, disabling body dragging and specifying corner handles.

```typescript
// Wireframe
const [wire] = createDocumentWireframe([myElement]);
makeWireframeElementResizable(wire, {
    draggable: false,         // Disable dragging the body
    handles: 'corners',       // Only corner handles
    keepAspectRatio: true
});
```

**Specific Handles (Top and Bottom):**

Uses the wireframe approach, providing an array of specific handles.

```typescript
// Wireframe
const [wire] = createDocumentWireframe([myElement]);
makeWireframeElementResizable(wire, { handles: ['top', 'bottom'] });
```

## Development

1.  Clone the repository.
2.  Install dependencies: `npm install`
3.  Run the development server (serves the demo): `npm run dev`
4.  Build the library and demo: `npm run build`
5.  Run tests: `npm test`
