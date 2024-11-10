export type Point = {
    x: number;
    y: number;
};

export interface BaseConfig {
    x: number;
    y: number;
    color: string;
    borderWidth?: number;
    borderColor?: string;
    shadowColor?: string;
    shadowBlur?: number;
    shadowOffset?: Point;
    draggable?: boolean;
}