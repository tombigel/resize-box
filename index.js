const S4 = () => (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
const randomUUIDDumbPolyfill = () => `${S4()}${S4()}-${S4()}-${S4()}-${S4()}-${S4()}${S4()}${S4()}`;
const randomId = () => crypto.randomUUID?.() || randomUUIDDumbPolyfill();

/**
 * Limit a number between 2 values, inclusive, order doesn't matter
 * @param {number} n1
 * @param {number} n2
 * @param {number} n3
 * @returns {number}
 */
export const clamp = (n1, n2 = n1, n3 = n2) => {
    const [min, num, max] = [n1, n2, n3].sort((a, b) => a - b);
    return Math.min(max, Math.max(min, num));
};

const dragObserver = new MutationObserver((mutationList, observer) => {
    mutationList.forEach((mutation) => {
        const src = mutation.target;
        const target = document.getElementById(mutation.target.dataset.compId || mutation.target.dataset.wireId);

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
 * We create aseparate wireframe layer for each offset-parent of the collected elements
 * This way we don't need to worry about observing document layout changes (at least theoretically)
 * @param {HTMLElement[] | NodeList | string} elementsListOrSelector A list of elements or a selector
 * @returns {HTMLElement[]}
 */
export function createDocumentWireframe(elementsListOrSelector) {
    // Item template
    const itemLayer = document.createElement('div');
    itemLayer.className = 'wireframe-layer';

    // Layer template
    const item = document.createElement('div');
    item.className = 'wireframe-layer-item';

    // Collect elements
    const elements = [
        ...(typeof elementsListOrSelector === 'string'
            ? document.querySelectorAll(elementsListOrSelector) || []
            : elementsListOrSelector),
    ];

    // Create wires
    const wires = elements.map((element) => {
        const wire = item.cloneNode();
        const parent = element.parentNode;
        // Get or Create a layer
        const layer = parent.querySelector('wireframe-layer') || itemLayer.cloneNode();

        // No IDs? create unique ones
        layer.id ??= `wireframe-layer-${randomId()}`;
        element.id ??= `comp-${randomId()}`;

        const id = element.id;
        const wireId = `wire-${id}`;

        // Set element id, corresponding wire id and initial element position and size
        element.id = id;
        element.dataset.wireId = wireId;

        element.style.top = `${element.offsetTop}px`;
        element.style.left = `${element.offsetLeft}px`;
        element.style.width = `${element.offsetWidth}px`;
        element.style.height = `${element.offsetHeight}px`;

        // Set wire id, corresponding element id and initial wire position and size
        wire.id = wireId;
        wire.dataset.compId = id;

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
 * Stage editbox interaction logic
 * @param {HTMLElement|string} wireElementOrId the box to resize
 * @param {object} options
 * @param {'all' | 'sides' | 'corners' | 'corners-aspect'} [options.resize] resize handles
 * @param {string} [options.container] An id for a bounding container, defaults to document.body
 * @param {number} [options.minWidth = 10]
 * @param {number} [options.minHeight = 10]
 * @param {number} [options.maxWidth = container.offsetWidth]
 * @param {number} [options.maxHeight = container.offsetHeight]
 * @param {(e: PointerEvent) => void} [onStart]
 * @param {(e: PointerEvent) => void} [onMove]
 * @param {(e: PointerEvent) => void} [onEnd]
 */
export function makeWireframeElementResizable(
    wireElementOrId,
    {
        resize = 'all', // all | sides | corners | corners-aspect
        container, // optional containerr id to be raltive to
        ...rest
    } = {}
) {
    const wire = typeof wireElementOrId === 'string' ? document.getElementById(wireElementOrId) : wireElementOrId;

    if (!wire || !wire.dataset.compId) {
        throw `${wire} is not a wireframe element or id`;
    }

    const element = document.getElementById(wire.dataset.compId);
    element.style.position = 'absolute';

    wire.dataset.resizable = 'resizable';

    if (container) {
        wire.dataset.resizableContainer = container;
    }

    if (['all', 'sides'].includes(resize)) {
        wire.innerHTML = `
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

/**
 * Stage editbox interaction logic, expects a specific HTML structure:
 * @example
 * <div data-resizable-container="container" data-resizable-aspect="keep">
 *    Some content...
 *    <div class="resizable-box-handle" data-handle="top-left"></div>
 *    <div class="resizable-box-handle" data-handle="top-right"></div>
 *    <div class="resizable-box-handle" data-handle="bottom-left"></div>
 *    <div class="resizable-box-handle" data-handle="bottom-right"></div>
 *    <div class="resizable-box-handle" data-handle="top"></div>
 *    <div class="resizable-box-handle" data-handle="right"></div>
 *    <div class="resizable-box-handle" data-handle="left"></div>
 *    <div class="resizable-box-handle" data-handle="bottom"></div>
* </div>
 *

 * @param {HTMLElement} box the box to resize
 * @param {object} options
 * @param {number} [options.minWidth = 10]
 * @param {number} [options.minHeight = 10]
 * @param {number} [options.maxWidth = container.offsetWidth]
 * @param {number} [options.maxHeight = container.offsetHeight]
 * @param {(e: PointerEvent) => void} [onStart]
 * @param {(e: PointerEvent) => void} [onMove]
 * @param {(e: PointerEvent) => void} [onEnd]
 */
export function setResizableBoxEvents(
    box,
    { minWidth = 10, minHeight = 10, maxWidth, maxHeight, onStart, onMove, onEnd } = {}
) {
    const container = document.getElementById(box.dataset.resizableContainer) || document.body;

    //TODO - implement
    const keepAspect = box.dataset.resizableAspect === 'keep';

    maxWidth ??= container.offsetWidth;
    maxHeight ??= container.offsetHeight;

    const handles = [...box.querySelectorAll('[data-handle]'), box];
    const parent = box.offsetParent;
    if (!container.contains(parent)) {
        console.error('"container" has to be a parent of "box"');
    }
    const rects = {
        container: {},
        parent: {},
        initial: {},
        diff: {},
        start: {},
        min: {},
        max: {},
    };

    handles.forEach((handle) => {
        handle.addEventListener(
            'pointerdown',
            (event) => {
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
                    left: event.offsetX,
                    top: event.offsetY,
                };
                rects.min = {
                    width: minWidth,
                    height: minHeight,
                };
                rects.max = {
                    width: maxWidth,
                    height: maxHeight,
                };
                const corner = event.target.dataset.handle || '';
                const handleMove = moveBox.bind(null, box, corner, rects, onMove);

                document.body.dataset.draggingWithin = 'true';
                container.dataset.draggingWithin = 'true';
                box.dataset.dragging = 'true';

                if (onStart) {
                    onStart(event);
                }

                container.setPointerCapture(event.pointerId);
                container.addEventListener('pointermove', handleMove);
                container.addEventListener('pointerup', function handlePointerUp(e) {
                    e.preventDefault();
                    delete container.dataset.draggingWithin;
                    delete box.dataset.dragging;

                    container.removeEventListener('pointerup', handlePointerUp);
                    container.removeEventListener('pointermove', handleMove);

                    if (onEnd) {
                        onEnd(e);
                    }
                });
            },
            true
        );
    });
}

function moveBox(box, corner, rects, onMove, event) {
    let { offsetX, offsetY } = event;
    const calculated = { ...rects.initial };

    event.preventDefault();

    if (!offsetX && !offsetY) {
        return;
    }

    offsetX -= rects.diff.left;
    offsetY -= rects.diff.top;

    if (corner.includes('top')) {
        calculated.top = Math.min(offsetY, rects.initial.height + rects.initial.top - rects.min.height);
        calculated.height = rects.initial.height + rects.initial.top - offsetY;
    } else if (corner.includes('bottom')) {
        calculated.height = offsetY - rects.initial.top;
    }

    if (corner.includes('left')) {
        calculated.left = Math.min(offsetX, rects.initial.width + rects.initial.left - rects.min.width);
        calculated.width = rects.initial.width + rects.initial.left - offsetX;
    } else if (corner.includes('right')) {
        calculated.width = offsetX - rects.initial.left;
    }

    if (!corner) {
        calculated.top = offsetY - rects.start.top;
        calculated.left = offsetX - rects.start.left;
    }

    const top = clamp(
        Math.min(-calculated.height, 0) - rects.diff.top + rects.min.height,
        rects.container.height - rects.diff.top - rects.min.height,
        calculated.top
    );
    const left = clamp(
        Math.min(-calculated.width, 0) - rects.diff.left + rects.min.width,
        rects.container.width - rects.diff.left - rects.min.width,
        calculated.left
    );
    const width = clamp(rects.min.width, rects.max.width, calculated.width);
    const height = clamp(rects.min.height, rects.max.height, calculated.height);

    box.style.top = `${top}px`;
    box.style.left = `${left}px`;
    box.style.width = `${width}px`;
    box.style.height = `${height}px`;

    if (onMove) {
        onMove(event);
    }
}
