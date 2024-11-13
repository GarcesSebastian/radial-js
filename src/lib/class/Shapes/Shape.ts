import type { Radial } from "../../Radial";
import { DEFAULT_SHAPE_CONFIG, type BaseConfig, type CollisionState, type GradientConfig, type ShapeBoundingBox } from "../../types/types";
import { calculateArea, calculateShadowPadding, calculateTriangleVertices, mergeWithDefaults } from "../../utils/lib";
import { Events } from "../utils/Events";

// Types and Interfaces remain the same
interface BoundingRect {
    x: number;
    y: number;
    width?: number;
    height?: number;
    radius?: number;
    left: number;
    right: number;
    top: number;
    bottom: number;
}

export interface ExtendedBaseConfig extends BaseConfig {
    visible?: boolean;
    opacity?: number;
    rotation?: number;
    scale?: { x: number; y: number };
    draggable?: boolean;
    gradient?: GradientConfig;
    borderOpacity?: number;
    isRadius?: boolean;
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
    public config: Required<ExtendedBaseConfig>;
    private auxConfig: Required<ExtendedBaseConfig>;
    protected ctx: CanvasRenderingContext2D;
    protected dirtyFlag: boolean = true;
    private rafId: number | null = null;
    private eventManager: Events;
    private collisionState: CollisionState = {
        isColliding: false,
        previousCollision: false,
        currentCollisions: []
    };

    constructor(ctx: CanvasRenderingContext2D, userConfig: ExtendedBaseConfig) {
        this.ctx = ctx;
        const configWithDefaults = mergeWithDefaults(userConfig, DEFAULT_SHAPE_CONFIG);
        this.config = configWithDefaults as Required<ExtendedBaseConfig>;
        this.auxConfig = { ...this.config };
        this.eventManager = new Events(this, ctx);
    }

