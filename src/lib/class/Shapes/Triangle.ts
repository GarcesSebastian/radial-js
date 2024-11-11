import type { Radial } from '../../Radial';
import { Shape } from './Shape';
import type { BaseConfig } from '../../types/types';

export interface ConfigTriangle extends BaseConfig {
    radius: number;
}

export class Triangle extends Shape {
    private radial: Radial;
    protected config: ConfigTriangle;
    private shape: string = "Triangle";
    private isInitialized: boolean = false;

    constructor(radial: Radial, config: ConfigTriangle) {
        super(radial.getCtx(), config);
        this.radial = radial;
        this.config = config;
        this.render();
    }

    protected draw() {
        const { x, y, radius } = this.config;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x + radius, y + radius);
        this.ctx.lineTo(x - radius, y + radius);
        this.ctx.fill();
        this.ctx.closePath();

        if (!this.isInitialized) {
            this.radial.children.push(this);
            this.isInitialized = true;
        }
    }

    protected getBoundingBox(): { x: number; y: number; radius: number; shape: string, radial: Radial } {
        const { x, y, radius } = this.config;
        return { x, y, radius, shape: this.shape, radial: this.radial };
    }
}