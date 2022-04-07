// polyfill for form.requestSubmit in Safari, should be removed when the feature is enabled https://bugs.webkit.org/show_bug.cgi?id=197958
import formRequestSubmitPolyfill from 'https://cdn.skypack.dev/pin/form-request-submit-polyfill@v2.0.0-szOipIemxchOslzcqvLN/mode=imports,min/optimized/form-request-submit-polyfill.js';

/**
 * Stage editbox interaction logic
 * @param {HTMLElement} box the box to resize
 * @param {object} options
 * @param {HTMLElement} [options.container = document.body] the containing stage
 * @param {HTMLFormElement} [options.form] a form to save the box size in
 * @param {number} [options.minWidth = 10]
 * @param {number} [options.minHeight = 10]
 * @param {number} [options.maxWidth = container.offsetWidth]
 * @param {number} [options.maxHeight = container.offsetHeight]
 */
export function setResizableBoxEvents(
    box,
    {
        container = document.body,
        form,
        minWidth = 10,
        minHeight = 10,
        maxWidth = container.offsetWidth,
        maxHeight = container.offsetHeight,
    } = {}
) {
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
    if (form){
        form.addEventListener('submit', e => e.preventDefault());
        if (form.elements['y'].value) {
            box.style.top = form.elements['y'].value;
            box.style.left = form.elements['x'].value;
            box.style.width = form.elements['w'].value;
            box.style.height = form.elements['h'].value;
        }
    }

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
                const handleMove = moveBox.bind(null, box, corner, rects);

                container.dataset.draggingWithin = 'true';
                box.dataset.dragging = 'true';

                container.setPointerCapture(event.pointerId);
                container.addEventListener('pointermove', handleMove);
                container.addEventListener(
                    'pointerup',
                    function handlePointerUp(e) {
                        delete container.dataset.draggingWithin;
                        delete box.dataset.dragging;

                        if (form) {
                            // Save box dimensions
                            form.elements['y'].value = box.style.top;
                            form.elements['x'].value = box.style.left;
                            form.elements['w'].value = box.style.width;
                            form.elements['h'].value = box.style.height;
                            form.requestSubmit();
                        }

                        container.removeEventListener(
                            'pointerup',
                            handlePointerUp
                        );
                        container.removeEventListener(
                            'pointermove',
                            handleMove
                        );
                    }
                );
            },
            true
        );
    });
}

function moveBox(box, corner, rects, { offsetX, offsetY }) {
    offsetX -= rects.diff.left;
    offsetY -= rects.diff.top;
    const calculated = { ...rects.initial };

    if (corner.includes('top')) {
        calculated.top = Math.min(
            offsetY,
            rects.initial.height + rects.initial.top - rects.min.height
        );
        calculated.height = rects.initial.height + rects.initial.top - offsetY;
    } else if (corner.includes('bottom')) {
        calculated.height = offsetY - rects.initial.top;
    }

    if (corner.includes('left')) {
        calculated.left = Math.min(
            offsetX,
            rects.initial.width + rects.initial.left - rects.min.width
        );
        calculated.width = rects.initial.width + rects.initial.left - offsetX;
    } else if (corner.includes('right')) {
        calculated.width = offsetX - rects.initial.left;
    } else {
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
}

/**
 * Limit a number between 2 values, inclusive
 * @param {number} min
 * @param {number} [max]
 * @param {number} num
 * @returns {number}
 */
export const clamp = (min, max = min, num = max) =>
    Math.min(max, Math.max(min, num));
