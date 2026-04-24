declare module "canvas-confetti" {
  export interface ConfettiOrigin {
    x?: number;
    y?: number;
  }

  export interface ConfettiOptions {
    angle?: number;
    colors?: string[];
    decay?: number;
    disableForReducedMotion?: boolean;
    drift?: number;
    gravity?: number;
    origin?: ConfettiOrigin;
    particleCount?: number;
    resize?: boolean;
    scalar?: number;
    shapes?: string[];
    spread?: number;
    startVelocity?: number;
    ticks?: number;
    useWorker?: boolean;
  }

  export type ConfettiInstance = (options?: ConfettiOptions) => Promise<null> | null;

  export interface CanvasConfetti {
    create(
      canvas?: HTMLCanvasElement | null,
      options?: ConfettiOptions,
    ): ConfettiInstance;
  }

  const confetti: CanvasConfetti;

  export default confetti;
}
