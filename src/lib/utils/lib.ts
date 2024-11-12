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

export function checkCollision(shape1: Shape, shape2: Shape, box1: ShapeBoundingBox, box2: ShapeBoundingBox): boolean {
    // Helper function to get shape dimensions including border
    const getDimensions = (shape: Shape, box: ShapeBoundingBox) => {
        const borderWidth = (shape.getAttr('borderWidth') || 0) / 2;
        return {
            x: box.x,
            y: box.y,
            width: (box.width || 0) + borderWidth * 2,
            height: (box.height || 0) + borderWidth * 2,
            radius: (box.radius || 0) + borderWidth,
            borderWidth
        };
    };

    const dim1 = getDimensions(shape1, box1);
    const dim2 = getDimensions(shape2, box2);

    // Circle to Circle collision
    if (box1.shape === "Circle" && box2.shape === "Circle") {
        const dx = dim1.x - dim2.x;
        const dy = dim1.y - dim2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = dim1.radius + dim2.radius;
        return distance <= minDistance;
    }

    // Circle to Rectangle collision
    if ((box1.shape === "Circle" && box2.shape === "Rect") || 
        (box1.shape === "Rect" && box2.shape === "Circle")) {
        const [circle, rect] = box1.shape === "Circle" ? [dim1, dim2] : [dim2, dim1];
        
        // Adjust rectangle dimensions to account for border
        const rectWithBorder = {
            x: rect.x - rect.borderWidth,
            y: rect.y - rect.borderWidth,
            width: rect.width,
            height: rect.height
        };

        // Find closest point on rectangle to circle center
        const closestX = Math.max(rectWithBorder.x, 
                                Math.min(circle.x, rectWithBorder.x + rectWithBorder.width));
        const closestY = Math.max(rectWithBorder.y, 
                                Math.min(circle.y, rectWithBorder.y + rectWithBorder.height));
        
        // Calculate distance between closest point and circle center
        const dx = circle.x - closestX;
        const dy = circle.y - closestY;
        const distanceSquared = dx * dx + dy * dy;
        
        return distanceSquared <= (circle.radius * circle.radius);
    }

    // Rectangle to Rectangle collision
    if (box1.shape === "Rect" && box2.shape === "Rect") {
        // Adjust rectangles for border width
        const rect1 = {
            x: dim1.x - dim1.borderWidth,
            y: dim1.y - dim1.borderWidth,
            width: dim1.width,
            height: dim1.height
        };
        
        const rect2 = {
            x: dim2.x - dim2.borderWidth,
            y: dim2.y - dim2.borderWidth,
            width: dim2.width,
            height: dim2.height
        };

        return !(
            rect1.x + rect1.width < rect2.x ||
            rect1.x > rect2.x + rect2.width ||
            rect1.y + rect1.height < rect2.y ||
            rect1.y > rect2.y + rect2.height
        );
    }

    // Default case: use bounding rectangles with borders
    const rect1 = {
        x: dim1.x - dim1.borderWidth,
        y: dim1.y - dim1.borderWidth,
        width: dim1.width,
        height: dim1.height
    };
    
    const rect2 = {
        x: dim2.x - dim2.borderWidth,
        y: dim2.y - dim2.borderWidth,
        width: dim2.width,
        height: dim2.height
    };

    return !(
        rect1.x + rect1.width < rect2.x ||
        rect1.x > rect2.x + rect2.width ||
        rect1.y + rect1.height < rect2.y ||
        rect1.y > rect2.y + rect2.height
    );
}

export function calculateShadowPadding(shadowOffset: {x: number, y: number}, shadowBlur: number = 0): { top: number; right: number; bottom: number; left: number; width: number; height: number } {
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