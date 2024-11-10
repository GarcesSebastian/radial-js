import type { Radial } from '../../Radial';
import { Shape, type ConfigShape } from './Shape';
export interface ConfigRect extends ConfigShape {
    width: number;
    height: number;
    borderRadius?: number;
}
export declare class Rect extends Shape {
    private radial;
    protected config: ConfigRect;
    private shape;
    private isInitialized;
    constructor(radial: Radial, config: ConfigRect);
    protected draw(): void;
    protected getBoundingBox(): {
        x: number;
        y: number;
        width: number;
        height: number;
        shape: string;
        radial: Radial;
    };
}
