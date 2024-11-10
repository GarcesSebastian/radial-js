import { Circle, type ConfigCircle } from "./class/shapes/Circle";
import { Rect, type ConfigRect } from "./class/shapes/Rect";
import { Triangle, type ConfigTriangle } from "./class/shapes/Triangle";
import { Line, type ConfigLine } from "./class/shapes/Line";
import { Transformer, type ConfigTransformer } from "./class/utils/Transformer";

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
                this.emit("drag", event);
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

    public getPointerPosition(event: MouseEvent): { x: number, y: number } {
        const rect = this.ctx.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        return { x, y };
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

    Transformer(config: ConfigTransformer) {
        return new Transformer(this, config);
    }
}
