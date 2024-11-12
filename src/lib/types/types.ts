import type { Shape } from "../class/Shapes/Shape";
import type { Radial } from "../Radial";

export interface CollisionState {
    isColliding: boolean;
    previousCollision: boolean;
    currentCollisions: Shape[];
}

export interface ShapeBoundingBox {
    x: number;
    y: number;
    width?: number;
    height?: number;
    radius?: number;
    points?: number[];
    lineWidth?: number;
    shape: string;
    radial: Radial;
}

export type Point = {
    x: number;
    y: number;
};

export interface BaseConfig {
    x: number;
    y: number;
    color: string;
    borderWidth?: number;
    borderColor?: string;
    shadowColor?: string;
    shadowBlur?: number;
    shadowOffset?: Point;
    opacity?: number;
    trail?: boolean;
    trailAlpha?: number;
    draggable?: boolean;
    collision?: boolean;
    closest?: boolean;
    closestDistance?: number;
    ignore?: boolean;
}