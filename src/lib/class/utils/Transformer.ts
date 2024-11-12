import type { Radial } from '../../Radial';
import type { Point } from '../../types/types';
import type { Shape } from '../Shapes/Shape';

type AnchorPosition = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

interface Rect extends Point {
  width: number;
  height: number;
  radius?: number;
}

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
  padding?: Padding;
}

/**
 * Transformer class for handling shape transformations on a canvas
 * Provides functionality for selecting, moving, and resizing shapes
 */
export class Transformer {
  private readonly defaultConfig: Required<ConfigTransformer> = {
    color: 'white',
    borderWidth: 2,
    borderColor: 'blue',
    size: 10,
    anchorsEnabled: ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'],
    padding: { top: 5, right: 5, bottom: 5, left: 5 }
  };

  private nodes: Shape[] = [];
  private anchors: Shape[] = [];
  private border: Shape | null = null;
  
  private isDragging = false;
  private isResizing = false;
  private activeAnchor: Shape | null = null;
  private dragStartPos: Point | null = null;
  private resizeStartPos: Point | null = null;
  private initialRect: Rect | null = null;
  private initialScale: Point | null = null;

  private readonly config: Required<ConfigTransformer>;
  private readonly ctx: CanvasRenderingContext2D;

  constructor(
    private readonly radial: Radial,
    config: ConfigTransformer
  ) {
    this.config = { ...this.defaultConfig, ...config };
    this.ctx = radial.getCtx();
  }

  /**
   * Creates anchor points for resizing the transformer
   */
  private createAnchors(): void {
    const { size, color, borderColor, borderWidth, anchorsEnabled } = this.config;
    const rect = this.border?.getBoundingRect() as Rect;
    if (!rect || !anchorsEnabled.length) return;

    const anchorPositions = this.calculateAnchorPositions(rect, size);

    anchorsEnabled.forEach(position => {
      const anchor = this.createAnchorShape(
        anchorPositions[position],
        size,
        color,
        borderColor,
        borderWidth
      );
      anchor.setAttr('shape', position);
      anchor.setAttr('draggable', true);
      anchor.setAttr("ignore", true);

      anchor.on('dragstart', (e: any) => this.resizeStart(e.event, anchor));
      anchor.on('drag', (e: any) => this.resize(e.event));
      anchor.on('dragend', (e: any) => this.resizeEnd(e.event));

      this.anchors.push(anchor);
    });
  }

  /**
   * Calculates positions for all anchor points
   */
  private calculateAnchorPositions(rect: Rect, size: number): Record<AnchorPosition, Point> {
    const sizeMedian = size / 2;
    const { x, y, width = 0, height = 0 } = rect;

    return {
      topLeft: { x: x + sizeMedian, y: y + sizeMedian },
      topRight: { x: x + width + sizeMedian, y: y + sizeMedian },
      bottomLeft: { x: x + sizeMedian, y: y + height + sizeMedian },
      bottomRight: { x: x + width + sizeMedian, y: y + height + sizeMedian }
    };
  }

  /**
   * Creates a single anchor shape
   */
  private createAnchorShape(
    position: Point,
    size: number,
    color: string,
    borderColor: string,
    borderWidth: number
  ): Shape {
    return this.radial.Circle({
      x: position.x - size / 2,
      y: position.y - size / 2,
      radius: size / 2,
      color,
      borderColor,
      borderWidth,
    });
  }

  /**
   * Creates the border around selected shapes
   */
  private createBorder(rect: Rect): void {
    const { padding, borderWidth, borderColor } = this.config;
    const borderRect = this.calculateBorderRect(rect, padding);

    this.border = this.radial.Rect({
      ...borderRect,
      color: 'transparent',
      borderColor,
      borderWidth,
      draggable: true,
    });

    this.border.setAttr("ignore", true);
    this.attachBorderEventHandlers();
  }

  /**
   * Calculates the border rectangle dimensions
   */
  private calculateBorderRect(rect: Rect, padding: Padding): Rect {
    const { left = 0, right = 0, top = 0, bottom = 0 } = padding;

    if (rect.radius) {
      return {
        x: rect.x - rect.radius - left,
        y: rect.y - rect.radius - top,
        width: rect.radius * 2 + left + right,
        height: rect.radius * 2 + top + bottom
      };
    }

    return {
      x: rect.x - left,
      y: rect.y - top,
      width: rect.width + left + right,
      height: rect.height + top + bottom
    };
  }

  /**
   * Attaches event handlers to the border
   */
  private attachBorderEventHandlers(): void {
    if (!this.border) return;

    this.border.on('dragstart', (e: any) => this.dragStart(e.event));
    this.border.on('drag', (e: any) => this.drag(e.event));
    this.border.on('dragend', (e: any) => this.dragEnd(e.event));
  }

  /**
   * Updates positions of all elements during transformation
   */
  private updatePosTransform(newPos: Point): void {
    if (!this.border) return;

    const {width, height} = this.border.getBoundingRect() as Rect;

    this.border.setAttrs({
      x: newPos.x - width / 2,
      y: newPos.y - height / 2
    });

    this.updateNodesPosition(newPos);
    this.updateAnchorsPosition();
  }

  /**
   * Updates the position of all selected nodes
   */
  private updateNodesPosition(newPos: Point): void {
    this.nodes.forEach(node => {
        const rect = node.getBoundingRect() as Rect;
        const { width, height, radius } = rect;

        let newX = newPos.x
        let newY = newPos.y

        if (!radius) {
            newX -= width / 2;
            newY -= height / 2;
        }

        node.setAttrs({
            x: newX,
            y: newY
        });
    });
  }

