import type { Radial } from "../../Radial";
import type { BaseConfig, CollisionState, ShapeBoundingBox } from "../../types/types";
import { calculateArea, calculateShadowPadding, calculateTriangleVertices } from "../../utils/lib";
import { Events } from "../utils/Events";

// Types and Interfaces remain the same
interface BoundingRect {
    x: number;
    y: number;
    width?: number;
    height?: number;
    radius?: number;
}

export interface IShapeEventDelegate {
    getBoundingBox(): ShapeBoundingBox;
    isPointInShape(x: number, y: number, rect: ShapeBoundingBox): boolean;
    isDraggable(): boolean;
    getPosition(): { x: number; y: number };
    updatePosition(position: { x: number; y: number }): void;
    isIgnored(): boolean;
    isCollisionEnabled(): boolean;
    getCollisionState(): CollisionState;
    updateCollisionState(state: Partial<CollisionState>): void;
}

export interface ConfigShapeGlobal extends BaseConfig {
    width: number;
    height: number;
    radius: number;
}

export class Shape implements IShapeEventDelegate {
    protected ctx: CanvasRenderingContext2D;
    protected config: BaseConfig;
    protected dirtyFlag: boolean = true;
    private rafId: number | null = null;
    private eventManager: Events;
    private collisionState: CollisionState = {
        isColliding: false,
        previousCollision: false,
        currentCollisions: []
    };

    constructor(ctx: CanvasRenderingContext2D, config: BaseConfig) {
        this.ctx = ctx;
        this.config = {
            ...config,
            draggable: config.draggable ?? false,
            collision: config.collision ?? false,
            closest: config.closest ?? false,
            closestDistance: config.closestDistance ?? 100,
            trail: config.trail ?? false,
            trailAlpha: config.trailAlpha ?? 0.1
        };
        this.eventManager = new Events(this, ctx);
    }

    public on(event: string, handler: Function) {
        this.eventManager.on(event, handler);
    }

    public off(event: string, handler: Function) {
        this.eventManager.off(event, handler);
    }

    protected emit(event: string, ...args: any[]) {
        this.eventManager.emit(event, ...args);
    }
    public getEventDelegate(): IShapeEventDelegate {
        return this;
    }

    public isDraggable(): boolean {
        return this.config.draggable!;
    }

    public getPosition(): { x: number; y: number } {
        return {
            x: this.config.x,
            y: this.config.y
        };
    }

    public updatePosition(position: { x: number; y: number }): void {
        this.config.x = position.x;
        this.config.y = position.y;
        this.setDirtyFlag(true);
        this.requestRedraw();
    }

    public isIgnored(): boolean {
        return !!this.config.ignore;
    }

    public isCollisionEnabled(): boolean {
        return !!this.config.collision;
    }

    public getCollisionState(): CollisionState {
        return this.collisionState;
    }

    public updateCollisionState(state: Partial<CollisionState>): void {
        this.collisionState = {
            ...this.collisionState,
            ...state
        };
    }

    public setDirtyFlag(value: boolean): void {
        this.dirtyFlag = value;
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

    public getAttrs(): { [key: string]: any } {
        return {...this.config };
    }

    public getConfig(): BaseConfig {
        return this.config;
    }

    public getBoundingBox(): ShapeBoundingBox {
        throw new Error("Method 'getBoundingBox()' must be implemented.");
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
                const shadowPadding = calculateShadowPadding(this.config.shadowOffset!, this.config.shadowBlur);

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
                const shadowPadding = calculateShadowPadding(this.config.shadowOffset!, this.config.shadowBlur);

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
                const vertices = calculateTriangleVertices(x, y, radius);
                
                vertices.forEach(([vx, vy]) => {
                    minX = Math.min(minX, vx);
                    minY = Math.min(minY, vy);
                    maxX = Math.max(maxX, vx);
                    maxY = Math.max(maxY, vy);
                });

                const shadowPadding = calculateShadowPadding(this.config.shadowOffset!, this.config.shadowBlur);
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

                const shadowPadding = calculateShadowPadding(this.config.shadowOffset!, this.config.shadowBlur);

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

    public isPointInShape(x: number, y: number, rect: ShapeBoundingBox): boolean {
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
                const vertices = calculateTriangleVertices(rect.x, rect.y, rect.radius!);
                const [[x1, y1], [x2, y2], [x3, y3]] = vertices;
        
                const totalArea = calculateArea(x1, y1, x2, y2, x3, y3);
                const area1 = calculateArea(x, y, x2, y2, x3, y3);
                const area2 = calculateArea(x1, y1, x, y, x3, y3);
                const area3 = calculateArea(x1, y1, x2, y2, x, y);
        
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

        this.eventManager.clearEvents();
    }

    public bounce(duration: number): void {
        const startTime = performance.now();
    
        const animate = (currentTime: number) => {
            const elapsedTime = currentTime - startTime;
    
            if (elapsedTime >= duration) {
                this.destroy();
            } else {
                requestAnimationFrame(animate);
            }
        };
    
        requestAnimationFrame(animate);
    }

    private requestFullCanvasRedraw(radial: Radial): void {
        const canvas = this.ctx.canvas;
        this.ctx.clearRect(0, 0, canvas.width, canvas.height);

        this.eventManager.handleCollision(radial);
    
        // Render all shapes
        radial.children.forEach(shape => {
            shape.dirtyFlag = true;
            shape.render();
        });
    }

    public requestRedraw(): void {
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

        this.setAttr("colorBackup", color);
        this.ctx.fillStyle = color;
    }

    protected draw(): void {
        throw new Error("Method 'draw()' must be implemented.");
    }

    protected render() {
        if (!this.dirtyFlag) return;
        
        this.applyStyles();
        this.draw();
        
        if (this.config.borderWidth && this.config.borderColor) {
            this.ctx.stroke();
        }
        
        this.ctx.restore();
        this.dirtyFlag = false;
    }
}