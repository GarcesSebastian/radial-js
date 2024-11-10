import type { Radial } from '../../Radial';
import { Shape, type ConfigShape } from './Shape';

export interface ConfigLine extends ConfigShape {
    points: number[];
    lineWidth?: number;
    lineJoin?: CanvasLineJoin;
    lineCap?: CanvasLineCap;
    dashArray?: number[];
}

export class Line extends Shape {
    private radial: Radial;
    protected config: ConfigLine;
    private shape: string = "Line";
    private isInitialized: boolean = false;

    constructor(radial: Radial, config: ConfigLine) {
        super(radial.getCtx(), config);
        this.radial = radial;
        this.config = config;
        this.setProperties();
        this.render();
    }

    private setProperties() {
        const { lineWidth, lineJoin, lineCap, dashArray } = this.config;

        if (lineWidth) this.ctx.lineWidth = lineWidth;
        if (lineJoin) this.ctx.lineJoin = lineJoin;
        if (lineCap) this.ctx.lineCap = lineCap;
        if (dashArray) this.ctx.setLineDash(dashArray);
    }

    protected draw() {
        this.ctx.beginPath();

        for (let i = 0; i < this.config.points.length; i += 2) {
            const x = this.config.points[i];
            const y = this.config.points[i + 1];

            i === 0 ? this.ctx.moveTo(x, y) : this.ctx.lineTo(x, y);
        }

        this.ctx.strokeStyle = this.config.color;
        this.ctx.stroke();
        this.ctx.closePath();

        if (!this.isInitialized) {
            this.radial.children.push(this);
            this.isInitialized = true;
        }
    }

    protected getBoundingBox(): { x: number; y: number; points: number[]; lineWidth: number | undefined; shape: string, radial: Radial } {
        const { x, y, points, lineWidth } = this.config;
        return { x, y, points, lineWidth, shape: this.shape, radial: this.radial };
    }
}
