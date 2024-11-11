import type { Radial } from "../../Radial";
import type { BaseConfig } from "../../types/types";

// Types and Interfaces remain the same
interface ShapeBoundingBox {
    x: number;
    y: number;
    width?: number;
    height?: number;
    radius?: number;
    points?: number[];
    lineWidth?: number;
    shape: string;
    radial: Radial;
}

interface BoundingRect {
    x: number;
    y: number;
    width?: number;
    height?: number;
    radius?: number;
}

export interface ConfigShapeGlobal extends BaseConfig {
    width: number;
    height: number;
    radius: number;
}

export class Shape {
    private static readonly THROTTLE_DELAY = 16;

    protected ctx: CanvasRenderingContext2D;
    protected config: BaseConfig;
    protected dirtyFlag: boolean = true;

    private events: Map<string, Set<Function>>;
    private isDragging: boolean = false;
    private dragStartX: number = 0;
    private dragStartY: number = 0;
    private initialX: number = 0;
    private initialY: number = 0;
    private lastDragUpdate: number = 0;
    private rafId: number | null = null;

    constructor(ctx: CanvasRenderingContext2D, config: BaseConfig) {
        this.ctx = ctx;
        this.config = {
            ...config,
            draggable: config.draggable ?? false
        };
        this.events = new Map();
        this.addEventListeners();
    }

    public setAttr(attr: string, value: any): void {
        if ((this.config as any)[attr] !== value) {
            (this.config as any)[attr] = value;
            this.dirtyFlag = true;
            this.requestRedraw();
        }
    }

    public setAttrs(attrs: { [key: string]: any }): void {
        let hasChanged = false;
        for (const [key, value] of Object.entries(attrs)) {
            if ((this.config as any)[key] !== value) {
                (this.config as any)[key] = value;
                hasChanged = true;
            }
        }
        if (hasChanged) {
            this.dirtyFlag = true;
            this.requestRedraw();
        }
    }

    public getAttr(attr: any): any {
        return (this.config as any)[attr];
    }

    public render() {
        if (!this.dirtyFlag) return;
        
        this.applyStyles();
        this.draw();
        
        if (this.config.borderWidth && this.config.borderColor) {
            this.ctx.stroke();
        }
        
        this.ctx.restore();
        this.dirtyFlag = false;
    }

    public destroy(): void {
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
        }
        
        const radial = this.getBoundingBox().radial;
        const index = radial.children.indexOf(this);
        
        if (index !== -1) {
            radial.children.splice(index, 1);
            this.requestFullCanvasRedraw(radial);
        }

