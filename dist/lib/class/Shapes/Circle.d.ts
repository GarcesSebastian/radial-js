import type { Radial } from '../../Radial';
import { Shape, type ConfigShape } from './Shape';
export interface ConfigCircle extends ConfigShape {
    radius: number;
}
export declare class Circle extends Shape {
    private radial;
    protected config: ConfigCircle;
    private shape;
    private isInitialized;
    constructor(radial: Radial, config: ConfigCircle);
    protected draw(): void;
    protected getBoundingBox(): {
        x: number;
        y: number;
        radius: number;
        shape: string;
        radial: Radial;
    };
}
