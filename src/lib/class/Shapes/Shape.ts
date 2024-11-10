import type { Radial } from "../../Radial";

export interface ConfigShape {
    x: number;
    y: number;
    color: string;
    borderWidth?: number;
    borderColor?: string;
    shadowColor?: string;
    shadowBlur?: number;
    shadowOffset?: { x: number, y: number };
    draggable?: boolean;
}

export class Shape {
    protected ctx: CanvasRenderingContext2D;
    private events: { [key: string]: Function[] };
    protected config: ConfigShape;
    private isDragging: boolean = false;
    private dragStartX: number = 0;
    private dragStartY: number = 0;
    private initialX: number = 0;
    private initialY: number = 0;

    constructor(ctx: CanvasRenderingContext2D, config: ConfigShape) {
        this.ctx = ctx;
        this.config = {
            ...config,
            draggable: config.draggable ?? false
        };
        this.events = {};
        this.addEventListeners();
    }

    private applyStyles() {
        const { color, borderWidth, borderColor, shadowColor, shadowBlur, shadowOffset } = this.config;

        this.ctx.save();

        this.ctx.shadowColor = 'rgba(0, 0, 0, 0)';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;

        if (shadowColor) {
            this.ctx.shadowColor = shadowColor;
        }
        
        if (shadowBlur !== undefined) {
            this.ctx.shadowBlur = shadowBlur;
        }

        if (shadowOffset) {
            this.ctx.shadowOffsetX = shadowOffset.x;
            this.ctx.shadowOffsetY = shadowOffset.y;
        }

        if (borderWidth && borderColor) {
            this.ctx.lineWidth = borderWidth;
            this.ctx.strokeStyle = borderColor;
        }

        this.ctx.fillStyle = color;
    }

    private addEventListeners() {
        this.ctx.canvas.addEventListener("click", (event) => {
            const rect = this.getBoundingBox();
            if(this.isPointInShape(event.offsetX, event.offsetY, rect)){
                this.emit("click", {
                    children: rect.radial.getChildren(),
                    event: event
                });
            }
        });

        this.ctx.canvas.addEventListener("mousemove", (event) => {
            const rect = this.getBoundingBox();
            if(this.isPointInShape(event.offsetX, event.offsetY, rect)){
                this.emit("mousemove", event);
            } else if (this.config.draggable && !this.isDragging) {
                this.ctx.canvas.style.cursor = 'default';
            }

            if (this.isDragging && this.config.draggable) {
                const dx = event.offsetX - this.dragStartX;
                const dy = event.offsetY - this.dragStartY;
                
                this.config.x = this.initialX + dx;
                this.config.y = this.initialY + dy;

                const radial = this.getBoundingBox().radial;
                this.redrawCanvas(radial);
                
                this.emit("drag", {
                    x: this.config.x,
                    y: this.config.y,
                    event: event
                });
            }
        });

        this.ctx.canvas.addEventListener("mousedown", (event) => {
            const rect = this.getBoundingBox();
            if(this.isPointInShape(event.offsetX, event.offsetY, rect)){
                this.emit("mousedown", event);
                
                if (this.config.draggable) {
                    this.isDragging = true;
                    this.dragStartX = event.offsetX;
                    this.dragStartY = event.offsetY;
                    this.initialX = this.config.x;
                    this.initialY = this.config.y;
                    
                    this.emit("dragstart", {
                        x: this.config.x,
                        y: this.config.y,
                        event: event
                    });
                }
            }
        });

        this.ctx.canvas.addEventListener("mouseup", (event) => {
            const rect = this.getBoundingBox();
            if(this.isPointInShape(event.offsetX, event.offsetY, rect)){
                this.emit("mouseup", event);
            }
            
            if (this.isDragging && this.config.draggable) {
                this.isDragging = false;
                this.emit("dragend", {
                    x: this.config.x,
                    y: this.config.y,
                    event: event
                });
            }
        });

        this.ctx.canvas.addEventListener("mouseleave", () => {
            if (this.isDragging && this.config.draggable) {
                this.isDragging = false;
                this.emit("dragend", {
                    x: this.config.x,
                    y: this.config.y
                });
            }
        });
    }

