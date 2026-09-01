import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Game from "../components/Game";

const isVariant = (value) => value === "1s" || value === "3s" || value === "5s";

export default function Play() {
  const [searchParams] = useSearchParams();
  const variantParam = searchParams.get("variant");

  const hasVariant = isVariant(variantParam);
  const initialVariant = hasVariant ? variantParam : "3s";

  useEffect(() => {
    document.title = "Play Simultaneous Chess — Checkless";
  }, []);

  return <Game initialVariant={initialVariant} autoStart={hasVariant} />;
}
