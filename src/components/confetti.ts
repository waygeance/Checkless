// Confetti animation for victory celebrations
// Adapted from lila ui/bits/src/bits.confetti.ts

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

interface ConfettiOpts {
  cannons?: boolean;
  fireworks?: boolean;
}

let confettiModule: any = null;

export async function initConfetti(opts: ConfettiOpts = {
  cannons: true,
  fireworks: true,
}): Promise<void> {
  const canvas = document.querySelector<HTMLCanvasElement>('canvas#confetti');
  if (!canvas) return;

  // Dynamically import canvas-confetti
  if (!confettiModule) {
    confettiModule = await import('canvas-confetti');
  }

  const party = confettiModule.default.create(canvas, {
    disableForReducedMotion: true,
    useWorker: true,
    resize: true,
  });

  if (opts.cannons) {
    const durationMs = 2400;
    const endAt = Date.now() + durationMs;

    const interval = setInterval(function () {
      const timeLeft = endAt - Date.now();
      if (timeLeft <= 0) clearInterval(interval);
      else cannons();
    }, 250);
  }

  if (opts.fireworks) {
    [80, 520, 980, 1520].forEach((delay) => setTimeout(() => fireworks(), delay));
  }

  const cannons = () => {
    const fire = (custom: any) =>
      party({
        scalar: 0.88,
        gravity: 0.45,
        particleCount: randomInRange(18, 34),
        spread: randomInRange(46, 92),
        startVelocity: randomInRange(28, 88),
        ticks: randomInRange(90, 140),
        ...custom,
      });

    // left cannon
    for (const _ of [0, 1])
      fire({
        angle: randomInRange(50, 70),
        drift: randomInRange(0, 1),
        origin: { x: -0.3, y: 1 },
      });

    // right cannon
    for (const _ of [0, 1])
      fire({
        angle: randomInRange(110, 130),
        drift: randomInRange(-1, 0),
        origin: { x: 1.3, y: 1 },
      });
  };

  const fireworks = () => {
    const opts: any = {
      spread: 360,
      ticks: 70,
      gravity: 0.2,
      decay: 0.88,
      startVelocity: 28,
      colors: ["FFFFFF", "F7FFB0", "DFFF3A", "C8FF00"],
    };
    const shoot = () => {
      const origin = {
        x: randomInRange(0.18, 0.82),
        y: randomInRange(0.08, 0.42),
      };
      [0, 150].forEach(d =>
        setTimeout(() => {
          party({
            ...opts,
            origin,
            particleCount: 16,
            shapes: ["star"],
            scalar: 0.48,
          });
          party({
            ...opts,
            origin,
            particleCount: 34,
            shapes: ["circle"],
            scalar: 0.34,
          });
        }, d),
      );
    };
    [0, 110, 220, 330].forEach((d) => setTimeout(shoot, d));
  };
}

export function clearConfetti(): void {
  const canvas = document.querySelector<HTMLCanvasElement>('canvas#confetti');
  if (canvas) {
    canvas.remove();
  }
}
