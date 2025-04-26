import type { HandleName, MakeWireframeResizableOptions, Rects, ResizableBoxOptions } from './types';
import { clamp, randomId } from './utils';

const dragObserver = new MutationObserver((mutationList, observer) => {
    mutationList.forEach((mutation) => {
        const src = mutation.target as HTMLElement;
        if (!src.dataset) return; // Type guard
        const target = document.getElementById(src.dataset.compId || src.dataset.wireId || '') as HTMLElement | null;

        if (!target) {
            observer.disconnect();
            return;
        }

        target.style.top = src.style.top;
        target.style.left = src.style.left;
        target.style.width = src.style.width;
        target.style.height = src.style.height;
    });
});

/**
 * Create wireframes
 * We create a separate wireframe layer for each offset-parent of the collected elements
 * This way we don't need to worry about observing document layout changes (at least theoretically)
 * @param {HTMLElement[] | NodeListOf<HTMLElement> | string} elementsListOrSelector A list of elements or a selector
 * @returns {HTMLElement[]}
 */
export function createDocumentWireframe(elementsListOrSelector: HTMLElement[] | NodeListOf<HTMLElement> | string): HTMLElement[] {
    // Item template
    const itemLayer = document.createElement('div');
    itemLayer.className = 'wireframe-layer';

    // Layer template
    const item = document.createElement('div');
    item.className = 'wireframe-layer-item';

    // Collect elements
    const elements: HTMLElement[] = [
        ...(typeof elementsListOrSelector === 'string'
            ? (document.querySelectorAll(elementsListOrSelector) as NodeListOf<HTMLElement>) || []
            : elementsListOrSelector),
    ];

    // Create wires
    const wires = elements.map((element) => {
        const wire = item.cloneNode() as HTMLElement;
        const parent = element.parentNode as HTMLElement | null;
        if (!parent) throw new Error('Element must have a parent node');

        // Get or Create a layer
        const layer = (parent.querySelector('.wireframe-layer') || itemLayer.cloneNode()) as HTMLElement;

        // No IDs? create unique ones
        layer.id = layer.id || `wireframe-layer-${randomId()}`;
        element.id = element.id || `comp-${randomId()}`;

        const id = element.id;
        const wireId = `wire-${id}`;

        // Set element id, corresponding wire id and initial element position and size
        element.dataset.wireId = wireId;

        element.style.position = 'absolute'; // Ensure positioning context
        element.style.top = `${element.offsetTop}px`;
        element.style.left = `${element.offsetLeft}px`;
        element.style.width = `${element.offsetWidth}px`;
        element.style.height = `${element.offsetHeight}px`;

        // Set wire id, corresponding element id and initial wire position and size
        wire.id = wireId;
        wire.dataset.compId = id;

        wire.style.position = 'absolute'; // Ensure positioning context for wireframe
        wire.style.top = element.style.top;
        wire.style.left = element.style.left;
        wire.style.width = element.style.width;
        wire.style.height = element.style.height;

        // Add wire to layer
        layer.appendChild(wire);

        // Add layer to parent if needed
        if (!parent.contains(layer)) {
            parent.appendChild(layer);
        }

        // If element style changes update wire
        dragObserver.observe(element, {
            attributes: true,
            attributeFilter: ['style'],
        });

        // IF wire style changes update element
        dragObserver.observe(wire, {
            attributes: true,
            attributeFilter: ['style'],
        });

        return wire;
    });

    return wires;
}

/**
 * Make a wireframe element resizable
 * @param {HTMLElement|string} wireElementOrId the wireframe box to resize
 * @param {MakeWireframeResizableOptions} options
 */
