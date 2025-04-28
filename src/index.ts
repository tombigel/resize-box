import type { HandleName, MakeWireframeResizableOptions, Rects, ResizableBoxOptions } from './types';
import { clamp, randomId } from './utils';
export type * from './types';

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
    const itemLayer = document.createElement('div');
    itemLayer.className = 'wireframe-layer';

    const item = document.createElement('div');
    item.className = 'wireframe-layer-item';

    const elements: HTMLElement[] = [
        ...(typeof elementsListOrSelector === 'string'
            ? (document.querySelectorAll(elementsListOrSelector) as NodeListOf<HTMLElement>) || []
            : elementsListOrSelector),
    ];

    const wires = elements.map((element) => {
        const wire = item.cloneNode() as HTMLElement;
        const parent = element.parentNode as HTMLElement | null;
        if (!parent) throw new Error('Element must have a parent node');

        const layer = (parent.querySelector('.wireframe-layer') || itemLayer.cloneNode()) as HTMLElement;

        layer.id = layer.id || `wireframe-layer-${randomId()}`;
        element.id = element.id || `comp-${randomId()}`;

        const id = element.id;
        const wireId = `wire-${id}`;

        element.dataset.wireId = wireId;

        element.style.position = 'absolute'; // Ensure positioning context
        element.style.top = `${element.offsetTop}px`;
        element.style.left = `${element.offsetLeft}px`;
        element.style.width = `${element.offsetWidth}px`;
        element.style.height = `${element.offsetHeight}px`;

        wire.id = wireId;
        wire.dataset.compId = id;

        wire.style.position = 'absolute'; // Ensure positioning context for wireframe
        wire.style.top = element.style.top;
        wire.style.left = element.style.left;
        wire.style.width = element.style.width;
        wire.style.height = element.style.height;

        layer.appendChild(wire);

        if (!parent.contains(layer)) {
            parent.appendChild(layer);
        }

        dragObserver.observe(element, {
            attributes: true,
            attributeFilter: ['style'],
        });

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

    if (!draggable) {
        box.dataset.resizableDraggable = 'false';
    } else {
        delete box.dataset.resizableDraggable;
    }

    if (invertOnContainerEdge) {
        box.dataset.resizableInvert = 'invert';
    } else {
        delete box.dataset.resizableInvert;
    }

    const shouldKeepAspect = keepAspectRatio || box.dataset.resizableAspect === 'keep';
    const initialAspectRatio = shouldKeepAspect ? box.offsetWidth / box.offsetHeight : 0;

    maxWidth = maxWidth ?? container.offsetWidth;
    maxHeight = maxHeight ?? container.offsetHeight;

    const handleElements: HTMLElement[] = [...box.querySelectorAll<HTMLElement>('[data-handle]')];
    if (draggable) {
        handleElements.push(box);
    }

    const parent = box.offsetParent as HTMLElement | null;

    if (!parent || !container.contains(parent)) {
        console.error('Resizable box must have an offsetParent contained within the specified container or document.body');
        return;
    }

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
                const target = event.target as HTMLElement;
                if (!target || !target.dataset) return;

                event.preventDefault();
                event.stopPropagation();

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
                    left: event.clientX,
                    top: event.clientY,
                };

                const corner = target.dataset.handle || '';
                const handleMove = moveBox.bind(null, box, corner, rects, onMove, shouldKeepAspect, initialAspectRatio, invertOnContainerEdge);

                container.dataset.draggingWithin = 'true';
                box.dataset.dragging = 'true';
                box.style.willChange = 'top, left, width, height';

                onStart?.(event);

                container.setPointerCapture(event.pointerId);
                container.addEventListener('pointermove', handleMove);

                const handlePointerUp = (e: PointerEvent) => {
                    if (e.pointerId !== event.pointerId) return;

                    e.preventDefault();
                    delete container.dataset.draggingWithin;
                    delete box.dataset.dragging;
                    box.style.willChange = 'auto';

                    container.releasePointerCapture(event.pointerId);
                    container.removeEventListener('pointermove', handleMove);
                    container.removeEventListener('pointerup', handlePointerUp);

                    onEnd?.(e);
                };

                container.addEventListener('pointerup', handlePointerUp);
            },
            { capture: true }
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
    const currentX = event.clientX;
    const currentY = event.clientY;

    const startLeft = typeof rects.start.left === 'number' ? rects.start.left : currentX;
    const startTop = typeof rects.start.top === 'number' ? rects.start.top : currentY;
    let deltaX = currentX - startLeft;
    let deltaY = currentY - startTop;

    let { top, left, width, height } = { ...rects.initial };

    event.preventDefault();

    // --- Optional: Clamp Delta based on Container Edges ---
    if (!invertOnContainerEdge && corner) {
        const spaceLeft = rects.initial.left + rects.diff.left;
        const spaceRight = rects.container.width - (rects.initial.left + rects.initial.width + rects.diff.left);
        const spaceTop = rects.initial.top + rects.diff.top;
        const spaceBottom = rects.container.height - (rects.initial.top + rects.initial.height + rects.diff.top);

        if (corner.includes('left')) {
            deltaX = Math.max(deltaX, -spaceLeft);
        }
        if (corner.includes('right')) {
            deltaX = Math.min(deltaX, spaceRight);
        }
        if (corner.includes('top')) {
            deltaY = Math.max(deltaY, -spaceTop);
        }
        if (corner.includes('bottom')) {
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
            const newHeight = width / aspectRatio;
            if (corner.includes('top')) {
                top -= (newHeight - height);
            }
            height = newHeight;
        } else if (corner.includes('top') || corner.includes('bottom')) {
            const newWidth = height * aspectRatio;
             if (corner.includes('left')) {
                left -= (newWidth - width);
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
         const widthRatio = clampedWidth / width;
         const heightRatio = clampedHeight / height;

         if (widthRatio <= heightRatio) {
             clampedHeight = clampedWidth / aspectRatio;
         } else {
             clampedWidth = clampedHeight * aspectRatio;
         }

         // Re-clamp *both* dimensions after aspect ratio adjustment,
         // as the secondary adjustment might have pushed the other dimension beyond its limits.
         clampedWidth = clamp(rects.min.width, rects.max.width, clampedWidth);
         clampedHeight = clamp(rects.min.height, rects.max.height, clampedHeight);

         // Final check: Ensure the *most* constrained dimension dictates the final size
         // Recalculate the *other* dimension based on the most recent clamped values.
         const finalWidthBasedOnHeight = clampedHeight * aspectRatio;
         const finalHeightBasedOnWidth = clampedWidth / aspectRatio;

         if (clampedWidth < finalWidthBasedOnHeight - 0.001) { // Tolerance for floating point
             clampedHeight = finalHeightBasedOnWidth;
         }
         else {
              clampedWidth = finalWidthBasedOnHeight;
         }

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
     if (!corner) {
         top = rects.initial.top + deltaY;
         left = rects.initial.left + deltaX;
     }

    // 4. Clamp position within the container boundaries *using clamped dimensions*
    const clampedTop = clamp(
        -rects.diff.top,
        rects.container.height - rects.diff.top - clampedHeight,
        top
    );
    const clampedLeft = clamp(
        -rects.diff.left,
        rects.container.width - rects.diff.left - clampedWidth,
        left
    );
    // --- End Final Clamping ---

    box.style.top = `${clampedTop}px`;
    box.style.left = `${clampedLeft}px`;
    box.style.width = `${clampedWidth}px`;
    box.style.height = `${clampedHeight}px`;

    onMove?.(event);
}
