import { Circle, type ConfigCircle } from "./class/Shapes/Circle";
import { Rect, type ConfigRect } from "./class/Shapes/Rect";
import { Triangle, type ConfigTriangle } from "./class/Shapes/Triangle";
import { Line, type ConfigLine } from "./class/Shapes/Line";
export declare class Radial {
    children: any[];
    private ctx;
    private events;
    private isDragging;
    private dragStartPos;
    constructor(ctx: CanvasRenderingContext2D);
    private addEventListeners;
    getCtx(): CanvasRenderingContext2D;
    getChildren(): any[];
    on(event: string, handler: Function): void;
    emit(event: string, ...args: any[]): void;
    off(event: string, handler: Function): void;
    Circle(config: ConfigCircle): Circle;
    Rect(config: ConfigRect): Rect;
    Triangle(config: ConfigTriangle): Triangle;
    Line(config: ConfigLine): Line;
}
