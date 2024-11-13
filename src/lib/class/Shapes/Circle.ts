import type { Radial } from '../../Radial';
import { Shape, type ExtendedBaseConfig } from './Shape';

export interface ConfigCircle extends ExtendedBaseConfig {
    radius: number;
    isRadius?: boolean;
}

export class Circle extends Shape {
    private radial: Radial;
    public config: ConfigCircle;
    private shape: string = "Circle";
    private isInitialized: boolean = false;

    constructor(radial: Radial, config: ConfigCircle) {
        config.isRadius = true;
        super(radial.getCtx(), config);
        this.radial = radial;
        this.config = config;
        this.render();
    }

    protected draw() {
        const { x, y, radius } = this.config;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2, true);
        this.ctx.fill();
        this.ctx.closePath();

        if (!this.isInitialized) {
            this.radial.children.push(this);
            this.isInitialized = true;
        }
    }

    public getBoundingBox(): { x: number; y: number; radius: number; shape: string, radial: Radial } {
        const { x, y, radius } = this.config;
        return { x, y, radius, shape: this.shape, radial: this.radial };
    }
}
