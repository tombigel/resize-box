import { setResizableBoxEvents, createDocumentWireframe, makeWireframeElementResizable } from '@/index';
import '@/index.css';
import './style.css';

// Renamed original init function
function initResizableBoxes() {
    const box1 = document.getElementById('box1') as HTMLElement | null;
    const box2 = document.getElementById('box2') as HTMLElement | null;
    const box3 = document.getElementById('box3') as HTMLElement | null;
    const stage = document.getElementById('stage') as HTMLElement | null;

    if (!box1 || !box2 || !box3 || !stage) {
        console.error("Demo elements not found!");
        return;
    }

    const [wire1, wire2] = createDocumentWireframe([box1, box2]);

    makeWireframeElementResizable(wire1, {
        resize: 'all',
        onStart: () => console.log('Wire1 Start'),
        onMove: () => console.log('Wire1 Move'),
        onEnd: () => console.log('Wire1 End'),
    });

    makeWireframeElementResizable(wire2, {
        container: 'stage',
        resize: 'corners',
        minWidth: 50,
        minHeight: 50,
        maxWidth: stage.offsetWidth - 20,
        maxHeight: stage.offsetHeight - 20,
    });

    setResizableBoxEvents(box3, {
        minWidth: 100,
        minHeight: 50,
        onStart: () => console.log('Box3 Start'),
        onMove: () => console.log('Box3 Move'),
        onEnd: () => console.log('Box3 End'),
    });
}

/**
 * Run init() after the DOM is fully loaded.
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initResizableBoxes);
} else {
    initResizableBoxes();
}
