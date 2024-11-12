# RadialCanvas.js

RadialCanvas.js is a lightweight, object-oriented canvas manipulation library for TypeScript/JavaScript. It provides an intuitive API for drawing shapes, handling events, and managing canvas interactions.

## Installation

```bash
npm install radial-canvas-js
```

## Features

- 🎨 Easy shape creation (Circle, Rectangle, Triangle, Line)
- 🖱️ Interactive elements with drag & drop support
- 🎯 Event system (click, drag, mousemove, etc.)
- 💫 Visual effects (shadows, borders, rounded corners)
- 📏 Precise bounding box calculations
- ⚡ Optimized performance with throttling and dirty flags
- 🎯 Precise hit detection for all shapes
- 🔄 Transformation system for resizing and rotating elements

## Basic Usage

```typescript
// Get canvas context
const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d');

// Initialize Radial
const radial = new Radial(ctx);

// Create shapes
const circle = radial.Circle({
    x: 100,
    y: 100,
    radius: 50,
    color: 'red',
    draggable: true
});
```

## Interactive Collision Demo

Here's an example that demonstrates the library's capabilities with an interactive collision detection visualization:

```typescript
const main = () => {
    const canvas = document.querySelector("#cw-demo");
    if(!canvas) return;
    
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const radial = new Radial(ctx);
    
    // Store collision lines
    const collisionLines = new Map();
    
    // Create circle with random movement
    const createCircle = (x, y) => {
        const circle = radial.Circle({
            x: x,
            y: y,
            radius: 20,
            color: "rgba(0, 0, 0, 0.5)",
            borderColor: "white",
            borderWidth: 2,
        });
        
        circle.setAttrs({
            dirX: Math.random() * 2 - 1,
            dirY: Math.random() * 2 - 1,
            speed: Math.random() * (5 - 1) + 1,
            isColliding: false,
            id: Date.now() + Math.random() 
        });
    };
    
    // Create circles on drag events
    ["dragstart", "drag", "dragend"].forEach(eventName => {
        radial.on(eventName, (event) => {
            if(!event.canvasTarget) {
                createCircle(event.clientX, event.clientY);
            }
        });
    });

    // Check for collisions between circles
    const checkCollisions = (item) => {
        const itemId = item.getAttr('id');
        const activeCollisions = new Set();
        
        radial.children.forEach(child => {
            if(child === item) return;
            
            const childId = child.getAttr('id');
            const distance = Math.sqrt(
                Math.pow(item.getAttr('x') - child.getAttr('x'), 2) +
                Math.pow(item.getAttr('y') - child.getAttr('y'), 2)
            );
            
            if (distance <= 200) {
                const lineId = [itemId, childId].sort().join('-');
                activeCollisions.add(lineId);
                
                // Create or update collision line
                if (!collisionLines.has(lineId)) {
                    collisionLines.set(lineId, radial.Line({
                        points: [item.getAttr('x'), item.getAttr('y'), 
                                child.getAttr('x'), child.getAttr('y')],
                        color: "rgba(0, 0, 0, 1)",
                        lineWidth: 2,
                        lineCap: "round",
                        borderColor: "white",
                    }));
                } else {
                    collisionLines.get(lineId).setAttrs({
                        points: [item.getAttr('x'), item.getAttr('y'), 
                                child.getAttr('x'), child.getAttr('y')]
                    });
                }
            }
        });
        
        // Clean up inactive collision lines
        Array.from(collisionLines.keys()).forEach(lineId => {
            if (!activeCollisions.has(lineId) && lineId.includes(itemId)) {
                collisionLines.get(lineId).destroy();
                collisionLines.delete(lineId);
            }
        });
    };
    
    // Update loop
    const update = () => {
        radial.children.forEach(item => {
            if (item.config.radius) {
                // Update position
                const {x, y, radius} = item.getBoundingRect();
                const dirX = item.getAttr("dirX");
                const dirY = item.getAttr("dirY");
                const speed = item.getAttr("speed");
                
                let nextX = x + dirX * speed;
                let nextY = y + dirY * speed;
                
                // Bounce off walls
                if(nextX + radius >= canvas.width || nextX - radius <= 0) {
                    item.setAttrs({ dirX: -dirX });
                    nextX = x - dirX * speed;
                }
                if(nextY + radius >= canvas.height || nextY - radius <= 0) {
                    item.setAttrs({ dirY: -dirY });
                    nextY = y - dirY * speed;
                }
                
                item.setAttrs({ x: nextX, y: nextY });
                checkCollisions(item);
            }
        });
        
        requestAnimationFrame(update);
    };
    
    update();
};
```