    private isPointInShape(x: number, y: number, rect: { 
        x: number; 
        y: number; 
        width?: number; 
        height?: number; 
        radius?: number; 
        points?: number[]; 
        lineWidth?: number; 
        shape: string;
        radial: Radial 
    }): boolean {
        if (rect.shape === "Rect") {
            return (
                x >= rect.x && x <= rect.x + rect.width! &&
                y >= rect.y && y <= rect.y + rect.height!
            );
        } else if(rect.shape === "Circle") {
            const dx = x - rect.x;
            const dy = y - rect.y;
            return dx * dx + dy * dy <= rect.radius! * rect.radius!;
        } else if(rect.shape === "Triangle") {
            const x1 = rect.x;
            const y1 = rect.y;
            const x2 = rect.x + rect.radius!;
            const y2 = rect.y + rect.radius!;
            const x3 = rect.x - rect.radius!;
            const y3 = rect.y + rect.radius!;
    
            const totalArea = this.calculateArea(x1, y1, x2, y2, x3, y3);
            const area1 = this.calculateArea(x, y, x2, y2, x3, y3);
            const area2 = this.calculateArea(x1, y1, x, y, x3, y3);
            const area3 = this.calculateArea(x1, y1, x2, y2, x, y);
    
            return Math.abs(totalArea - (area1 + area2 + area3)) < 0.1;
        } else if(rect.shape === "Line") {
            const { points, lineWidth } = rect;
            let isInside = false;
    
            for (let i = 0; i < points!.length; i += 2) {
                const x1 = points![i];
                const y1 = points![i + 1];
                const x2 = i + 2 < points!.length ? points![i + 2] : points![0];
                const y2 = i + 2 < points!.length ? points![i + 3] : points![1];
    
                const dx = x2 - x1;
                const dy = y2 - y1;
                const length = Math.sqrt(dx * dx + dy * dy);
    
                const t = ((x - x1) * dx + (y - y1) * dy) / (length * length);

                if (t >= 0 && t <= 1) {
                    const closestX = x1 + t * dx;
                    const closestY = y1 + t * dy;
                    const distance = Math.sqrt(
                        (x - closestX) * (x - closestX) + 
                        (y - closestY) * (y - closestY)
                    );
    
                    if (distance <= lineWidth! / 2) {
                        isInside = true;
                        break;
                    }
                }
            }
            return isInside;
        }
        return false;
    }
    
    private calculateArea(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): number {
        return Math.abs((x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2)) / 2);
    }

    protected getBoundingBox(): { 
        x: number; 
        y: number; 
        width?: number; 
        height?: number; 
        radius?: number; 
        points?: number[]; 
        lineWidth?: number; 
        shape: string;
        radial: Radial 
    } {
        throw new Error("Method 'getBoundingBox()' must be implemented.");
    }

    on(event: string, handler: Function) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(handler);
    }

    emit(event: string, ...args: any[]) {
        if (this.events[event]) {
            this.events[event].forEach(handler => handler(...args));
        }
    }

    off(event: string, handler: Function) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(h => h !== handler);
        }
    }

    protected draw(): void {
        throw new Error("Method 'draw()' must be implemented.");
    }

    public destroy(): void {
        const radial = this.getBoundingBox().radial;
        const index = radial.children.indexOf(this);
        
        if (index !== -1) {
            radial.children.splice(index, 1);
        }

        this.redrawCanvas(radial);

        this.removeEventListeners();
    }

    private removeEventListeners(): void {
        this.events = {};
    }

    private redrawCanvas(radial: Radial): void {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        
        radial.children.forEach(shape => {
            shape.render();
        });
    }

    public render() {
        this.applyStyles();
        
        this.draw();
        
        if (this.config.borderWidth && this.config.borderColor) {
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }
}