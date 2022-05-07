import { setResizableBoxEvents, createDocumentWireframe, makeWireframeElementResizable } from './index.js';

function init() {
    const [wire1, wire2] = createDocumentWireframe('#box1, #box2');

    makeWireframeElementResizable(wire1);
    makeWireframeElementResizable(wire2, { container: 'stage', resize: 'corners' });

    setResizableBoxEvents(document.getElementById('box3'));
}

/**
 * Not really necesary, but reminds me of the good ol' days.
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
