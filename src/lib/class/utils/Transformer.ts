import type { Point } from 'chart.js';
import type { Radial } from '../../Radial';
import type { Shape } from '../Shapes/Shape';

type AnchorPosition = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
type SidesPosition = 'Left' | 'Top' | 'Right' | 'Bottom';

interface Padding {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface ConfigTransformer {
  color?: string;
  borderWidth?: number;
  borderColor?: string;
  size?: number;
  anchorsEnabled?: AnchorPosition[];
  sidesEnabled?: SidesPosition[];
  padding?: Padding;
}

export class Transformer {
  private readonly defaultConfig: Required<ConfigTransformer> = {
    color: 'white',
    borderWidth: 2,
    borderColor: 'blue',
    size: 10,
    anchorsEnabled: ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'],
    sidesEnabled: ['Left', 'Top', 'Right', 'Bottom'],
    padding: { top: 5, right: 5, bottom: 5, left: 5 }
  };

  private nodes: Shape[] = [];
  private anchors: Shape[] = [];
  private sides: Shape[] = [];
  private border: Shape | null = null;

  private isDragging = false;
  private dragStartPosition: Point = { x: 0, y: 0 };

  private isResizing = false;
  private resizeStartPosition: Point = { x: 0, y: 0 };
  
  private boundingBox: { x: number; y: number; width: number; height: number, startWidth: number, startHeight: number } = { x: 0, y: 0, width: 0, height: 0, startWidth: 0, startHeight: 0 };

  private readonly config: Required<ConfigTransformer>;
  private readonly ctx: CanvasRenderingContext2D;

  constructor(
    private readonly radial: Radial,
    config: ConfigTransformer
  ) {
    this.config = { ...this.defaultConfig, ...config };
    this.ctx = radial.getCtx();
  }

  private initTransformer(): void {
    this.updateBoundingBox();
    
    this.nodes.forEach(node => node.setAttr("draggable", false))
  }

  private updateBoundingBox(): void{
    if (this.nodes.length === 0) {
        this.boundingBox = { x: 0, y: 0, width: 0, height: 0, startWidth: 0, startHeight: 0 };
        return;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    this.nodes.forEach(node => {
      const box = node.getBoundingBox();
      const isRadius = node.getAttr("isRadius") || false;

      const width = isRadius ? box.radius! * 2 : box.width!;
      const height = isRadius ? box.radius! * 2 : box.height!;

      const umbralX = isRadius ? - width / 2 : 0;
      const umbralY = isRadius ? - height / 2 : 0;

      minX = Math.min(minX, box.x! + umbralX);
      minY = Math.min(minY, box.y! + umbralY);
      maxX = Math.max(maxX, box.x! + width + umbralX);
      maxY = Math.max(maxY, box.y! + height + umbralY);
    })

    this.boundingBox = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      startWidth: maxX - minX,
      startHeight: maxY - minY
    }
  }

  private createBorder(): void {
    this.resetTransform();

    if(this.border) {
      this.border.destroy();
      this.border = null;
    }

    const { x, y, width, height } = this.boundingBox;
    const { borderWidth, borderColor } = this.config;

    this.border = this.radial.Rect({
      x: x - borderWidth,
      y: y - borderWidth,
      width: width + 2 * borderWidth,
      height: height + 2 * borderWidth,
      color: "rgba(255,255,255,0.2)",
      borderColor: borderColor,
      borderWidth: borderWidth,
      draggable: true,
      ignore: true
    }) as Shape;

    // this.border.on("dragstart", (event: MouseEvent) => this.dragStart(event));
    // this.border.on("drag", (event: MouseEvent) => this.drag(event));
    // this.border.on("dragend", (event: MouseEvent) => this.dragEnd(event));
  }

  private createSides(side?: string): void {
    const { x, y, width, height } = this.boundingBox;
    const size = 10 + this.config.borderWidth
    let positionSides = {
      "Left": {
        x: x - size / 2,
        y: y,
        width: size,
        height: height
      },
      "Top": {
        x: x,
        y: y - size / 2,
        width: width,
        height: size
      },
      "Right": {
        x: x + width - size / 2,
        y: y,
        width: size,
        height: height
      },
      "Bottom": {
        x: x,
        y: y + height - size / 2,
        width: width,
        height: size
      }
    }

    if (side){
      positionSides = {
        [side]: positionSides[side]
      }
    }

    Object.keys(positionSides).forEach((side: string) => {
      const { x: xSide, y: ySide, width: widthSide, height: heightSide } = positionSides[side];

      const sideShape = this.radial.Rect({
        x: xSide,
        y: ySide,
        width: widthSide,
        height: heightSide,
        color: "rgba(255,0,0,0.3)",
        draggable: true,
        ignore: true
      })

      sideShape.setAttr("side" as any, side)

      sideShape.on("dragstart", (event: MouseEvent) => this.resizeStart(event));
      sideShape.on("drag", (event: MouseEvent) => this.resize(event, side));
      sideShape.on("dragend", (event: MouseEvent) => this.resizeEnd(event));

      this.sides.push(sideShape as Shape);
    })
  }

  private dragStart(event: MouseEvent): void {
    this.dragStartPosition = { x: event.x, y: event.y };
    this.boundingBox.startWidth = this.boundingBox.width;
    this.isDragging = true;
    this.isResizing = false;
  }

  private drag(event: MouseEvent): void {
    if (this.isResizing || !this.isDragging) return;

    const dx = event.x - this.dragStartPosition.x;
    const dy = event.y - this.dragStartPosition.y;

    this.nodes.forEach(node => {
      const { x, y } = node.getBoundingBox();
      node.updatePosition({ x: x + dx, y: y + dy });
    });
  }

  private dragEnd(event: MouseEvent): void {
    this.isDragging = false;
    this.updateBoundingBox();
    this.createBorder();
  }

  private resizeStart(event: MouseEvent): void {
    this.resizeStartPosition = { x: event.x, y: event.y };
    this.isDragging = false
    this.isResizing = true;
  }

  private resize(event: MouseEvent, side: string): void {
    if(this.isDragging || !this.isResizing) return;

    if(side === "Right"){
      const { x, width, startWidth } = this.boundingBox;
      const dx = event.x - this.resizeStartPosition.x;
      const newWidth = startWidth + dx;
      this.boundingBox.width = newWidth;
      this.createBorder();
    }
  }

  private resizeEnd(event: MouseEvent): void {
    this.isResizing = false;
    this.updateBoundingBox();
  }

  private resetTransform(): void {
    this.border?.destroy();
    this.border = null;
  }

  public add(nodes: Shape[]): void {
    this.nodes = []
    this.nodes = this.nodes.concat(nodes);
    this.initTransformer();
    this.createBorder();
    this.createSides();
  }
}