This demo showcases:
- Dynamic circle creation on drag
- Collision detection between circles
- Visual connection lines between nearby circles
- Smooth bouncing animation off canvas boundaries
- Shadow and border effects
- Efficient update loop with requestAnimationFrame

## Shapes API

### Common Properties (BaseConfig)

All shapes share these base configuration options:

```typescript
interface BaseConfig {
    x: number;              // X position
    y: number;              // Y position
    color: string;          // Fill color
    borderWidth?: number;   // Border width
    borderColor?: string;   // Border color
    shadowColor?: string;   // Shadow color
    shadowBlur?: number;    // Shadow blur radius
    shadowOffset?: {        // Shadow offset
        x: number;
        y: number;
    };
    draggable?: boolean;    // Enable drag & drop
}
```

### Transformer

The Transformer is a powerful tool for manipulating shapes on the canvas. It allows interactive resizing and dragging of elements, similar to Konva.js.

```typescript
// Create a transformer
const transformer = radial.Transformer({
    color: "red",           // Control points color
    borderWidth: 2,         // Transform area border width
    borderColor: "white"    // Transform area border color
});

// Add transformer to elements on click
radial.on("click", (evt) => {
    const target = evt.canvasTarget;
    if(!target) return;
    
    transformer.add([target]); // You can add multiple elements in the array
});
```

#### Transformer Features:
- Interactive shape resizing
- Element dragging
- Multiple control points
- Support for transforming multiple shapes at once

#### Complete Transformer Example

```typescript
// Create shapes
const circle = radial.Circle({
    x: 100,
    y: 100,
    radius: 50,
    color: 'blue',
    draggable: true
});

const rect = radial.Rect({
    x: 200,
    y: 200,
    width: 100,
    height: 100,
    color: 'green',
    draggable: true
});

// Create transformer
const transformer = radial.Transformer({
    color: "red",
    borderWidth: 2,
    borderColor: "white"
});

// Handle shape selection
radial.on("click", (evt) => {
    const target = evt.canvasTarget;
    
    if(!target) {
        // If clicking empty space, clear selection
        transformer.add([]);
        return;
    }
    
    // Add clicked shape to transformer
    transformer.add([target]);
});

// Optional: Listen to transformer events
transformer.on("resizestart", (evt) => {
    console.log("Resize started:", evt);
});

transformer.on("resize", (evt) => {
    console.log("Resize in progress:", evt);
});

transformer.on("resizeend", (evt) => {
    console.log("Resize finished:", evt);
});
```

## Examples

### Interactive Drawing System

```typescript
// Create multiple shapes
const shapes = [
    radial.Circle({
        x: 100,
        y: 100,
        radius: 50,
        color: 'red',
        draggable: true
    }),
    radial.Rect({
        x: 200,
        y: 200,
        width: 100,
        height: 100,
        color: 'blue',
        draggable: true
    }),
    radial.Triangle({
        x: 300,
        y: 300,
        radius: 50,
        color: 'green',
        draggable: true
    })
];

// Create transformer
const transformer = radial.Transformer({
    color: "red",
    borderWidth: 2,
    borderColor: "white"
});

// Handle selections
let selectedShapes: Shape[] = [];

radial.on("click", (evt) => {
    const target = evt.canvasTarget;
    
    if(!target) {
        selectedShapes = [];
        transformer.add([]);
        return;
    }
    
    if(evt.event.shiftKey) {
        // Multiple selection with Shift
        const index = selectedShapes.indexOf(target);
        if(index === -1) {
            selectedShapes.push(target);
        } else {
            selectedShapes.splice(index, 1);
        }
    } else {
        // Single selection
        selectedShapes = [target];
    }
    
    transformer.add(selectedShapes);
});
```

## Performance Tips

1. Use `draggable: true` only on shapes that need it
2. Minimize shadow usage for better performance
3. Take advantage of the dirty flag system - shapes are only redrawn when necessary
4. Consider using the transformer only when needed, as it adds rendering complexity

## Known Limitations

1. Currently supports basic shapes (Circle, Rectangle, Triangle, Line)
2. No built-in animation system (planned for future versions)
3. One canvas instance per Radial instance
4. Transformer may impact performance with many shapes

## Contributing

RadialCanvas.js is under active development. Contributions are welcome!

## License

(license here)
