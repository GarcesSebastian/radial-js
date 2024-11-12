import type { Radial } from '../../Radial';
import { Shape } from './Shape';
import type { BaseConfig } from '../../types/types';

export interface ConfigRect extends BaseConfig {
    width: number;
    height: number;
    borderRadius?: number;
}

export class Rect extends Shape {
    private radial: Radial;
    protected config: ConfigRect;
    private shape: string = "Rect";
    private isInitialized: boolean = false;

    constructor(radial: Radial, config: ConfigRect) {
        super(radial.getCtx(), config);
        this.radial = radial;
        this.config = config;
        this.render();
    }

    protected draw() {
        const { x, y, width, height, borderRadius } = this.config;
        
        this.ctx.beginPath();

        if (borderRadius) {
            this.ctx.moveTo(x + borderRadius, y);
            this.ctx.arcTo(x + width, y, x + width, y + height, borderRadius);
            this.ctx.arcTo(x + width, y + height, x, y + height, borderRadius);
            this.ctx.arcTo(x, y + height, x, y, borderRadius);
            this.ctx.arcTo(x, y, x + width, y, borderRadius);
        } else {
            this.ctx.rect(x, y, width, height);
        }

        this.ctx.fill();
        this.ctx.closePath();

        if (!this.isInitialized) {
            this.radial.children.push(this);
            this.isInitialized = true;
        }
    }

    public getBoundingBox(): { x: number; y: number; width: number; height: number; shape: string, radial: Radial } {
        const { x, y, width, height } = this.config;
        return { x, y, width, height, shape: this.shape, radial: this.radial };
    }
}