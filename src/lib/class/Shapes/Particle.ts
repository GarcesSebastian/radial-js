import type { Radial } from '../../Radial';
import { type Circle } from './Circle';
import { Shape, type ExtendedBaseConfig } from './Shape';

export interface ConfigParticle extends ExtendedBaseConfig {
    fadeSpeed?: number;
    minRadius?: number;
    maxRadius?: number;
    minSpeed?: number;
    maxSpeed?: number;
    lifetime?: number;
    batchSize?: number;  // New: Control how many particles to process per frame
}

interface ParticleData {
    x: number;
    y: number;
    dirX: number;
    dirY: number;
    speed: number;
    opacity: number;
    radius: number;
    createdAt: number;
}

export class Particle extends Shape {
    public config: ConfigParticle;
    private radial: Radial;
    private shape: string = "Particle";
    private isInitialized: boolean = false;
    private particlePool: Circle[] = [];
    private particleData: ParticleData[] = [];
    private animationId: number | null = null;
    private startTime: number = 0;
    private offscreenCanvas: OffscreenCanvas | null = null;
    private offscreenCtx: OffscreenCanvasRenderingContext2D | null = null;
    private batchSize: number;

    constructor(radial: Radial, config: ConfigParticle) {
        super(radial.getCtx(), config);
        this.radial = radial;
        this.config = {
            fadeSpeed: 0.02,
            minRadius: 1,
            maxRadius: 3,
            minSpeed: 2,
            maxSpeed: 6,
            lifetime: 1000,
            batchSize: 1000,
            ...config
        };
        this.batchSize = this.config.batchSize!;
        this.initializeOffscreen();
        this.render();
    }

    private initializeOffscreen() {
        if (typeof OffscreenCanvas !== 'undefined') {
            this.offscreenCanvas = new OffscreenCanvas(
                this.ctx.canvas.width,
                this.ctx.canvas.height
            );
            this.offscreenCtx = this.offscreenCanvas.getContext('2d', {
                alpha: true,
                willReadFrequently: false
            });
        }
    }

    protected draw() {
        if (!this.isInitialized) {
            this.radial.children.push(this);
            this.isInitialized = true;
        }
    }

    public getBoundingBox(): { x: number; y: number; shape: string; radial: Radial } {
        const { x, y } = this.config;
        return { x, y, shape: this.shape, radial: this.radial };
    }

    private emitRender() {
        const currentTime = Date.now();
        const elapsedTime = currentTime - this.startTime;

        if (elapsedTime >= this.config.lifetime! && this.particleData.length === 0) {
            this.stop();
            return;
        }

        const ctx = this.offscreenCtx || this.ctx;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        for (let i = 0; i < this.particleData.length; i += this.batchSize) {
            const batch = this.particleData.slice(i, i + this.batchSize);
            this.updateBatch(batch, currentTime);
        }

        this.particleData = this.particleData.filter(data => {
            const particleElapsedTime = currentTime - data.createdAt;
            const lifeProgress = particleElapsedTime / this.config.lifetime!;
            return lifeProgress < 1;
        });

        this.drawParticles(ctx);

        if (this.offscreenCanvas && this.offscreenCtx) {
            this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
            this.ctx.drawImage(this.offscreenCanvas, 0, 0);
        }

        if (this.particleData.length > 0) {
            this.animationId = requestAnimationFrame(() => this.emitRender());
        } else {
            this.stop();
        }
    }

    private updateBatch(batch: ParticleData[], currentTime: number) {
        batch.forEach(data => {
            data.x += data.dirX * data.speed;
            data.y += data.dirY * data.speed;
            
            const particleElapsedTime = currentTime - data.createdAt;
            const lifeProgress = particleElapsedTime / this.config.lifetime!;
            data.opacity = Math.max(0, 1 - lifeProgress);
        });
    }

    private drawParticles(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) {
        ctx.save();
        ctx.fillStyle = this.config.color;

        ctx.beginPath();
        this.particleData.forEach(data => {
            ctx.globalAlpha = data.opacity;
            ctx.moveTo(data.x, data.y);
            ctx.arc(data.x, data.y, data.radius, 0, Math.PI * 2);
        });
        ctx.fill();
        ctx.restore();
    }

    public emitter(emitters: number): void {
        this.startTime = Date.now();
        const { x, y, color } = this.config;

        const newParticles: ParticleData[] = new Array(emitters);
        for (let i = 0; i < emitters; i++) {
            const radius = Math.random() * 
                (this.config.maxRadius! - this.config.minRadius!) + 
                this.config.minRadius!;
            
            const dirX = (Math.random() - 0.5) * 6;
            const dirY = (Math.random() - 0.5) * 6;
            const speed = Math.random() * 
                (this.config.maxSpeed! - this.config.minSpeed!) + 
                this.config.minSpeed!;

            newParticles[i] = {
                x,
                y,
                dirX,
                dirY,
                speed,
                opacity: 1,
                radius,
                createdAt: Date.now()
            };
        }

        this.particleData.push(...newParticles);

        if (!this.animationId) {
            this.emitRender();
        }
    }

    private stop(): void {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        this.particleData = [];
        this.particlePool = [];

        if (this.offscreenCanvas) {
            this.offscreenCtx?.clearRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
        }
    }

    public destroy(): void {
        this.stop();
        super.destroy();
    }
}