  /**
   * Updates the position of all anchor points
   */
  private updateAnchorsPosition(): void {
    const { size, anchorsEnabled } = this.config;
    const rect = this.border?.getBoundingRect() as Rect;
    if (!rect || !anchorsEnabled.length) return;

    const anchorPositions = this.calculateAnchorPositions(rect, size);

    this.anchors.forEach(anchor => {
      const position = anchor.getAttr('shape') as AnchorPosition;
      if (anchorsEnabled.includes(position)) {
        anchor.setAttrs({
          x: anchorPositions[position].x - size / 2,
          y: anchorPositions[position].y - size / 2
        });
      }
    });
  }

  /**
   * Calculates the bounding rectangle for multiple nodes
   */
  private getBorderOfNodes(nodes: Shape[]): Rect {
    if (nodes.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    const bounds = nodes.reduce((acc, node) => {
      const rect = node.getBoundingRect() as Rect;
      const [left, right, top, bottom] = this.getNodeBounds(rect);

      return {
        minX: Math.min(acc.minX, left),
        maxX: Math.max(acc.maxX, right),
        minY: Math.min(acc.minY, top),
        maxY: Math.max(acc.maxY, bottom)
      };
    }, { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });

    return {
      x: bounds.minX,
      y: bounds.minY,
      width: bounds.maxX - bounds.minX,
      height: bounds.maxY - bounds.minY
    };
  }

  /**
   * Calculates the bounds for a single node
   */
  private getNodeBounds(rect: Rect): [number, number, number, number] {
    if (rect.radius) {
      return [
        rect.x - rect.radius,
        rect.x + rect.radius,
        rect.y - rect.radius,
        rect.y + rect.radius
      ];
    }

    return [
      rect.x,
      rect.x + rect.width,
      rect.y,
      rect.y + rect.height
    ];
  }

  // Event handlers
  private dragStart(event: MouseEvent): void {
    this.isDragging = true;
    this.dragStartPos = this.radial.getPointerPosition(event);
  }

  private drag(event: MouseEvent): void {
    if (!this.isDragging) return;
    const pos = this.radial.getPointerPosition(event);
    this.updatePosTransform(pos);
  }

  private dragEnd(event: MouseEvent): void {
    this.isDragging = false;
    this.dragStartPos = null;
  }

  private resizeStart(event: MouseEvent, anchor: Shape): void {
    if (!this.border) return;
    
    this.isResizing = true;
    this.activeAnchor = anchor;
    this.resizeStartPos = this.radial.getPointerPosition(event);
    this.initialRect = this.border.getBoundingRect() as Rect;
    this.initialScale = { x: 1, y: 1 };
  }

  private resize(event: MouseEvent): void {
    if (!this.isResizing || !this.resizeStartPos || !this.initialRect || !this.activeAnchor || !this.border) return;

    const currentPos = this.radial.getPointerPosition(event);
    const anchorPosition = this.activeAnchor.getAttr('shape') as AnchorPosition;
    
    // Calculate the new dimensions based on anchor position and mouse movement
    const newDimensions = this.calculateResizeDimensions(
      currentPos,
      this.resizeStartPos,
      this.initialRect,
      anchorPosition
    );

    // Update border dimensions
    this.border.setAttrs(newDimensions);

    // Update nodes
    this.resizeNodes(newDimensions, this.initialRect);

    // Update anchor positions
    this.updateAnchorsPosition();
  }

  private calculateResizeDimensions(
    currentPos: Point,
    startPos: Point,
    initialRect: Rect,
    anchorPosition: AnchorPosition
  ): Rect {
    const deltaX = currentPos.x - startPos.x;
    const deltaY = currentPos.y - startPos.y;
    
    let newWidth = initialRect.width;
    let newHeight = initialRect.height;
    let newX = initialRect.x;
    let newY = initialRect.y;

    // Handle width changes
    if (anchorPosition.includes('Right')) {
      newWidth = Math.max(initialRect.width + deltaX, this.config.size);
    } else if (anchorPosition.includes('Left')) {
      const widthChange = -deltaX;
      newWidth = Math.max(initialRect.width + widthChange, this.config.size);
      newX = initialRect.x - widthChange;
    }

    // Handle height changes
    if (anchorPosition.includes('bottom')) {
      newHeight = Math.max(initialRect.height + deltaY, this.config.size);
    } else if (anchorPosition.includes('top')) {
      const heightChange = -deltaY;
      newHeight = Math.max(initialRect.height + heightChange, this.config.size);
      newY = initialRect.y - heightChange;
    }

    return {
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight
    };
  }

  private resizeNodes(newDimensions: Rect, initialRect: Rect): void {

  }

  private resizeEnd(event: MouseEvent): void {
    this.isResizing = false;
    this.activeAnchor = null;
    this.resizeStartPos = null;
    this.initialRect = null;
    this.initialScale = null;
  }

  public add(nodes: Shape[]): void {
    if (nodes.length === 0) return;

    this.cleanup();
    this.nodes = nodes;
    
    const rect = nodes.length > 1 
      ? this.getBorderOfNodes(nodes)
      : nodes[0].getBoundingRect();

    this.nodes.forEach(item => item.setAttr("draggable", false))
    this.createBorder(rect as Rect);
    this.createAnchors();
  }

  private cleanup(): void {
    this.anchors.forEach(anchor => anchor.destroy());
    this.anchors = [];
    this.border?.destroy();
    this.border = null;
  }
}