import { Circle, type ConfigCircle } from "./class/Shapes/Circle";
import { Rect, type ConfigRect } from "./class/Shapes/Rect";
import { Triangle, type ConfigTriangle } from "./class/Shapes/Triangle";
import { Line, type ConfigLine } from "./class/Shapes/Line";

export class Radial {
    public children: any[] = [];

    private ctx!: CanvasRenderingContext2D;
    private events!: { [key: string]: Function[] };
    private isDragging: boolean = false;
    private dragStartPos: { x: number, y: number } | null = null;

    constructor(ctx: CanvasRenderingContext2D) {
        if (!ctx) {
            console.error("No se proporcionó un contexto de canvas válido.");
            return;
        }

        this.ctx = ctx;
        this.events = {};
        this.addEventListeners();
    }

    private addEventListeners() {
        this.ctx.canvas.addEventListener("click", (event) => {
            this.emit("click", event);
        });

        this.ctx.canvas.addEventListener("mousemove", (event) => {
            this.emit("mousemove", event);
            if (this.isDragging && this.dragStartPos) {
                this.emit("dragmove", event);
            }
        });

        this.ctx.canvas.addEventListener("mousedown", (event) => {
            this.isDragging = true;
            this.dragStartPos = { x: event.offsetX, y: event.offsetY };
            this.emit("dragstart", event);
        });

        this.ctx.canvas.addEventListener("mouseup", (event) => {
            if (this.isDragging) {
                this.emit("dragend", event);
                this.isDragging = false;
                this.dragStartPos = null;
            }
        });

        this.ctx.canvas.addEventListener("wheel", (event) => {
            this.emit("wheel", event);
        });
    }

    public getCtx(): CanvasRenderingContext2D {
        return this.ctx;
    }

    public getChildren(): any[] {
        return this.children;
    }

    on(event: string, handler: Function) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(handler);
    }

    emit(event: string, ...args: any[]) {
        if (this.events[event]) {
            this.events[event].forEach(handler => handler(...args));
        }
    }

    off(event: string, handler: Function) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(h => h !== handler);
        }
    }

    Circle(config: ConfigCircle) {
        return new Circle(this, config);
    }

    Rect(config: ConfigRect) {
        return new Rect(this, config);
    }

    Triangle(config: ConfigTriangle) {
        return new Triangle(this, config);
    }

    Line(config: ConfigLine) {
        return new Line(this, config);
    }
}
