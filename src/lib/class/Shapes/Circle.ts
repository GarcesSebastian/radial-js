import type { Radial } from '../../Radial';
import { Shape, type ConfigShape } from './Shape';

export interface ConfigCircle extends ConfigShape {
    radius: number;
}

export class Circle extends Shape {
    private radial: Radial;
    protected config: ConfigCircle;
    private shape: string = "Circle";
    private isInitialized: boolean = false;

    constructor(radial: Radial, config: ConfigCircle) {
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

    protected getBoundingBox(): { x: number; y: number; radius: number; shape: string, radial: Radial } {
        const { x, y, radius } = this.config;
        return { x, y, radius, shape: this.shape, radial: this.radial };
    }
}