    private createGradient(): CanvasGradient | null {
        const { gradient } = this.config;
        if (!gradient || !gradient.from || !gradient.to) return null;

        const angle = (gradient.deg || 0) * Math.PI / 180;
        const boundingBox = this.getBoundingRect();
        
        // Calculate the center point of the shape
        const centerX = boundingBox.x + (boundingBox.width || 0) / 2;
        const centerY = boundingBox.y + (boundingBox.height || 0) / 2;

        // Calculate the diagonal length of the shape
        const diagonal = Math.sqrt(
            Math.pow(boundingBox.width || 0, 2) + 
            Math.pow(boundingBox.height || 0, 2)
        );
        const radius = diagonal / 2;

        // Calculate start and end points based on angle
        const startX = centerX - Math.cos(angle) * radius;
        const startY = centerY - Math.sin(angle) * radius;
        const endX = centerX + Math.cos(angle) * radius;
        const endY = centerY + Math.sin(angle) * radius;

        const gradientObj = this.ctx.createLinearGradient(
            startX,
            startY,
            endX,
            endY
        );

        gradientObj.addColorStop(0, gradient.from);
        gradientObj.addColorStop(1, gradient.to);

        return gradientObj;
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

    protected getConfigValue<K extends keyof ExtendedBaseConfig>(
        key: K
    ): NonNullable<ExtendedBaseConfig[K]> {
        return (this.config[key] ?? (DEFAULT_SHAPE_CONFIG as any)[key]) as NonNullable<ExtendedBaseConfig[K]>;
    }

    public setAttr<K extends keyof ExtendedBaseConfig>(attr: K, value: ExtendedBaseConfig[K]): void {
        const currentValue = this.getConfigValue(attr);
        if (currentValue !== value) {
            this.config[attr] = value as Required<ExtendedBaseConfig>[K];
            this.dirtyFlag = true;
            this.requestRedraw();
        }
    }

    public getAttr<K extends keyof ExtendedBaseConfig>(attr: K): NonNullable<ExtendedBaseConfig[K]> {
        return this.getConfigValue(attr);
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
        const baseRect: BoundingRect = {
            x: this.config.x,
            y: this.config.y,
            width: this.config.width,
            height: this.config.height,
            radius: this.config.radius,
            left: this.config.x,
            right: this.config.x + (this.config.width || 0),
            top: this.config.y,
            bottom: this.config.y + (this.config.height || 0),
        };

        const { rotation = 0, scale = {x: 1, y: 1} } = this.config;
        
        const finalScaleX = scale.x;
        const finalScaleY = scale.y;
        
        if (rotation === 0 && finalScaleX === 1 && finalScaleY === 1) {
            return baseRect;
        }
        
        // Calculate scaled dimensions
        const scaledWidth = baseRect.width! * finalScaleX;
        const scaledHeight = baseRect.height! * finalScaleY;
        
        if (rotation === 0) {
            return {
                ...baseRect,
                width: scaledWidth,
                height: scaledHeight
            };
        }
        
        // Calculate rotated bounding box
        const rad = rotation * Math.PI / 180;
        const cos = Math.abs(Math.cos(rad));
        const sin = Math.abs(Math.sin(rad));
        
        const rotatedWidth = scaledWidth * cos + scaledHeight * sin;
        const rotatedHeight = scaledWidth * sin + scaledHeight * cos;
        
        return {
            ...baseRect,
            width: rotatedWidth,
            height: rotatedHeight
        };
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

    protected applyStyles() {
        const visible = this.getConfigValue('visible');
        if (!visible) return;

        const opacity = this.getConfigValue('opacity');
        const borderWidth = this.getConfigValue('borderWidth');
        const borderColor = this.getConfigValue('borderColor');
        const borderOpacity = this.getConfigValue('borderOpacity');
        const shadowColor = this.getConfigValue('shadowColor');
        const shadowBlur = this.getConfigValue('shadowBlur');
        const shadowOffset = this.getConfigValue('shadowOffset');
        const color = this.getConfigValue('color');

        this.ctx.save();
        this.ctx.globalAlpha = opacity;

        // Apply shadow if defined
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

        // Apply border styles
        if (borderWidth && borderColor) {
            this.ctx.lineWidth = borderWidth;
            this.ctx.strokeStyle = this.convertColorToRgba(borderColor, borderOpacity);
        }

        // Apply fill style
        const gradient = this.createGradient();
        this.ctx.fillStyle = gradient || color;

        // Apply transformations
        this.applyTransform();
    }

    protected applyTransform() {
        const { x, y } = this.config;
        const rotation = this.getConfigValue('rotation');
        const scale = this.getConfigValue('scale');
        
        this.ctx.translate(x, y);
        
        if (rotation) {
            this.ctx.rotate(rotation * Math.PI / 180);
        }
        
        const finalScaleX = scale.x;
        const finalScaleY = scale.y;
        if (finalScaleX !== 1 || finalScaleY !== 1) {
            this.ctx.scale(finalScaleX, finalScaleY);
        }
        
        this.ctx.translate(-x, -y);
    }

    private convertColorToRgba(color: string, opacity: number): string {
        // Handle hexadecimal
        if (color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        }
        
        // Handle rgb/rgba
        if (color.startsWith('rgb')) {
            if (color.startsWith('rgba')) {
                return color.replace(/[\d.]+\)$/g, `${opacity})`);
            }
            return color.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
        }
        
        // For named colors, convert to rgb first then to rgba
        const tempElement = document.createElement('div');
        tempElement.style.color = color;
        document.body.appendChild(tempElement);
        const computedColor = getComputedStyle(tempElement).color;
        document.body.removeChild(tempElement);
        return computedColor.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
    }

    protected draw(): void {
        throw new Error("Method 'draw()' must be implemented.");
    }

    protected render() {
        if (!this.dirtyFlag || !this.auxConfig.visible) return;

        this.applyStyles();
        this.draw();
        
        if (this.config.borderWidth && this.config.borderColor) {
            this.ctx.stroke();
        }
        
        this.ctx.restore();
        this.dirtyFlag = false;
    }
}