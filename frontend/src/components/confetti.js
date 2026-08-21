/**
 * Confetti animation for victory celebrations.
 * Adapted from Lichess ui/bits/src/bits.confetti.ts
 */

function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

let confettiModule = null;

export async function initConfetti(opts = { cannons: true, fireworks: true }) {
  const canvas = document.querySelector("canvas#confetti");
  if (!canvas) return;

  if (!confettiModule) {
    const mod = await import("canvas-confetti");
    confettiModule = mod.default;
  }

  const party = confettiModule.create(canvas, {
    disableForReducedMotion: true,
    useWorker: true,
    resize: true
  });

  if (opts.cannons) {
    const durationMs = 2400;
    const endAt = Date.now() + durationMs;

    const interval = setInterval(() => {
      const timeLeft = endAt - Date.now();
      if (timeLeft <= 0) clearInterval(interval);
      else cannons();
    }, 250);
  }

  if (opts.fireworks) {
    [80, 520, 980, 1520].forEach((delay) =>
      setTimeout(() => fireworks(), delay)
    );
  }

  const cannons = () => {
    const fire = (custom) =>
      party({
        scalar: 0.88,
        gravity: 0.45,
        particleCount: randomInRange(18, 34),
        spread: randomInRange(46, 92),
        startVelocity: randomInRange(28, 88),
        ticks: randomInRange(90, 140),
        ...custom
      });

    for (let i = 0; i < 2; i++) {
      fire({
        angle: randomInRange(50, 70),
        drift: randomInRange(0, 1),
        origin: { x: -0.3, y: 1 }
      });
    }

    for (let i = 0; i < 2; i++) {
      fire({
        angle: randomInRange(110, 130),
        drift: randomInRange(-1, 0),
        origin: { x: 1.3, y: 1 }
      });
    }
  };

  const fireworks = () => {
    const options = {
      spread: 360,
      ticks: 70,
      gravity: 0.2,
      decay: 0.88,
      startVelocity: 28,
      colors: ["FFFFFF", "F7FFB0", "DFFF3A", "C8FF00"]
    };

    const shoot = () => {
      const origin = {
        x: randomInRange(0.18, 0.82),
        y: randomInRange(0.08, 0.42)
      };

      [0, 150].forEach((d) =>
        setTimeout(() => {
          party({
            ...options,
            origin,
            particleCount: 16,
            shapes: ["star"],
            scalar: 0.48
          });
          party({
            ...options,
            origin,
            particleCount: 34,
            shapes: ["circle"],
            scalar: 0.34
          });
        }, d)
      );
    };

    [0, 110, 220, 330].forEach((d) => setTimeout(shoot, d));
  };
}

export function clearConfetti() {
  const canvas = document.querySelector("canvas#confetti");
  if (canvas) {
    canvas.remove();
  }
}
