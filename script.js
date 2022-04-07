import { setResizableBoxEvents } from './index.js';

function init() {
    const boxes = document.querySelectorAll('[data-resizable]');
    for (const box of boxes) {
        const container =
            box.dataset.resizableContainer &&
            document.getElementById(box.dataset.resizableContainer);
        const form = undefined; //document.forms[0];
        setResizableBoxEvents(box, { container, form });
    }
}

/**
 * Not really necesary, but reminds me of the good ol' days.
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
