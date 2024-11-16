import type { Radial } from '../../Radial';
import { Shape, type ExtendedBaseConfig } from './Shape';

export interface ConfigImage extends ExtendedBaseConfig {
    src: string;
    width: number;
    height: number;
}

export class Image extends Shape {
    private radial: Radial;
    private image: HTMLImageElement;
    private isLoaded: boolean = false;

    constructor(radial: Radial, config: ConfigImage) {
        super(radial.getCtx(), config);
        this.radial = radial;
        this.image = document.createElement("img");
        this.image.src = config.src;
        this.image.onload = () => {
            this.isLoaded = true;
            this.render();
        };
        this.image.onerror = () => {
            console.error(`Failed to load image: ${config.src}`);
        };
    }

    protected draw() {
        if (!this.isLoaded) return;

        const { x, y, width, height } = this.config;
        this.ctx.drawImage(this.image, x, y, width, height);

        if (!this.isInitialized) {
            this.radial.children.push(this);
            this.isInitialized = true;
        }
    }

    public getBoundingBox(): { x: number; y: number; width: number; height: number; shape: string, radial: Radial } {
        const { x, y, width, height } = this.config;
        return { x, y, width, height, shape: "Image", radial: this.radial };
    }
}