import type { Radial } from '../../Radial';
import { Shape, type ExtendedBaseConfig } from './Shape';

export interface ConfigPolygon extends ExtendedBaseConfig {
    radius: number;
    sides: number;
}

export class Polygon extends Shape {
    public config: ConfigPolygon;
    private radial: Radial;
    private shape: string = "Polygon";
    private isInitialized: boolean = false;

    constructor(radial: Radial, config: ConfigPolygon) {
        super(radial.getCtx(), config);
        this.radial = radial;
        this.config = {
            ...config,
            sides: Math.max(3, Math.floor(config.sides))
        };
        this.render();
    }

    protected draw() {
        const { x, y, radius, sides } = this.config;
        const angleStep = (Math.PI * 2) / sides;
        const startAngle = -Math.PI / 2;

        this.ctx.beginPath();
        
        this.ctx.moveTo(
            x + radius * Math.cos(startAngle),
            y + radius * Math.sin(startAngle)
        );

        for (let i = 1; i <= sides; i++) {
            const angle = startAngle + (i * angleStep);
            this.ctx.lineTo(
                x + radius * Math.cos(angle),
                y + radius * Math.sin(angle)
            );
        }

        this.ctx.closePath();
        this.ctx.fill();

        if (!this.isInitialized) {
            this.radial.children.push(this);
            this.isInitialized = true;
        }
    }

    public getBoundingBox(): { x: number; y: number; radius: number; shape: string; radial: Radial } {
        const { x, y, radius } = this.config;
        return { x, y, radius, shape: this.shape, radial: this.radial };
    }
}