export function makeWireframeElementResizable(
    wireElementOrId: HTMLElement | string,
    {
        handles = 'all',
        container,
        keepAspectRatio = false,
        ...rest // Captures ResizableBoxOptions (including draggable)
    }: MakeWireframeResizableOptions = {}
): void {
    const wire = typeof wireElementOrId === 'string' ? document.getElementById(wireElementOrId) : wireElementOrId;

    if (!wire || !(wire instanceof HTMLElement) || !wire.dataset.compId) {
        throw new Error(`${wireElementOrId} is not a valid wireframe element or ID`);
    }

    const element = document.getElementById(wire.dataset.compId);
    if (!element) {
        throw new Error(`Could not find original element with ID: ${wire.dataset.compId}`);
    }
    element.style.position = 'absolute';

    wire.dataset.resizable = 'resizable';

    if (container) {
        wire.dataset.resizableContainer = container;
    }

    wire.innerHTML = '';

    let handlesToAdd: HandleName[] = [];
    const allSides: HandleName[] = ['top', 'right', 'bottom', 'left'];
    const allCorners: HandleName[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

    if (handles === 'all') {
        handlesToAdd = [...allSides, ...allCorners];
    } else if (handles === 'sides') {
        handlesToAdd = [...allSides];
    } else if (handles === 'corners') {
        handlesToAdd = [...allCorners];
    } else if (Array.isArray(handles)) {
        handlesToAdd = handles;
    } // 'none' or other invalid string results in no handles

    handlesToAdd.forEach(handleName => {
        wire.innerHTML += `<div class="resizable-box-handle" data-handle="${handleName}"></div>`;
    });

    if (keepAspectRatio) {
        wire.dataset.resizableAspect = 'keep';
    } else {
        delete wire.dataset.resizableAspect;
    }

    setResizableBoxEvents(wire, { keepAspectRatio, ...rest });
}

/**
 * Sets up pointer events for resizing and dragging a box element.
 * Expects a specific HTML structure with optional handles.
 * @param {HTMLElement} box The element to make resizable/draggable.
 * @param {ResizableBoxOptions} options Configuration options.
 */
export function setResizableBoxEvents(
    box: HTMLElement,
    {
        minWidth = 10,
        minHeight = 10,
        maxWidth,
        maxHeight,
        draggable = true,
        keepAspectRatio = false,
        invertOnContainerEdge = false,
        onStart,
        onMove,
        onEnd
    }: ResizableBoxOptions = {}
): void {
    const container = document.getElementById(box.dataset.resizableContainer || '') || document.body;

    // Set data attribute based on draggable option for CSS cursor styling
    if (!draggable) {
        box.dataset.resizableDraggable = 'false';
    } else {
        // Ensure attribute is removed if it was set previously and draggable is now true
        delete box.dataset.resizableDraggable;
    }

    // Set data attribute for inversion behavior
    if (invertOnContainerEdge) {
        box.dataset.resizableInvert = 'invert';
    } else {
        delete box.dataset.resizableInvert;
    }

    // Aspect ratio check (reads from option OR data attribute)
    const shouldKeepAspect = keepAspectRatio || box.dataset.resizableAspect === 'keep';
    const initialAspectRatio = shouldKeepAspect ? box.offsetWidth / box.offsetHeight : 0;

    maxWidth = maxWidth ?? container.offsetWidth;
    maxHeight = maxHeight ?? container.offsetHeight;

    // Conditionally include the box for dragging
    const handleElements: HTMLElement[] = [...box.querySelectorAll<HTMLElement>('[data-handle]')];
    if (draggable) {
        handleElements.push(box);
    }

    const parent = box.offsetParent as HTMLElement | null;

    if (!parent || !container.contains(parent)) {
        console.error('Resizable box must have an offsetParent contained within the specified container or document.body');
        return;
    }

    // Initialize rects structure with proper types
    const rects: Rects = {
        container: {} as DOMRect,
        parent: {} as DOMRect,
        initial: { top: 0, left: 0, width: 0, height: 0 },
        diff: { left: 0, top: 0 },
        start: { left: 0, top: 0 },
        min: { width: minWidth, height: minHeight }, // Use provided min values
        max: { width: maxWidth, height: maxHeight }, // Use resolved max values
    };

    handleElements.forEach((handle) => {
        handle.addEventListener(
            'pointerdown',
            (event: PointerEvent) => {
                // Ensure event target is an HTMLElement with dataset
                const target = event.target as HTMLElement;
                if (!target || !target.dataset) return;

                event.preventDefault(); // Prevent default actions like text selection
                event.stopPropagation(); // Prevent triggering other listeners (e.g., if nested)

                rects.container = container.getBoundingClientRect();
                rects.parent = parent.getBoundingClientRect();
                rects.initial = {
                    top: box.offsetTop,
                    left: box.offsetLeft,
                    width: box.offsetWidth,
                    height: box.offsetHeight,
                };
                rects.diff = {
                    left: rects.parent.left - rects.container.left,
                    top: rects.parent.top - rects.container.top,
                };
                rects.start = {
                    // Use pointer position relative to the document
                    left: event.clientX,
                    top: event.clientY,
                };

                const corner = target.dataset.handle || ''; // Empty string means dragging the box itself
                // Pass aspect ratio info and edge behavior option to moveBox
                const handleMove = moveBox.bind(null, box, corner, rects, onMove, shouldKeepAspect, initialAspectRatio, invertOnContainerEdge);

                container.dataset.draggingWithin = 'true';
                box.dataset.dragging = 'true';
                box.style.willChange = 'top, left, width, height'; // Performance hint

                onStart?.(event);

                container.setPointerCapture(event.pointerId);
                container.addEventListener('pointermove', handleMove);

                const handlePointerUp = (e: PointerEvent) => {
                    // Check if it's the same pointer that started the drag
                    if (e.pointerId !== event.pointerId) return;

                    e.preventDefault();
                    delete container.dataset.draggingWithin;
                    delete box.dataset.dragging;
                    box.style.willChange = 'auto';

                    container.releasePointerCapture(event.pointerId);
                    container.removeEventListener('pointermove', handleMove);
                    container.removeEventListener('pointerup', handlePointerUp); // Remove this specific listener

                    onEnd?.(e);
                };

                container.addEventListener('pointerup', handlePointerUp);
            },
            { capture: true } // Use capture phase to catch events early
        );
    });
}

function moveBox(
    box: HTMLElement,
    corner: string,
    rects: Rects,
    onMove: ((e: PointerEvent) => void) | undefined,
    shouldKeepAspect: boolean,
    aspectRatio: number,
    invertOnContainerEdge: boolean,
    event: PointerEvent
): void {
    // Use pointer position relative to the document (clientX/clientY)
    const currentX = event.clientX;
    const currentY = event.clientY;

    const startLeft = typeof rects.start.left === 'number' ? rects.start.left : currentX;
    const startTop = typeof rects.start.top === 'number' ? rects.start.top : currentY;
    // Use let instead of const for delta values
    let deltaX = currentX - startLeft;
    let deltaY = currentY - startTop;

    let { top, left, width, height } = { ...rects.initial }; // Work with copies

    event.preventDefault();

    // --- Optional: Clamp Delta based on Container Edges ---
    if (!invertOnContainerEdge && corner) {
        // Available space from the box edges to the container edges
        // Note: rects.diff accounts for the offsetParent's position relative to the container
        const spaceLeft = rects.initial.left + rects.diff.left;
        const spaceRight = rects.container.width - (rects.initial.left + rects.initial.width + rects.diff.left);
        const spaceTop = rects.initial.top + rects.diff.top;
        const spaceBottom = rects.container.height - (rects.initial.top + rects.initial.height + rects.diff.top);

        if (corner.includes('left')) {
            // Limit how far left the pointer can go (negative deltaX)
            deltaX = Math.max(deltaX, -spaceLeft);
        }
        if (corner.includes('right')) {
            // Limit how far right the pointer can go (positive deltaX)
            deltaX = Math.min(deltaX, spaceRight);
        }
        if (corner.includes('top')) {
            // Limit how far up the pointer can go (negative deltaY)
            deltaY = Math.max(deltaY, -spaceTop);
        }
        if (corner.includes('bottom')) {
            // Limit how far down the pointer can go (positive deltaY)
            deltaY = Math.min(deltaY, spaceBottom);
        }
    }
    // --- End Delta Clamping ---

    // Calculate new dimensions/position based on the (potentially clamped) delta
    if (corner.includes('top')) {
        top = rects.initial.top + deltaY;
        height = rects.initial.height - deltaY;
    } else if (corner.includes('bottom')) {
        height = rects.initial.height + deltaY;
    }

    if (corner.includes('left')) {
        left = rects.initial.left + deltaX;
        width = rects.initial.width - deltaX;
    } else if (corner.includes('right')) {
        width = rects.initial.width + deltaX;
    }

    // Dragging the box itself (no corner)
    if (!corner) {
        top = rects.initial.top + deltaY;
        left = rects.initial.left + deltaX;
    }

    // --- Aspect Ratio Lock (Basic Implementation) ---
    // TODO: Refine aspect ratio logic, especially when dragging corners
    if (shouldKeepAspect && corner) {
        if (corner.includes('left') || corner.includes('right')) {
            // Adjust height based on width change
            const newHeight = width / aspectRatio;
            if (corner.includes('top')) {
                top -= (newHeight - height); // Adjust top to maintain bottom position
            }
            height = newHeight;
        } else if (corner.includes('top') || corner.includes('bottom')) {
            // Adjust width based on height change
            const newWidth = height * aspectRatio;
             if (corner.includes('left')) {
                left -= (newWidth - width); // Adjust left to maintain right position
            }
            width = newWidth;
        }
    }
    // --- End Aspect Ratio ---

    // --- Final Clamping ---
    // 1. Clamp dimensions to min/max *options*
    let clampedWidth = clamp(rects.min.width, rects.max.width, width);
    let clampedHeight = clamp(rects.min.height, rects.max.height, height);

    // 2. If aspect ratio locked, ensure clamped dimensions still respect it
    //    (adjust the dimension that changed *less* proportionally)
    if (shouldKeepAspect && corner) {
         const widthRatio = clampedWidth / width; // Proportion of original width remaining after clamp (<=1)
         const heightRatio = clampedHeight / height; // Proportion of original height remaining after clamp (<=1)

         // Determine which dimension was clamped *more* (smaller ratio means more clamping)
         if (widthRatio <= heightRatio) {
             // Width was clamped more (or equally), adjust height based on clamped width
             clampedHeight = clampedWidth / aspectRatio;
         } else {
             // Height was clamped more, adjust width based on clamped height
             clampedWidth = clampedHeight * aspectRatio;
         }

         // Re-clamp *both* dimensions after aspect ratio adjustment,
         // as the secondary adjustment might have pushed the other dimension beyond its limits.
         clampedWidth = clamp(rects.min.width, rects.max.width, clampedWidth);
         clampedHeight = clamp(rects.min.height, rects.max.height, clampedHeight);

         // Final check: Ensure the *most* constrained dimension dictates the final size
         // If clamping happened again, the aspect ratio might be slightly off.
         // Recalculate the *other* dimension based on the most recent clamped values.
         const finalWidthBasedOnHeight = clampedHeight * aspectRatio;
         const finalHeightBasedOnWidth = clampedWidth / aspectRatio;

        // If the current clamped width is smaller than what the clamped height suggests,
        // it means width is the limiting factor. Adjust height accordingly.
         if (clampedWidth < finalWidthBasedOnHeight - 0.001) { // Tolerance for floating point
             clampedHeight = finalHeightBasedOnWidth;
         }
         // Otherwise, height is the limiting factor (or they match). Adjust width accordingly.
         else {
              clampedWidth = finalWidthBasedOnHeight;
         }

         // One final clamp as a safety net (values shouldn't change ideally)
         clampedWidth = clamp(rects.min.width, rects.max.width, clampedWidth);
         clampedHeight = clamp(rects.min.height, rects.max.height, clampedHeight);
    }

    // 3. Adjust position if dimensions were clamped during resize
    //    (Ensure the edge opposite the dragged handle stays put)
    //    Run this *before* clamping position
    if (corner.includes('top') && clampedHeight !== height) {
        top = rects.initial.top + rects.initial.height - clampedHeight;
    }
    if (corner.includes('left') && clampedWidth !== width) {
        left = rects.initial.left + rects.initial.width - clampedWidth;
    }
     // Recalculate drag position if aspect ratio/clamping changed dimensions
     if (!corner) {
         top = rects.initial.top + deltaY;
         left = rects.initial.left + deltaX;
     }

    // 4. Clamp position within the container boundaries *using clamped dimensions*
    const clampedTop = clamp(
        -rects.diff.top, // Min top relative to parent
        rects.container.height - rects.diff.top - clampedHeight, // Max top relative to parent
        top
    );
    const clampedLeft = clamp(
        -rects.diff.left, // Min left relative to parent
        rects.container.width - rects.diff.left - clampedWidth, // Max left relative to parent
        left
    );
    // --- End Final Clamping ---

    // Apply styles
    box.style.top = `${clampedTop}px`;
    box.style.left = `${clampedLeft}px`;
    box.style.width = `${clampedWidth}px`;
    box.style.height = `${clampedHeight}px`;

    onMove?.(event);
}
