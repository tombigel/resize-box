export type HandleName = 'top' | 'left' | 'bottom' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export type ResizeHandlesOption = 'all' | 'sides' | 'corners' | 'none' | HandleName[];

export interface ResizableBoxOptions {
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
    draggable?: boolean;
    keepAspectRatio?: boolean;
    invertOnContainerEdge?: boolean;
    onStart?: (e: PointerEvent) => void;
    onMove?: (e: PointerEvent) => void;
    onEnd?: (e: PointerEvent) => void;
}

export interface MakeWireframeResizableOptions extends ResizableBoxOptions {
    handles?: ResizeHandlesOption;
    keepAspectRatio?: boolean;
    container?: string;
}

export interface Rects {
    container: DOMRect;
    parent: DOMRect;
    initial: { top: number; left: number; width: number; height: number };
    diff: { left: number; top: number };
    start: { left: number; top: number };
    min: { width: number; height: number };
    max: { width: number; height: number };
}
