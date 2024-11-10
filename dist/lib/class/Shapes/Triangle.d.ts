import type { Radial } from '../../Radial';
import { Shape, type ConfigShape } from './Shape';
export interface ConfigTriangle extends ConfigShape {
    radius: number;
}
export declare class Triangle extends Shape {
    private radial;
    protected config: ConfigTriangle;
    private shape;
    private isInitialized;
    constructor(radial: Radial, config: ConfigTriangle);
    protected draw(): void;
    protected getBoundingBox(): {
        x: number;
        y: number;
        radius: number;
        shape: string;
        radial: Radial;
    };
}
