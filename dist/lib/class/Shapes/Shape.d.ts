import type { Radial } from "../../Radial";
export interface ConfigShape {
    x: number;
    y: number;
    color: string;
    borderWidth?: number;
    borderColor?: string;
    shadowColor?: string;
    shadowBlur?: number;
    shadowOffset?: {
        x: number;
        y: number;
    };
    draggable?: boolean;
}
export declare class Shape {
    protected ctx: CanvasRenderingContext2D;
    private events;
    protected config: ConfigShape;
    private isDragging;
    private dragStartX;
    private dragStartY;
    private initialX;
    private initialY;
    constructor(ctx: CanvasRenderingContext2D, config: ConfigShape);
    private applyStyles;
    private addEventListeners;
    private isPointInShape;
    private calculateArea;
    protected getBoundingBox(): {
        x: number;
        y: number;
        width?: number;
        height?: number;
        radius?: number;
        points?: number[];
        lineWidth?: number;
        shape: string;
        radial: Radial;
    };
    on(event: string, handler: Function): void;
    emit(event: string, ...args: any[]): void;
    off(event: string, handler: Function): void;
    protected draw(): void;
    destroy(): void;
    private removeEventListeners;
    private redrawCanvas;
    render(): void;
}
