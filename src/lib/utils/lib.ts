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

    if (dim1.isRadius && dim2.isRadius) {
        const dx = dim1.x - dim2.x;
        const dy = dim1.y - dim2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = dim1.radius! + dim2.radius!;
        return distance <= minDistance;
    }

    if ((dim1.isRadius && !dim2.isRadius) || (!dim1.isRadius && dim2.isRadius)) {
        const [circle, rect] = dim1.isRadius ? [dim1, dim2] : [dim2, dim1];
        
        const rectWithBorder = {
            x: rect.x - rect.borderWidth,
            y: rect.y - rect.borderWidth,
            width: rect.width!,
            height: rect.height!
        };

        const closestX = Math.max(rectWithBorder.x, 
                          Math.min(circle.x, rectWithBorder.x + rectWithBorder.width));
        const closestY = Math.max(rectWithBorder.y, 
                          Math.min(circle.y, rectWithBorder.y + rectWithBorder.height));

        const dx = circle.x - closestX;
        const dy = circle.y - closestY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        return distance <= circle.radius!;
    }

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

export function isPointInShape(x: number, y: number, rect: ShapeBoundingBox): boolean {
    switch (rect.shape) {
        case "Rect":
            return x >= rect.x && x <= rect.x + rect.width! &&
                   y >= rect.y && y <= rect.y + rect.height!;

        case "Circle": {
            const dx = x - rect.x;
            const dy = y - rect.y;
            return dx * dx + dy * dy <= rect.radius! * rect.radius!;
        }

        case "Triangle": {
            const vertices = calculateTriangleVertices(rect.x, rect.y, rect.radius!);
            const [[x1, y1], [x2, y2], [x3, y3]] = vertices;
            const totalArea = calculateArea(x1, y1, x2, y2, x3, y3);
            const area1 = calculateArea(x, y, x2, y2, x3, y3);
            const area2 = calculateArea(x1, y1, x, y, x3, y3);
            const area3 = calculateArea(x1, y1, x2, y2, x, y);
            return Math.abs(totalArea - (area1 + area2 + area3)) < 0.1;
        }

        case "Line": {
            const { points, lineWidth } = rect;
            const halfLineWidth = (lineWidth || 1) / 2;
            
            for (let i = 0; i < points!.length - 2; i += 2) {
                const x1 = points![i];
                const y1 = points![i + 1];
                const x2 = points![i + 2];
                const y2 = points![i + 3];
                const dx = x2 - x1;
                const dy = y2 - y1;
                const length = Math.sqrt(dx * dx + dy * dy);
                
                if (length === 0) continue;
                
                const t = ((x - x1) * dx + (y - y1) * dy) / (length * length);
                
                if (t >= 0 && t <= 1) {
                    const closestX = x1 + t * dx;
                    const closestY = y1 + t * dy;
                    const distance = Math.sqrt(
                        (x - closestX) * (x - closestX) + 
                        (y - closestY) * (y - closestY)
                    );
                    
                    if (distance <= halfLineWidth) {
                        return true;
                    }
                }
            }
            return false;
        }

        default:
            return false;
    }
}

export function convertColorToRgba(color: string, opacity: number): string {
    if (color.startsWith('#')) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    
    if (color.startsWith('rgb')) {
        if (color.startsWith('rgba')) {
            return color.replace(/[\d.]+\)$/g, `${opacity})`);
        }
        return color.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
    }
    
    const tempElement = document.createElement('div');
    tempElement.style.color = color;
    document.body.appendChild(tempElement);
    const computedColor = getComputedStyle(tempElement).color;
    document.body.removeChild(tempElement);
    return computedColor.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
}