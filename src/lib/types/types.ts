import type { Shape } from "../class/Shapes/Shape";
import type { Radial } from "../Radial";

export interface GradientConfig {
    from?: string;
    to?: string;
    deg?: number;
}

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
    width?: number;
    height?: number;
    radius?: number;
    color: string;
    borderWidth?: number;
    borderColor?: string;
    borderOpacity?: number;
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
    visible?: boolean;
    rotation?: number;
    scale?: {x: number, y: number};
    gradient?: GradientConfig;
}

// Define default values in a separate constant
export const DEFAULT_SHAPE_CONFIG = {
    visible: true,
    opacity: 1,
    rotation: 0,
    scale: { x: 1, y: 1 },
    draggable: false,
    borderOpacity: 1,
    collision: false,
    closest: false,
    closestDistance: 100,
    trail: false,
    trailAlpha: 0.1,
    ignore: false
} as const;