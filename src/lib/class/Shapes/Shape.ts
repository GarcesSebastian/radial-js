import type { Radial } from "../../Radial";
import { DEFAULT_SHAPE_CONFIG, type BaseConfig, type CollisionState, type GradientConfig, type ShapeBoundingBox } from "../../types/types";
import { convertColorToRgba, mergeWithDefaults } from "../../utils/lib";
import { Events } from "../utils/Events";

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
    protected dirtyFlag: boolean = true;
    public config: Required<ExtendedBaseConfig>;
    private auxConfig: Required<ExtendedBaseConfig>;
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

    protected emit(event: string, ...args: any[]) {
        this.eventManager.emit(event, ...args);
    }

    public getEventDelegate(): IShapeEventDelegate {
        return this;
    }

    public getPosition(): { x: number; y: number } {
        return {
            x: this.config.x,
            y: this.config.y
        };
    }

    protected getConfigValue<K extends keyof ExtendedBaseConfig>(
        key: K
    ): NonNullable<ExtendedBaseConfig[K]> {
        return (this.config[key] ?? (DEFAULT_SHAPE_CONFIG as any)[key]) as NonNullable<ExtendedBaseConfig[K]>;
    }

    public getConfig(): BaseConfig {
        return this.config;
    }

    public getCollisionState(): CollisionState {
        return this.collisionState;
    }

    public getAttrs(): { [key: string]: any } {
        return {...this.config };
    }

    public getAttr<K extends keyof ExtendedBaseConfig>(attr: K): NonNullable<ExtendedBaseConfig[K]> {
        return this.getConfigValue(attr);
    }

    public setDirtyFlag(value: boolean): void {
        this.dirtyFlag = value;
    }

    public setAttr<K extends keyof ExtendedBaseConfig>(attr: K, value: ExtendedBaseConfig[K]): void {
        const currentValue = this.getConfigValue(attr);
        if (currentValue !== value) {
            this.config[attr] = value as Required<ExtendedBaseConfig>[K];
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

    public updatePosition(position: { x: number; y: number }): void {
        this.config.x = position.x;
        this.config.y = position.y;
        this.setDirtyFlag(true);
        this.requestRedraw();
    }

    public updateCollisionState(state: Partial<CollisionState>): void {
        this.collisionState = {
            ...this.collisionState,
            ...state
        };
    }

    public isDraggable(): boolean {
        return this.config.draggable!;
    }

    public isIgnored(): boolean {
        return !!this.config.ignore;
    }

    public isCollisionEnabled(): boolean {
        return !!this.config.collision;
    }

    public on(event: string, handler: Function) {
        this.eventManager.on(event, handler);
    }

    public off(event: string, handler: Function) {
        this.eventManager.off(event, handler);
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
        
        const scaledWidth = baseRect.width! * finalScaleX;
        const scaledHeight = baseRect.height! * finalScaleY;
        
        if (rotation === 0) {
            return {
                ...baseRect,
                width: scaledWidth,
                height: scaledHeight
            };
        }
        
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

    private createGradient(): CanvasGradient | null {
        const { gradient } = this.config;
        if (!gradient || !gradient.from || !gradient.to) return null;

        const angle = (gradient.deg || 0) * Math.PI / 180;
        const boundingBox = this.getBoundingRect();
        const centerX = boundingBox.x + (boundingBox.width || 0) / 2;
        const centerY = boundingBox.y + (boundingBox.height || 0) / 2;
        const diagonal = Math.sqrt(
            Math.pow(boundingBox.width || 0, 2) + 
            Math.pow(boundingBox.height || 0, 2)
        );
        const radius = diagonal / 2;
        const startX = centerX - Math.cos(angle) * radius;
        const startY = centerY - Math.sin(angle) * radius;
        const endX = centerX + Math.cos(angle) * radius;
        const endY = centerY + Math.sin(angle) * radius;

        const gradientObj = this.ctx.createLinearGradient(startX, startY, endX, endY);
        gradientObj.addColorStop(0, gradient.from);
        gradientObj.addColorStop(1, gradient.to);

        return gradientObj;
    }

    private requestFullCanvasRedraw(radial: Radial): void {
        const canvas = this.ctx.canvas;
        this.ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.eventManager.handleCollision(radial);
        radial.children.forEach(shape => {
            shape.dirtyFlag = true;
            shape.render();
        });
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
            this.ctx.strokeStyle = convertColorToRgba(borderColor, borderOpacity);
        }

        const gradient = this.createGradient();
        this.ctx.fillStyle = gradient || color;

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

    protected draw(): void {
        throw new Error("Method 'draw()' must be implemented.");
    }

    public render() {
        if (!this.dirtyFlag || !this.auxConfig.visible) return;

        this.applyStyles();
        this.draw();
        
        if (this.config.borderWidth && this.config.borderColor) {
            this.ctx.stroke();
        }
        
        this.ctx.restore();
        this.dirtyFlag = false;
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
}