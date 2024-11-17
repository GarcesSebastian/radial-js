import { Circle, type ConfigCircle } from "./class/Shapes/Circle";
import { Rect, type ConfigRect } from "./class/Shapes/Rect";
import { Polygon, type ConfigPolygon } from "./class/Shapes/Polygon";
import { Line, type ConfigLine } from "./class/Shapes/Line";
import { Transformer, type ConfigTransformer } from "./class/utils/Transformer";
import type { Shape } from "./class/Shapes/Shape";
import { Particle, type ConfigParticle } from "./class/Shapes/Particle";
import { Layer, type LayerConfig } from "./class/utils/Layer";
import { isPointInShape } from "./utils/lib";
import { Image, type ConfigImage } from "./class/Shapes/Image"; // Import the Image class

interface CustomCanvasEvent extends MouseEvent {
    canvasTarget?: Shape;
    offsetX: number;
    offsetY: number;
    originalEvent: MouseEvent;
}

export class Radial {
    private layers: Layer[] = [];
    public children: Shape[] = [];

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

    private createCustomEvent(originalEvent: MouseEvent, target?: Shape): CustomCanvasEvent {
        const customEvent = {
            type: originalEvent.type,
            bubbles: originalEvent.bubbles,
            cancelable: originalEvent.cancelable,
            composed: originalEvent.composed,
            defaultPrevented: originalEvent.defaultPrevented,
            eventPhase: originalEvent.eventPhase,
            isTrusted: originalEvent.isTrusted,
            timeStamp: originalEvent.timeStamp,

            // Propiedades del MouseEvent
            altKey: originalEvent.altKey,
            button: originalEvent.button,
            buttons: originalEvent.buttons,
            clientX: originalEvent.clientX,
            clientY: originalEvent.clientY,
            ctrlKey: originalEvent.ctrlKey,
            metaKey: originalEvent.metaKey,
            movementX: originalEvent.movementX,
            movementY: originalEvent.movementY,
            offsetX: originalEvent.offsetX,
            offsetY: originalEvent.offsetY,
            pageX: originalEvent.pageX,
            pageY: originalEvent.pageY,
            screenX: originalEvent.screenX,
            screenY: originalEvent.screenY,
            shiftKey: originalEvent.shiftKey,

            // Propiedades del canvas
            canvasX: originalEvent.offsetX,
            canvasY: originalEvent.offsetY,

            // Target personalizado y evento original
            canvasTarget: target,
            originalEvent: originalEvent,

            // Métodos del evento
            preventDefault: () => originalEvent.preventDefault(),
            stopPropagation: () => originalEvent.stopPropagation(),
            stopImmediatePropagation: () => originalEvent.stopImmediatePropagation(),

            // Getters para compatibilidad
            get target() { return target || originalEvent.target; },
            get currentTarget() { return originalEvent.currentTarget; },
            get relatedTarget() { return originalEvent.relatedTarget; },
        } as unknown as CustomCanvasEvent;

        return customEvent;
    }

    private addEventListeners() {
        this.ctx.canvas.addEventListener("click", (event: MouseEvent) => {
            let target;
            
            this.children.forEach(child => {
                if(child.getAttr("ignore")) return;

                const rect = child.getBoundingBox();
                if (isPointInShape(event.offsetX, event.offsetY, rect)) {
                    target = child;
                }
            });

            if(target == undefined) {
                target = this;
            }

            const customEvent = this.createCustomEvent(event, target);
            this.emit("click", customEvent);
        });

        this.ctx.canvas.addEventListener("mousemove", (event) => {
            let target;

            this.children.forEach(child => {
                if(child.getAttr("ignore")) return;
                
                const rect = child.getBoundingBox();
                if (isPointInShape(event.offsetX, event.offsetY, rect)) {
                    target = child;
                }
            });

            const customEvent = this.createCustomEvent(event, target);
            this.emit("mousemove", customEvent);

            if (this.isDragging && this.dragStartPos) {
                this.emit("drag", customEvent);
            }
        });

        this.ctx.canvas.addEventListener("mousedown", (event) => {
            this.isDragging = true;
            this.dragStartPos = { x: event.offsetX, y: event.offsetY };

            const customEvent = this.createCustomEvent(event);
            this.emit("dragstart", customEvent);
        });

        this.ctx.canvas.addEventListener("mouseup", (event) => {
            if (this.isDragging) {
                const customEvent = this.createCustomEvent(event);
                this.emit("dragend", customEvent);
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

    Polygon(config: ConfigPolygon) {
        return new Polygon(this, config);
    }

    Line(config: ConfigLine) {
        return new Line(this, config);
    }

    Particle(config: ConfigParticle) {
        return new Particle(this, config);
    }

    Transformer(config: ConfigTransformer) {
        return new Transformer(this, config);
    }

    Image(config: ConfigImage) {
        return new Image(this, config);
    }
}