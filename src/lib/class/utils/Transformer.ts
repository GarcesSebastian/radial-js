import type { Radial } from '../../Radial';
import type { Shape } from '../shapes/Shape';

export interface ConfigTransformer {
    color?: string;
    borderWidth?: number;
    borderColor?: string;
    size?: number;
    anchorsEnabled?: ("topLeft" | "topRight" | "bottomLeft" | "bottomRight")[];
    padding?: {
        top?: number;
        right?: number;
        bottom?: number;
        left?: number;
    };
}

export class Transformer {
    public nodes: Shape[] = [];
    private anchors: Shape[] = [];
    private border: Shape | null = null;
    private isDragging: boolean = false;
    private isResizing: boolean = false;
    private dragStartPos: { x: number, y: number } | null = null;
    private resizeStartPos: { x: number, y: number } | null = null;

    private radial: Radial;
    private ctx: CanvasRenderingContext2D;
    protected config: ConfigTransformer;

    constructor(radial: Radial, config: ConfigTransformer) {
        this.radial = radial;
        this.config = config || {
            color: 'rgba(255,0,0,0.5)',
            borderWidth: 2,
            borderColor: 'rgba(255,0,0,0.5)',
            size: 10,
            anchorsEnabled: ["topLeft", "topRight", "bottomLeft", "bottomRight"],
            padding: {
                top: 5,
                right: 5,
                bottom: 5,
                left: 5
            }
        }
        this.ctx = radial.getCtx();
    }

    private createAnchors(rect: {x: number, y: number, width?: number, height?: number, radius?: number}): void {
        const { size = 10, color, borderColor, borderWidth, anchorsEnabled, padding } = this.config;

        const sizeMedian = size / 2;
        
        if(!anchorsEnabled) {
            return;
        }
        
        let anchorPositions: { [key: string]: { x: number, y: number } };
        
        if (rect.radius) {
            anchorPositions = {
                topLeft: {
                    x: rect.x - rect.radius - padding?.left! + sizeMedian,
                    y: rect.y - rect.radius - padding?.top! + sizeMedian
                },
                topRight: {
                    x: rect.x + rect.radius + padding?.right! + sizeMedian,
                    y: rect.y - rect.radius - padding?.top! + sizeMedian
                },
                bottomLeft: {
                    x: rect.x - rect.radius - padding?.left! + sizeMedian,
                    y: rect.y + rect.radius + padding?.bottom! + sizeMedian
                },
                bottomRight: {
                    x: rect.x + rect.radius + padding?.right! + sizeMedian,
                    y: rect.y + rect.radius + padding?.bottom! + sizeMedian
                }
            };
        } else {
            const width = rect.width || 0;
            const height = rect.height || 0;
            
            anchorPositions = {
                topLeft: {
                    x: rect.x - padding?.left! + sizeMedian,
                    y: rect.y - padding?.top! + sizeMedian
                },
                topRight: {
                    x: rect.x + width + padding?.right! + sizeMedian,
                    y: rect.y - padding?.top! + sizeMedian
                },
                bottomLeft: {
                    x: rect.x - padding?.left! + sizeMedian,
                    y: rect.y + height + padding?.bottom! + sizeMedian
                },
                bottomRight: {
                    x: rect.x + width + padding?.right! + sizeMedian,
                    y: rect.y + height + padding?.bottom! + sizeMedian
                }
            };
        }
    
        for (const key in anchorPositions) {
            const anchorKey = key as "topLeft" | "topRight" | "bottomLeft" | "bottomRight";
            if (anchorsEnabled.includes(anchorKey)) {
                const anchor = this.radial.Circle({
                    x: anchorPositions[anchorKey].x - size / 2,
                    y: anchorPositions[anchorKey].y - size / 2,
                    radius: size / 2,
                    color: color!,
                    borderColor: borderColor,
                    borderWidth: borderWidth
                });
                
                this.anchors.push(anchor);
            }
        }
    }

    private createBorder(rect: {x: number, y: number, width?: number, height?: number, radius?: number}): void {
        const size = rect.radius || rect.width || 0;
        const padding = this.config.padding;
        const borderWidth = this.config.borderWidth || 0;
        const borderColor = this.config.borderColor || 'black';
        
        const borderRect = {
            x: rect.x - (rect.radius || 0) - padding?.left!,
            y: rect.y - (rect.radius || 0) - padding?.top!,
            width: (rect.width! || (rect.radius! * 2)) + padding?.left! + padding?.right!,
            height: (rect.height! || (rect.radius! * 2)) + padding?.top! + padding?.bottom!
        };

        this.border = this.radial.Rect({
            x: borderRect.x,
            y: borderRect.y,
            width: borderRect.width,
            height: borderRect.height,
            color: 'transparent',
            borderColor: borderColor,
            borderWidth: borderWidth,
            draggable: true,
        });

        this.border.on('dragstart', (e: any) => {
            this.dragStart(e.event);
        });

        this.border.on("drag", (e: any) => {
            this.drag(e.event);
        })

        this.border.on("dragend", (e: any) => {
        })
    }

    private getBorderOfNodes(nodes: Shape[]): {x: number, y: number, width: number, height: number} {
        if (nodes.length === 0) {
            return { x: 0, y: 0, width: 0, height: 0 };
        }
    
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
        nodes.forEach(node => {
            const rect = node.getBoundingRect();
            
            if (rect.radius != 0 && rect.radius) {
                const leftX = rect.x - rect.radius;
                const rightX = rect.x + rect.radius;
                const topY = rect.y - rect.radius;
                const bottomY = rect.y + rect.radius;
    
                if (leftX < minX) minX = leftX;
                if (rightX > maxX) maxX = rightX;
                if (topY < minY) minY = topY;
                if (bottomY > maxY) maxY = bottomY;
            } else {
                if (rect.x < minX) minX = rect.x;
                if (rect.y < minY) minY = rect.y;
                if (rect.x + rect.width! > maxX) maxX = rect.x + rect.width!;
                if (rect.y + rect.height! > maxY) maxY = rect.y + rect.height!;
            }
        });
    
        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }

    private dragStart(event: MouseEvent){
        this.isDragging = true;
        this.dragStartPos = this.radial.getPointerPosition(event);
    }

    private drag(event: MouseEvent): void {
        if (!this.isDragging) return;

    }

    public add(nodes: Shape[]): void {
        this.nodes = nodes;
        let rect;

        if(nodes.length > 1) {
            rect = this.getBorderOfNodes(nodes);
        }else{
            rect = nodes[0].getBoundingRect();
        }

        this.nodes.forEach(node => {
            node.setAttr("draggable", false);
        })

        this.createBorder(rect);
        this.createAnchors(rect);
        console.log(rect);
    }
}