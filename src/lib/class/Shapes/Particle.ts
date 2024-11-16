import type { Radial } from "../../Radial";
import type { GradientConfig } from "../../types/types";
import { type Circle } from "./Circle";
import { Shape, type ExtendedBaseConfig } from "./Shape";

export interface ConfigParticle extends ExtendedBaseConfig {
    fadeSpeed?: number;
    minRadius?: number;
    maxRadius?: number;
    minSpeed?: number;
    maxSpeed?: number;
    lifetime?: number;
    batchSize?: number;
    directionX?: number;
    directionY?: number;
    trail?: boolean;
    trailLength?: number;
    trailFade?: number;
    gravity?: number;
    rotationSpeed?: number;
    initialRadius?: number;
    finalRadius?: number;
    gradient?: GradientConfig;
    color: string;
    onParticleStart?: (particle: ParticleData) => void;
    onParticleEnd?: (particle: ParticleData) => void;
    scaleVariation?: number;
    colorVariation?: number;
    shape?: 'circle' | 'square';
}

interface ParticleData {
    x: number;
    y: number;
    dirX: number;
    dirY: number;
    speed: number;
    opacity: number;
    radius: number;
    initialRadius: number;
    finalRadius: number;
    createdAt: number;
    trail: Array<{ x: number; y: number; opacity: number }>;
    rotation: number;
    rotationSpeed: number;
    color: string;
    shape: 'circle' | 'square';
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
            directionX: undefined,
            directionY: undefined,
            trail: false,
            trailLength: 10,
            trailFade: 0.1,
            gravity: 0,
            rotationSpeed: 0,
            initialRadius: 1,
            finalRadius: 3,
            gradient: { from: "rgba(255, 255, 255, 0.5)", to: "rgba(255, 0, 0, 0.5)", deg: 0 },
            onParticleStart: undefined,
            onParticleEnd: undefined,
            scaleVariation: 0,
            colorVariation: 0,
            shape: 'circle',
            ...config
        };
        this.batchSize = this.config.batchSize!;
        this.render();
    }

    protected draw() {
        if (!this.isInitialized) {
            this.radial.children.push(this);
            this.isInitialized = true;
        }

        if (this.particleData.length > 0) {
            this.ctx.save();
            this.ctx.globalAlpha = this.config.opacity || 1;
            this.drawParticlesWithTrail(this.ctx);
            this.ctx.restore();
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

        for (let i = 0; i < this.particleData.length; i += this.batchSize) {
            const batch = this.particleData.slice(i, i + this.batchSize);
            this.updateBatch(batch, currentTime);
        }

        this.particleData = this.particleData.filter(data => {
            const particleElapsedTime = currentTime - data.createdAt;
            const lifeProgress = particleElapsedTime / this.config.lifetime!;
            return lifeProgress < 1;
        });

        if (this.particleData.length > 0) {
            this.setDirtyFlag(true);
            this.requestRedraw();
            this.animationId = requestAnimationFrame(() => this.emitRender());
        } else {
            this.stop();
        }
    }

    private updateBatch(batch: ParticleData[], currentTime: number) {
        batch.forEach(data => {
            if (this.config.trail) {
                data.trail.unshift({
                    x: data.x,
                    y: data.y,
                    opacity: 1
                });

                if (data.trail.length > this.config.trailLength!) {
                    data.trail.pop();
                }

                data.trail.forEach((point, index) => {
                    point.opacity = 1 - (index * this.config.trailFade!);
                });
            }

            data.x += data.dirX * data.speed;
            data.y += data.dirY * data.speed + this.config.gravity!;
            data.rotation += data.rotationSpeed;

            const particleElapsedTime = currentTime - data.createdAt;
            const lifeProgress = particleElapsedTime / this.config.lifetime!;
            data.opacity = Math.max(0, 1 - lifeProgress);
            data.radius = data.initialRadius + (data.finalRadius - data.initialRadius) * lifeProgress;

            if (lifeProgress >= 1 && this.config.onParticleEnd) {
                this.config.onParticleEnd(data);
            }
        });
    }

    private drawParticlesWithTrail(ctx: CanvasRenderingContext2D) {
        ctx.save();
        this.particleData.forEach(data => {
            if (this.config.color) {
                ctx.fillStyle = data.color;
            } else if (this.config.gradient) {
                const gradient = ctx.createLinearGradient(
                    data.x, data.y, 
                    data.x + Math.cos(this.config.gradient.deg! * Math.PI / 180) * data.radius, 
                    data.y + Math.sin(this.config.gradient.deg! * Math.PI / 180) * data.radius
                );
                gradient.addColorStop(0, this.config.gradient.from!);
                gradient.addColorStop(1, this.config.gradient.to!);
                ctx.fillStyle = gradient;
            }

            if (this.config.trail) {
                const trailStep = Math.max(1, Math.floor(this.config.trailLength! / 5));
                for (let i = 0; i < data.trail.length; i += trailStep) {
                    const point = data.trail[i];
                    const trailRadius = data.radius * (1 - i / this.config.trailLength!);
                    ctx.globalAlpha = point.opacity * data.opacity;
                    ctx.beginPath();
                    if (data.shape === 'circle') {
                        ctx.arc(point.x, point.y, trailRadius, 0, Math.PI * 2);
                    } else if (data.shape === 'square') {
                        ctx.rect(point.x - trailRadius, point.y - trailRadius, trailRadius * 2, trailRadius * 2);
                    }
                    ctx.fill();
                }
            }

            ctx.globalAlpha = data.opacity;
            ctx.beginPath();
            if (data.shape === 'circle') {
                ctx.arc(data.x, data.y, data.radius, 0, Math.PI * 2);
            } else if (data.shape === 'square') {
                ctx.rect(data.x - data.radius, data.y - data.radius, data.radius * 2, data.radius * 2);
            }
            ctx.fill();
        });

        ctx.restore();
    }

    public emitter(emitters: number): void {
        if (emitters > 10000) {
            emitters = 10000;
        }

        this.startTime = Date.now();
        const { x, y } = this.config;

        const newParticles: ParticleData[] = new Array(emitters);
        for (let i = 0; i < emitters; i++) {
            const radius = Math.random() * 
                (this.config.maxRadius! - this.config.minRadius!) + 
                this.config.minRadius!;

            const dirX = this.config.directionX ?? (Math.random() - 0.5) * 6;
            const dirY = this.config.directionY ?? (Math.random() - 0.5) * 6;
            const speed = Math.random() * 
                (this.config.maxSpeed! - this.config.minSpeed!) + 
                this.config.minSpeed!;
            const rotationSpeed = this.config.rotationSpeed ?? (Math.random() - 0.5) * 0.1;
            const scale = 1 + (Math.random() - 0.5) * this.config.scaleVariation!;
            const color = this.config.color ? this.config.color : `hsl(${Math.random() * 360}, 100%, 50%)`;
            const variedColor = this.config.colorVariation ? this.varyColor(color, this.config.colorVariation!) : color;

            newParticles[i] = {
                x,
                y,
                dirX,
                dirY,
                speed,
                opacity: 1,
                radius: radius * scale,
                initialRadius: this.config.initialRadius! * scale,
                finalRadius: this.config.finalRadius! * scale,
                createdAt: Date.now(),
                trail: [],
                rotation: 0,
                rotationSpeed,
                color: variedColor,
                shape: this.config.shape!
            };

            if (this.config.onParticleStart) {
                this.config.onParticleStart(newParticles[i]);
            }
        }

        this.particleData.push(...newParticles);

        if (!this.animationId) {
            this.emitRender();
        }
    }

    private varyColor(color: string, variation: number): string {
        const hsl = color.match(/hsl\((\d+), (\d+)%?, (\d+)%?\)/);
        if (hsl) {
            const [h, s, l] = hsl.slice(1).map(Number);
            const hVariation = (Math.random() - 0.5) * variation;
            const sVariation = (Math.random() - 0.5) * variation;
            const lVariation = (Math.random() - 0.5) * variation;
            return `hsl(${(h + hVariation) % 360}, ${Math.max(0, Math.min(100, s + sVariation))}%, ${Math.max(0, Math.min(100, l + lVariation))}%)`;
        }
        return color;
    }

    private stop(): void {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        this.particleData = [];
        this.particlePool = [];
        this.setDirtyFlag(true);
        this.requestRedraw();
    }

    public destroy(): void {
        this.stop();
        super.destroy();
    }
}