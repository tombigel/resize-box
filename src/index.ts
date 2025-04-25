const S4 = (): string => (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
const randomUUIDDumbPolyfill = (): string => `${S4()}${S4()}-${S4()}-${S4()}-${S4()}-${S4()}${S4()}${S4()}`;
const randomId = (): string => crypto.randomUUID?.() || randomUUIDDumbPolyfill();

/**
 * Limit a number between 2 values, inclusive, order doesn't matter
 * @param {number} n1
 * @param {number} n2
 * @param {number} n3
 * @returns {number}
 */
export const clamp = (n1: number, n2: number = n1, n3: number = n2): number => {
    const [min, num, max] = [n1, n2, n3].sort((a, b) => a - b);
    return Math.min(max, Math.max(min, num));
};

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

export type ResizeHandleType = 'all' | 'sides' | 'corners' | 'corners-aspect';

export interface MakeWireframeResizableOptions extends ResizableBoxOptions {
    resize?: ResizeHandleType;
    container?: string; // container element ID
}

/**
 * Make a wireframe element resizable
 * @param {HTMLElement|string} wireElementOrId the wireframe box to resize
 * @param {MakeWireframeResizableOptions} options
 */
export function makeWireframeElementResizable(
    wireElementOrId: HTMLElement | string,
    {
        resize = 'all',
        container,
        ...rest // Captures ResizableBoxOptions
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

    // Clear existing handles before adding new ones
    wire.innerHTML = '';

    if (['all', 'sides'].includes(resize)) {
        wire.innerHTML += `
<div class="resizable-box-handle" data-handle="top"></div>
<div class="resizable-box-handle" data-handle="right"></div>
<div class="resizable-box-handle" data-handle="bottom"></div>
<div class="resizable-box-handle" data-handle="left"></div>`;
    }

    if (['all', 'corners', 'corners-aspect'].includes(resize)) {
        wire.innerHTML += `
<div class="resizable-box-handle" data-handle="top-left"></div>
<div class="resizable-box-handle" data-handle="top-right"></div>
<div class="resizable-box-handle" data-handle="bottom-left"></div>
<div class="resizable-box-handle" data-handle="bottom-right"></div>`;
    }

    if (resize === 'corners-aspect') {
        wire.dataset.resizableAspect = 'keep';
    }

    setResizableBoxEvents(wire, rest);
}


export interface ResizableBoxOptions {
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
    onStart?: (e: PointerEvent) => void;
    onMove?: (e: PointerEvent) => void;
    onEnd?: (e: PointerEvent) => void;
}

interface Rects {
    container: DOMRect;
    parent: DOMRect;
    initial: { top: number; left: number; width: number; height: number };
    diff: { left: number; top: number };
    start: { left: number; top: number };
    min: { width: number; height: number };
    max: { width: number; height: number };
}

/**
 * Sets up pointer events for resizing and dragging a box element.
 * Expects a specific HTML structure with optional handles.
 * @param {HTMLElement} box The element to make resizable/draggable.
 * @param {ResizableBoxOptions} options Configuration options.
 */
export function setResizableBoxEvents(
    box: HTMLElement,
    { minWidth = 10, minHeight = 10, maxWidth, maxHeight, onStart, onMove, onEnd }: ResizableBoxOptions = {}
): void {
    const container = document.getElementById(box.dataset.resizableContainer || '') || document.body;

    //TODO - implement aspect ratio locking
    const keepAspect = box.dataset.resizableAspect === 'keep';
    const initialAspectRatio = keepAspect ? box.offsetWidth / box.offsetHeight : 0;

    maxWidth = maxWidth ?? container.offsetWidth;
    maxHeight = maxHeight ?? container.offsetHeight;

    // Include the box itself for dragging
    const handles: HTMLElement[] = [...box.querySelectorAll<HTMLElement>('[data-handle]'), box];
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

    handles.forEach((handle) => {
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
                const handleMove = moveBox.bind(null, box, corner, rects, onMove, keepAspect, initialAspectRatio);

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
    keepAspect: boolean,
    aspectRatio: number,
    event: PointerEvent
): void {
    // Use pointer position relative to the document (clientX/clientY)
    const currentX = event.clientX;
    const currentY = event.clientY;
    const deltaX = currentX - rects.start.left;
    const deltaY = currentY - rects.start.top;

    let { top, left, width, height } = { ...rects.initial }; // Work with copies

    event.preventDefault();

    // Calculate new dimensions/position based on the corner being dragged
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
    if (keepAspect && corner) {
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

    // Clamp dimensions to min/max values
    width = clamp(rects.min.width, rects.max.width, width);
    height = clamp(rects.min.height, rects.max.height, height);

    // Adjust position if dimensions were clamped during resize
    if (corner.includes('top') && height !== rects.initial.height - deltaY) {
        top = rects.initial.top + rects.initial.height - height;
    }
    if (corner.includes('left') && width !== rects.initial.width - deltaX) {
        left = rects.initial.left + rects.initial.width - width;
    }

    // Clamp position within the container boundaries
    const clampedTop = clamp(
        -rects.diff.top, // Minimum top relative to parent
        rects.container.height - rects.diff.top - height, // Maximum top relative to parent
        top
    );
    const clampedLeft = clamp(
        -rects.diff.left, // Minimum left relative to parent
        rects.container.width - rects.diff.left - width, // Maximum left relative to parent
        left
    );

    // Apply styles
    box.style.top = `${clampedTop}px`;
    box.style.left = `${clampedLeft}px`;
    box.style.width = `${width}px`;
    box.style.height = `${height}px`;

    onMove?.(event);
}
