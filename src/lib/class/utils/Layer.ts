import type { Shape } from '../Shapes/Shape';
import type { Radial } from '../../Radial';

export interface LayerConfig {
    name: string;
    visible?: boolean;
    opacity?: number;
    zIndex?: number;
}

export class Layer {
    private shapes: Shape[] = [];
    private name: string;
    private visible: boolean;
    private opacity: number;
    private zIndex: number;
    private radial: Radial;

    constructor(radial: Radial, config: LayerConfig) {
        this.radial = radial;
        this.name = config.name;
        this.visible = config.visible ?? true;
        this.opacity = config.opacity ?? 1;
        this.zIndex = config.zIndex ?? 0;
    }

    public add(shape: Shape): void {
        this.shapes.push(shape);
        shape.setLayer(this);
        this.requestRedraw();
    }

    public remove(shape: Shape): void {
        const index = this.shapes.indexOf(shape);
        if (index !== -1) {
            this.shapes.splice(index, 1);
            shape.setLayer(undefined);
            this.requestRedraw();
        }
    }

    public clear(): void {
        this.shapes.forEach(shape => shape.setLayer(undefined));
        this.shapes = [];
        this.requestRedraw();
    }

    public getShapes(): Shape[] {
        return this.shapes;
    }

    public setVisible(visible: boolean): void {
        if (this.visible !== visible) {
            this.visible = visible;
            this.shapes.forEach(shape => shape.setDirtyFlag(true));
            this.requestRedraw();
        }
    }

    public isVisible(): boolean {
        return this.visible;
    }

    public setOpacity(opacity: number): void {
        if (this.opacity !== opacity) {
            this.opacity = opacity;
            this.shapes.forEach(shape => {
                // Actualizar la opacidad de cada forma
                const currentOpacity = shape.getAttr('opacity');
                shape.setAttr('opacity', currentOpacity * this.opacity);
            });
            this.requestRedraw();
        }
    }

    public getOpacity(): number {
        return this.opacity;
    }

    public setZIndex(zIndex: number): void {
        if (this.zIndex !== zIndex) {
            this.zIndex = zIndex;
            this.radial.sortLayers();
        }
    }

    public getZIndex(): number {
        return this.zIndex;
    }

    public getName(): string {
        return this.name;
    }

    public moveUp(): void {
        this.radial.moveLayerUp(this);
    }

    public moveDown(): void {
        this.radial.moveLayerDown(this);
    }

    private requestRedraw(): void {
        this.shapes.forEach(shape => shape.setDirtyFlag(true));
        this.radial.requestRedraw();
    }

    public update(): void {
        if (!this.visible) return;
        
        this.shapes.forEach(shape => {
            const originalOpacity = shape.getAttr('opacity');
            // Aplicar la opacidad de la capa temporalmente
            shape.setAttr('opacity', originalOpacity * this.opacity);
            // La forma se renderizará automáticamente si su dirtyFlag está activo
            // Restaurar la opacidad original
            shape.setAttr('opacity', originalOpacity);
        });
    }
}