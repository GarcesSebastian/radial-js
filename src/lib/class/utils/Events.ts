import type { Radial } from "../../Radial";
import { checkCollision } from "../../utils/lib";
import type { IShapeEventDelegate, Shape } from "../Shapes/Shape";

export class Events {
    private static readonly THROTTLE_DELAY = 16;
    private readonly events: Map<string, Set<Function>>;
    private isDragging: boolean = false;
    private dragStartX: number = 0;
    private dragStartY: number = 0;
    private initialX: number = 0;
    private initialY: number = 0;
    private lastDragUpdate: number = 0;

    constructor(
        private readonly shapeDelegate: IShapeEventDelegate,
        private readonly ctx: CanvasRenderingContext2D
    ) {
        this.events = new Map();
        this.addEventListeners();
    }

    public on(event: string, handler: Function): void {
        if (!this.events.has(event)) {
            this.events.set(event, new Set());
        }
        this.events.get(event)!.add(handler);
    }

    public off(event: string, handler: Function): void {
        const handlers = this.events.get(event);
        if (handlers) {
            handlers.delete(handler);
        }
    }

    public emit(event: string, ...args: any[]): void {
        const handlers = this.events.get(event);
        if (handlers) {
            handlers.forEach(handler => handler(...args));
        }
    }

    public clearEvents(): void {
        this.events.clear();
    }

    public handleCollision(radial: Radial): void {
        this.resetCollisionStates(radial);
        this.detectCollisions(radial);
        this.emitCollisionEvents(radial);
    }

    private resetCollisionStates(radial: Radial): void {
        radial.children.forEach(shape => {
            shape.getEventDelegate().updateCollisionState({
                previousCollision: shape.getEventDelegate().getCollisionState().isColliding || false,
                isColliding: false,
                currentCollisions: []
            });
        });
    }

    private detectCollisions(radial: Radial): void {
        radial.children.forEach((shape: Shape, i) => {
            if (shape.getEventDelegate().isIgnored()) return;
            
            radial.children.forEach((otherShape: Shape, j) => {
                if (i === j || otherShape.getEventDelegate().isIgnored()) return;
                this.processShapeCollision(shape, otherShape);
            });
        });
    }

    private processShapeCollision(shape: Shape, otherShape: Shape): void {
        if (this.checkShapesCollision(shape, otherShape)) {
            this.updateCollisionStates(shape, otherShape);
        }
    }

    private checkShapesCollision(shape: Shape, otherShape: Shape): boolean {
        return checkCollision(
            shape,
            otherShape,
            shape.getEventDelegate().getBoundingBox(),
            otherShape.getEventDelegate().getBoundingBox()
        );
    }

    private updateCollisionStates(shape: Shape, otherShape: Shape): void {
        const shapeDelegate = shape.getEventDelegate();
        const otherDelegate = otherShape.getEventDelegate();
        
        const currentCollisions = shapeDelegate.getCollisionState().currentCollisions || [];
        const otherCollisions = otherDelegate.getCollisionState().currentCollisions || [];
        
        if (!currentCollisions.includes(otherShape)) {
            shapeDelegate.updateCollisionState({
                currentCollisions: [...currentCollisions, otherShape],
                isColliding: true
            });
        }
        
        if (!otherCollisions.includes(shape)) {
            otherDelegate.updateCollisionState({
                currentCollisions: [...otherCollisions, shape],
                isColliding: true
            });
        }
    }

    private emitCollisionEvents(radial: Radial): void {
        radial.children.forEach((shape: Shape) => {
            const delegate = shape.getEventDelegate();
            const state = delegate.getCollisionState();
            
            if (delegate.isCollisionEnabled()) {
                if (state.currentCollisions.length > 0) {
                    this.emit("collision", {
                        target: shape,
                        collisions: [...state.currentCollisions]
                    });
                }
                
                if (state.previousCollision && !state.isColliding) {
                    this.emit("collisionend", {
                        target: shape,
                        collisions: []
                    });
                }
            }
        });
    }

    private addEventListeners(): void {
        const canvas = this.ctx.canvas;
        let isOverShape = false;

        const handleMouseMove = (event: MouseEvent) => {
            const rect = this.shapeDelegate.getBoundingBox();
            const isCurrentlyOverShape = this.shapeDelegate.isPointInShape(event.offsetX, event.offsetY, rect);

            if (isCurrentlyOverShape && !isOverShape) {
                isOverShape = true;
            } else if (!isCurrentlyOverShape && isOverShape) {
                isOverShape = false;
            }

            if (this.isDragging && this.shapeDelegate.isDraggable()) {
                this.throttledDragUpdate(event);
            }
        };

        canvas.addEventListener("mousemove", handleMouseMove, { passive: true });
        canvas.addEventListener("mousedown", (event) => this.handleMouseDown(event), { passive: true });
        canvas.addEventListener("mouseup", (event) => this.handleMouseUp(event), { passive: true });
        canvas.addEventListener("click", (event) => this.handleClick(event), { passive: true });
        canvas.addEventListener("mouseleave", () => this.handleMouseLeave(), { passive: true });
    }

    private handleMouseDown(event: MouseEvent): void {
        const rect = this.shapeDelegate.getBoundingBox();
        if (this.shapeDelegate.isPointInShape(event.offsetX, event.offsetY, rect)) {
            if (this.shapeDelegate.isDraggable()) {
                this.startDragging(event);
            }
            this.emit("mousedown", event);
        }
    }

    private startDragging(event: MouseEvent): void {
        this.isDragging = true;
        this.dragStartX = event.offsetX;
        this.dragStartY = event.offsetY;
        const position = this.shapeDelegate.getPosition();
        this.initialX = position.x;
        this.initialY = position.y;
        this.emit("dragstart", { x: position.x, y: position.y, event });
    }

    private handleMouseUp(event: MouseEvent): void {
        if (this.isDragging) {
            this.endDragging(event);
        }
        if (this.shapeDelegate.isPointInShape(event.offsetX, event.offsetY, this.shapeDelegate.getBoundingBox())) {
            this.emit("mouseup", event);
        }
    }

    private endDragging(event: MouseEvent): void {
        this.isDragging = false;
        const position = this.shapeDelegate.getPosition();
        this.emit("dragend", { x: position.x, y: position.y, event });
    }

    private handleClick(event: MouseEvent): void {
        const rect = this.shapeDelegate.getBoundingBox();
        if (this.shapeDelegate.isPointInShape(event.offsetX, event.offsetY, rect)) {
            this.emit("click", { children: rect.radial.getChildren(), event });
        }
    }

    private handleMouseLeave(): void {
        if (this.isDragging) {
            this.isDragging = false;
            const position = this.shapeDelegate.getPosition();
            this.emit("dragend", { x: position.x, y: position.y });
        }
    }

    private throttledDragUpdate = (event: MouseEvent): void => {
        const currentTime = performance.now();
        if (currentTime - this.lastDragUpdate >= Events.THROTTLE_DELAY) {
            const dx = event.offsetX - this.dragStartX;
            const dy = event.offsetY - this.dragStartY;
            
            this.shapeDelegate.updatePosition({
                x: this.initialX + dx,
                y: this.initialY + dy
            });

            const position = this.shapeDelegate.getPosition();
            this.emit("drag", {
                x: position.x,
                y: position.y,
                event: event
            });

            this.lastDragUpdate = currentTime;
        }
    };
}