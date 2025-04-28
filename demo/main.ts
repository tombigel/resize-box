import { setResizableBoxEvents, createDocumentWireframe, makeWireframeElementResizable } from '@/index';
import '@/index.css';
import '@/theme.css';
import './style.css';

// Renamed original init function
function initResizableBoxes() {
    const box1 = document.getElementById('box1') as HTMLElement | null;
    const box2 = document.getElementById('box2') as HTMLElement | null;
    const box3 = document.getElementById('box3') as HTMLElement | null;
    const stage = document.getElementById('stage') as HTMLElement | null;
    const box4 = document.getElementById('box4') as HTMLElement | null;
    const box5 = document.getElementById('box5') as HTMLElement | null;
    const box6 = document.getElementById('box6') as HTMLElement | null;

    if (!box1 || !box2 || !box3 || !box4 || !box5 || !box6 || !stage) {
        console.error("Demo elements not found!");
        return;
    }

    const [wire1, wire2, wire4, wire5, wire6] = createDocumentWireframe([box1, box2, box4, box5, box6]);

    makeWireframeElementResizable(wire1, {
        handles: 'all',
        draggable: true,
        onStart: () => console.log('Wire1 Start'),
        onMove: () => console.log('Wire1 Move'),
        onEnd: () => console.log('Wire1 End'),
        invertOnContainerEdge: true,
    });

    makeWireframeElementResizable(wire2, {
        container: 'stage',
        handles: 'corners',
        draggable: false,
        invertOnContainerEdge: false,
        minWidth: 50,
        minHeight: 50,
        maxWidth: stage.offsetWidth,
        maxHeight: stage.offsetHeight,
    });

    setResizableBoxEvents(box3, {
        draggable: true,
        keepAspectRatio: false,
        minWidth: 100,
        minHeight: 50,
        onStart: () => console.log('Box3 Start'),
        onMove: () => console.log('Box3 Move'),
        onEnd: () => console.log('Box3 End'),
    });

    makeWireframeElementResizable(wire4, {
        container: 'stage',
        handles: 'none',
        draggable: true,
    });

    makeWireframeElementResizable(wire5, {
        container: 'stage',
        handles: ['top-left', 'bottom-right'],
        draggable: false,
        keepAspectRatio: true,
        minWidth: 40,
        minHeight: 40,
    });

    makeWireframeElementResizable(wire6, {
        container: 'stage',
        handles: 'all',
        draggable: true,
        invertOnContainerEdge: true,
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
