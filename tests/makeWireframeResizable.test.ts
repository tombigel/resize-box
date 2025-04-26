import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { makeWireframeElementResizable, createDocumentWireframe } from '@/index';

// Helper to check for handle elements
const containsHandle = (element: HTMLElement, handleName: string): boolean => {
    return !!element.querySelector(`[data-handle="${handleName}"]`);
};

// Helper to count handles
const countHandles = (element: HTMLElement): number => {
    return element.querySelectorAll('[data-handle]').length;
};

describe('makeWireframeElementResizable - Handle Generation', () => {
    let targetElement: HTMLElement;
    let wireframeElement: HTMLElement;
    let testContainer: HTMLElement;

    beforeEach(() => {
        // Create a container with relative positioning
        testContainer = document.createElement('div');
        testContainer.id = 'test-container-handle';
        testContainer.style.position = 'relative'; // Crucial for offsetParent
        document.body.appendChild(testContainer);

        // Create a target element and its wireframe before each test
        targetElement = document.createElement('div');
        targetElement.id = 'test-target';
        targetElement.style.position = 'absolute'; // Target needs positioning too
        // Append target to the container
        testContainer.appendChild(targetElement);

        // Need to explicitly provide the element array now
        const [wire] = createDocumentWireframe([targetElement]);
        wireframeElement = wire;
        // Wireframe's parent layer needs to be in the DOM
        // It should be added relative to the target's parent (our container)
        testContainer.appendChild(wire.parentElement!); // Append the layer containing the wireframe
    });

    afterEach(() => {
        // Clean up elements after each test
        document.body.innerHTML = '';
    });

    it('should add all 8 handles for handles: "all" (default)', () => {
        makeWireframeElementResizable(wireframeElement); // Default handles is 'all'
        expect(countHandles(wireframeElement)).toBe(8);
        expect(containsHandle(wireframeElement, 'top')).toBe(true);
        expect(containsHandle(wireframeElement, 'left')).toBe(true);
        expect(containsHandle(wireframeElement, 'bottom')).toBe(true);
        expect(containsHandle(wireframeElement, 'right')).toBe(true);
        expect(containsHandle(wireframeElement, 'top-left')).toBe(true);
        expect(containsHandle(wireframeElement, 'top-right')).toBe(true);
        expect(containsHandle(wireframeElement, 'bottom-left')).toBe(true);
        expect(containsHandle(wireframeElement, 'bottom-right')).toBe(true);
    });

    it('should add 4 side handles for handles: "sides"', () => {
        makeWireframeElementResizable(wireframeElement, { handles: 'sides' });
        expect(countHandles(wireframeElement)).toBe(4);
        expect(containsHandle(wireframeElement, 'top')).toBe(true);
        expect(containsHandle(wireframeElement, 'left')).toBe(true);
        expect(containsHandle(wireframeElement, 'bottom')).toBe(true);
        expect(containsHandle(wireframeElement, 'right')).toBe(true);
        expect(containsHandle(wireframeElement, 'top-left')).toBe(false);
    });

    it('should add 4 corner handles for handles: "corners"', () => {
        makeWireframeElementResizable(wireframeElement, { handles: 'corners' });
        expect(countHandles(wireframeElement)).toBe(4);
        expect(containsHandle(wireframeElement, 'top-left')).toBe(true);
        expect(containsHandle(wireframeElement, 'top-right')).toBe(true);
        expect(containsHandle(wireframeElement, 'bottom-left')).toBe(true);
        expect(containsHandle(wireframeElement, 'bottom-right')).toBe(true);
        expect(containsHandle(wireframeElement, 'top')).toBe(false);
    });

    it('should add specific handles when passed as an array', () => {
        makeWireframeElementResizable(wireframeElement, { handles: ['top', 'bottom-right'] });
        expect(countHandles(wireframeElement)).toBe(2);
        expect(containsHandle(wireframeElement, 'top')).toBe(true);
        expect(containsHandle(wireframeElement, 'bottom-right')).toBe(true);
        expect(containsHandle(wireframeElement, 'left')).toBe(false);
        expect(containsHandle(wireframeElement, 'top-left')).toBe(false);
    });

    it('should add no handles for handles: "none"', () => {
        makeWireframeElementResizable(wireframeElement, { handles: 'none' });
        expect(countHandles(wireframeElement)).toBe(0);
    });

     it('should add no handles for handles: [] (empty array)', () => {
        makeWireframeElementResizable(wireframeElement, { handles: [] });
        expect(countHandles(wireframeElement)).toBe(0);
    });

    it('should add data-resizable-aspect="keep" only when keepAspectRatio is true', () => {
        // Test case 1: keepAspectRatio: true
        makeWireframeElementResizable(wireframeElement, { keepAspectRatio: true });
        expect(wireframeElement.dataset.resizableAspect).toBe('keep');

        // Test case 2: keepAspectRatio: false (or default)
        makeWireframeElementResizable(wireframeElement, { keepAspectRatio: false });
        expect(wireframeElement.dataset.resizableAspect).toBeUndefined();

        // Test case 3: Default (should be undefined)
         makeWireframeElementResizable(wireframeElement);
         expect(wireframeElement.dataset.resizableAspect).toBeUndefined();
    });

});

describe('makeWireframeElementResizable - Option Attributes', () => {
    let targetElement: HTMLElement;
    let wireframeElement: HTMLElement;
    let testContainer: HTMLElement;

    beforeEach(() => {
        // Create a container with relative positioning
        testContainer = document.createElement('div');
        testContainer.id = 'test-container-options';
        testContainer.style.position = 'relative'; // Crucial for offsetParent
        document.body.appendChild(testContainer);

        targetElement = document.createElement('div');
        targetElement.id = 'test-target-options';
        targetElement.style.position = 'absolute'; // Target needs positioning
        // Append target to the container
        testContainer.appendChild(targetElement);

        const [wire] = createDocumentWireframe([targetElement]);
        wireframeElement = wire;
         // Wireframe's parent layer needs to be in the DOM
        // It should be added relative to the target's parent (our container)
        testContainer.appendChild(wire.parentElement!); // Append the layer containing the wireframe
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('should add data-resizable-aspect="keep" only when keepAspectRatio is true', () => {
        makeWireframeElementResizable(wireframeElement, { keepAspectRatio: true });
        expect(wireframeElement.dataset.resizableAspect).toBe('keep');

        makeWireframeElementResizable(wireframeElement, { keepAspectRatio: false });
        expect(wireframeElement.dataset.resizableAspect).toBeUndefined();

        makeWireframeElementResizable(wireframeElement); // Default
        expect(wireframeElement.dataset.resizableAspect).toBeUndefined();
    });

    it('should not add data-resizable-invert by default (invertOnContainerEdge: false)', () => {
        makeWireframeElementResizable(wireframeElement); // Default
        expect(wireframeElement.dataset.resizableInvert).toBeUndefined();
    });

    it('should add data-resizable-invert="invert" when invertOnContainerEdge is explicitly true', () => {
        makeWireframeElementResizable(wireframeElement, { invertOnContainerEdge: true });
        expect(wireframeElement.dataset.resizableInvert).toBe('invert');
    });

    it('should not add data-resizable-invert when invertOnContainerEdge is explicitly false', () => {
        makeWireframeElementResizable(wireframeElement, { invertOnContainerEdge: false });
        expect(wireframeElement.dataset.resizableInvert).toBeUndefined();
    });
});
