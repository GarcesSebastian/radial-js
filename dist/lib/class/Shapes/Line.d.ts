import type { Radial } from '../../Radial';
import { Shape, type ConfigShape } from './Shape';
export interface ConfigLine extends ConfigShape {
    points: number[];
    lineWidth?: number;
    lineJoin?: CanvasLineJoin;
    lineCap?: CanvasLineCap;
    dashArray?: number[];
}
export declare class Line extends Shape {
    private radial;
    protected config: ConfigLine;
    private shape;
    private isInitialized;
    constructor(radial: Radial, config: ConfigLine);
    private setProperties;
    protected draw(): void;
    protected getBoundingBox(): {
        x: number;
        y: number;
        points: number[];
        lineWidth: number | undefined;
        shape: string;
        radial: Radial;
    };
}
