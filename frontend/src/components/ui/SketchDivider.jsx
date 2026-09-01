import { useEffect, useRef } from "react";
import rough from "roughjs/bundled/rough.esm.js";

export function SketchDivider({ className = "" }) {
  const svgRef = useRef(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    svg.replaceChildren();
    const renderer = rough.svg(svg);
    svg.appendChild(
      renderer.line(3, 9, 597, 8, {
        stroke: "#b58a4a",
        strokeWidth: 1.2,
        roughness: 1.4,
        bowing: 1.1
      })
    );
  }, []);

  return (
    <svg
      ref={svgRef}
      className={`h-4 w-full opacity-65 ${className}`}
      viewBox="0 0 600 18"
      preserveAspectRatio="none"
      aria-hidden="true"
    />
  );
}
