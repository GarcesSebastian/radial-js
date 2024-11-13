import type { Shape } from "../class/Shapes/Shape";
import type { ShapeBoundingBox } from "../types/types";

export function calculateArea(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): number {
    return Math.abs((x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2)) / 2);
}

export function calculateTriangleVertices(x: number, y: number, radius: number): [number, number][] {
    return [
        [x, y],
        [x + radius, y + radius],
        [x - radius, y + radius]
    ];
}

interface ShapeDimensions {
    x: number;
    y: number;
    width?: number;
    height?: number;
    radius?: number;
    borderWidth: number;
    isRadius: boolean;
}

export function checkCollision(shape1: Shape, shape2: Shape, box1: ShapeBoundingBox, box2: ShapeBoundingBox): boolean {
    const getDimensions = (shape: Shape, box: ShapeBoundingBox): ShapeDimensions => {
        const borderWidth = (shape.getAttr('borderWidth') || 0) / 2;
        const isRadius = shape.getAttr('isRadius') || false;
        
        return {
            x: box.x,
            y: box.y,
            width: (box.width || 0) + borderWidth * 2,
            height: (box.height || 0) + borderWidth * 2,
            radius: (box.radius || 0) + borderWidth,
            borderWidth,
            isRadius
        };
    };

    const dim1 = getDimensions(shape1, box1);
    const dim2 = getDimensions(shape2, box2);

    // Both shapes are circular (using radius)
    if (dim1.isRadius && dim2.isRadius) {
        const dx = dim1.x - dim2.x;
        const dy = dim1.y - dim2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = dim1.radius! + dim2.radius!;
        return distance <= minDistance;
    }

    // One shape is circular and the other is rectangular
    if ((dim1.isRadius && !dim2.isRadius) || (!dim1.isRadius && dim2.isRadius)) {
        const [circle, rect] = dim1.isRadius ? [dim1, dim2] : [dim2, dim1];
        
        // Calculate rectangle bounds with border
        const rectWithBorder = {
            x: rect.x - rect.borderWidth,
            y: rect.y - rect.borderWidth,
            width: rect.width!,
            height: rect.height!
        };

        // Find closest point on rectangle to circle center
        const closestX = Math.max(rectWithBorder.x, 
                          Math.min(circle.x, rectWithBorder.x + rectWithBorder.width));
        const closestY = Math.max(rectWithBorder.y, 
                          Math.min(circle.y, rectWithBorder.y + rectWithBorder.height));

        // Calculate distance from closest point to circle center
        const dx = circle.x - closestX;
        const dy = circle.y - closestY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Check if distance is less than circle radius
        return distance <= circle.radius!;
    }

    // Both shapes are rectangular
    // Create rectangles with border adjustments
    const rect1 = {
        x: dim1.x - dim1.borderWidth,
        y: dim1.y - dim1.borderWidth,
        width: dim1.width!,
        height: dim1.height!
    };
    
    const rect2 = {
        x: dim2.x - dim2.borderWidth,
        y: dim2.y - dim2.borderWidth,
        width: dim2.width!,
        height: dim2.height!
    };

    // AABB (Axis-Aligned Bounding Box) collision check
    return !(
        rect1.x + rect1.width < rect2.x ||
        rect1.x > rect2.x + rect2.width ||
        rect1.y + rect1.height < rect2.y ||
        rect1.y > rect2.y + rect2.height
    );
}

export function calculateShadowPadding(shadowOffset: {x: number, y: number}, shadowBlur: number = 0): { 
    top: number; 
    right: number; 
    bottom: number; 
    left: number; 
    width: number; 
    height: number; 
} {
    const offsetX = shadowOffset?.x || 0;
    const offsetY = shadowOffset?.y || 0;

    const left = Math.max(0, shadowBlur - offsetX);
    const right = Math.max(0, shadowBlur + offsetX);
    const top = Math.max(0, shadowBlur - offsetY);
    const bottom = Math.max(0, shadowBlur + offsetY);

    return {
        top,
        right,
        bottom,
        left,
        width: left + right,
        height: top + bottom
    };
}

export function mergeWithDefaults<T extends object>(userConfig: T, defaults: object): T {
    return Object.assign({}, defaults, userConfig);
}