        this.events.clear();
    }

    private requestFullCanvasRedraw(radial: Radial): void {
        const canvas = this.ctx.canvas;
        this.ctx.clearRect(0, 0, canvas.width, canvas.height);

        radial.children.forEach(shape => {
            shape.dirtyFlag = true;
            shape.render();
        });
    }

    public on(event: string, handler: Function) {
        if (!this.events.has(event)) {
            this.events.set(event, new Set());
        }
        this.events.get(event)!.add(handler);
    }

    public off(event: string, handler: Function) {
        const handlers = this.events.get(event);
        if (handlers) {
            handlers.delete(handler);
        }
    }

    protected emit(event: string, ...args: any[]) {
        const handlers = this.events.get(event);
        if (handlers) {
            handlers.forEach(handler => handler(...args));
        }
    }

    protected getBoundingBox(): ShapeBoundingBox {
        throw new Error("Method 'getBoundingBox()' must be implemented.");
    }

    protected draw(): void {
        throw new Error("Method 'draw()' must be implemented.");
    }

    private applyStyles() {
        const { color, borderWidth, borderColor, shadowColor, shadowBlur, shadowOffset } = this.config;
        this.ctx.save();

        this.ctx.shadowColor = 'rgba(0, 0, 0, 0)';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;

        if (shadowColor) {
            this.ctx.shadowColor = shadowColor;
            if (shadowBlur !== undefined) {
                this.ctx.shadowBlur = shadowBlur;
            }
            if (shadowOffset) {
                this.ctx.shadowOffsetX = shadowOffset.x;
                this.ctx.shadowOffsetY = shadowOffset.y;
            }
        }

        if (borderWidth && borderColor) {
            this.ctx.lineWidth = borderWidth;
            this.ctx.strokeStyle = borderColor;
        }

        this.ctx.fillStyle = color;
    }

    private addEventListeners() {
        const canvas = this.ctx.canvas;
        let isOverShape = false;

        const handleMouseMove = (event: MouseEvent) => {
            const rect = this.getBoundingBox();
            const isCurrentlyOverShape = this.isPointInShape(event.offsetX, event.offsetY, rect);

            if (isCurrentlyOverShape && !isOverShape) {
                isOverShape = true;
            } else if (!isCurrentlyOverShape && isOverShape) {
                isOverShape = false;
            }

            if (this.isDragging && this.config.draggable) {
                this.throttledDragUpdate(event);
            }
        };

        canvas.addEventListener("mousemove", handleMouseMove, { passive: true });
        
        canvas.addEventListener("mousedown", (event) => {
            const rect = this.getBoundingBox();
            if (this.isPointInShape(event.offsetX, event.offsetY, rect)) {
                if (this.config.draggable) {
                    this.isDragging = true;
                    this.dragStartX = event.offsetX;
                    this.dragStartY = event.offsetY;
                    this.initialX = this.config.x;
                    this.initialY = this.config.y;
                    this.emit("dragstart", { x: this.config.x, y: this.config.y, event });
                }
                this.emit("mousedown", event);
            }
        }, { passive: true });

        canvas.addEventListener("mouseup", (event) => {
            if (this.isDragging) {
                this.isDragging = false;
                this.emit("dragend", { x: this.config.x, y: this.config.y, event });
            }
            if (this.isPointInShape(event.offsetX, event.offsetY, this.getBoundingBox())) {
                this.emit("mouseup", event);
            }
        }, { passive: true });

        canvas.addEventListener("click", (event) => {
            const rect = this.getBoundingBox();
            if (this.isPointInShape(event.offsetX, event.offsetY, rect)) {
                this.emit("click", { children: rect.radial.getChildren(), event });
            }
        }, { passive: true });

        canvas.addEventListener("mouseleave", () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.emit("dragend", { x: this.config.x, y: this.config.y });
            }
        }, { passive: true });
    }

    private throttledDragUpdate = (event: MouseEvent) => {
        const currentTime = performance.now();
        if (currentTime - this.lastDragUpdate >= Shape.THROTTLE_DELAY) {
            const dx = event.offsetX - this.dragStartX;
            const dy = event.offsetY - this.dragStartY;
            this.config.x = this.initialX + dx;
            this.config.y = this.initialY + dy;

            this.dirtyFlag = true;
            this.requestRedraw();
            
            this.emit("drag", {
                x: this.config.x,
                y: this.config.y,
                event: event
            });

            this.lastDragUpdate = currentTime;
        }
    };

    private requestRedraw(): void {
        if (this.rafId === null) {
            this.rafId = requestAnimationFrame(() => {
                this.rafId = null;
                if (this.dirtyFlag) {
                    const radial = this.getBoundingBox().radial;
                    this.requestFullCanvasRedraw(radial);
                }
            });
        }
    }

    public getBoundingRect(): BoundingRect {
        const box = this.getBoundingBox();
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        switch (box.shape) {
            case "Rect": {
                const { x, y, width = 0, height = 0 } = box;
                const borderWidth = this.config.borderWidth || 0;
                const halfBorder = borderWidth / 2;
                const shadowPadding = this.calculateShadowPadding();

                return {
                    x: x - halfBorder - shadowPadding.left,
                    y: y - halfBorder - shadowPadding.top,
                    width: width + borderWidth + shadowPadding.width,
                    height: height + borderWidth + shadowPadding.height
                };
            }
            case "Circle": {
                const { x, y, radius = 0 } = box;
                const borderWidth = this.config.borderWidth || 0;
                const totalRadius = radius + borderWidth / 2;
                const shadowPadding = this.calculateShadowPadding();

                return {
                    x: x,
                    y: y,
                    width: totalRadius * 2 + shadowPadding.width,
                    height: totalRadius * 2 + shadowPadding.height,
                    radius: radius
                };
            }
            case "Triangle": {
                const { x, y, radius = 0 } = box;
                const borderWidth = this.config.borderWidth || 0;
                const vertices = this.calculateTriangleVertices(x, y, radius);
                
                vertices.forEach(([vx, vy]) => {
                    minX = Math.min(minX, vx);
                    minY = Math.min(minY, vy);
                    maxX = Math.max(maxX, vx);
                    maxY = Math.max(maxY, vy);
                });

                const shadowPadding = this.calculateShadowPadding();
                const width = maxX - minX + borderWidth + shadowPadding.width;
                const height = maxY - minY + borderWidth + shadowPadding.height;

                return {
                    x: minX - borderWidth / 2 - shadowPadding.left,
                    y: minY - borderWidth / 2 - shadowPadding.top,
                    width,
                    height,
                    radius
                };
            }
            case "Line": {
                const { points = [], lineWidth = 1 } = box;
                const halfLineWidth = lineWidth / 2;

                for (let i = 0; i < points.length; i += 2) {
                    const px = points[i];
                    const py = points[i + 1];
                    minX = Math.min(minX, px);
                    minY = Math.min(minY, py);
                    maxX = Math.max(maxX, px);
                    maxY = Math.max(maxY, py);
                }

                const shadowPadding = this.calculateShadowPadding();

                return {
                    x: minX - halfLineWidth - shadowPadding.left,
                    y: minY - halfLineWidth - shadowPadding.top,
                    width: maxX - minX + lineWidth + shadowPadding.width,
                    height: maxY - minY + lineWidth + shadowPadding.height
                };
            }
            default:
                return { x: 0, y: 0, width: 0, height: 0 };
        }
    }

    private calculateShadowPadding(): { top: number; right: number; bottom: number; left: number; width: number; height: number } {
        const { shadowBlur = 0, shadowOffset } = this.config;
        const offsetX = shadowOffset?.x || 0;
        const offsetY = shadowOffset?.y || 0;

        const left = Math.max(0, shadowBlur - offsetX);
        const right = Math.max(0, shadowBlur + offsetX);
        const top = Math.max(0, shadowBlur - offsetY);
        const bottom = Math.max(0, shadowBlur + offsetY);

        return {
            top,
            right,
            bottom,
            left,
            width: left + right,
            height: top + bottom
        };
    }

    protected isPointInShape(x: number, y: number, rect: ShapeBoundingBox): boolean {
        switch (rect.shape) {
            case "Rect":
                return (
                    x >= rect.x && 
                    x <= rect.x + rect.width! &&
                    y >= rect.y && 
                    y <= rect.y + rect.height!
                );
            case "Circle": {
                const dx = x - rect.x;
                const dy = y - rect.y;
                return dx * dx + dy * dy <= rect.radius! * rect.radius!;
            }
            case "Triangle": {
                const vertices = this.calculateTriangleVertices(rect.x, rect.y, rect.radius!);
                const [[x1, y1], [x2, y2], [x3, y3]] = vertices;
        
                const totalArea = this.calculateArea(x1, y1, x2, y2, x3, y3);
                const area1 = this.calculateArea(x, y, x2, y2, x3, y3);
                const area2 = this.calculateArea(x1, y1, x, y, x3, y3);
                const area3 = this.calculateArea(x1, y1, x2, y2, x, y);
        
                return Math.abs(totalArea - (area1 + area2 + area3)) < 0.1;
            }
            case "Line": {
                const { points, lineWidth } = rect;
                const halfLineWidth = (lineWidth || 1) / 2;
                
                for (let i = 0; i < points!.length - 2; i += 2) {
                    const x1 = points![i];
                    const y1 = points![i + 1];
                    const x2 = points![i + 2];
                    const y2 = points![i + 3];
        
                    const dx = x2 - x1;
                    const dy = y2 - y1;
                    const length = Math.sqrt(dx * dx + dy * dy);
        
                    if (length === 0) continue;
        
                    const t = ((x - x1) * dx + (y - y1) * dy) / (length * length);
                    
                    if (t >= 0 && t <= 1) {
                        const closestX = x1 + t * dx;
                        const closestY = y1 + t * dy;
                        const distance = Math.sqrt(
                            (x - closestX) * (x - closestX) + 
                            (y - closestY) * (y - closestY)
                        );
        
                        if (distance <= halfLineWidth) {
                            return true;
                        }
                    }
                }
                return false;
            }
            default:
                return false;
        }
    }

    private calculateArea(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): number {
        return Math.abs((x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2)) / 2);
    }

    private calculateTriangleVertices(x: number, y: number, radius: number): [number, number][] {
        return [
            [x, y],
            [x + radius, y + radius],
            [x - radius, y + radius]
        ];
    }
}