import Game from "@/components/Game";

const isVariant = (value: unknown): value is "1s" | "3s" | "5s" =>
  value === "1s" || value === "3s" || value === "5s";

export default async function PlayPage({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string | string[] }>;
}) {
  const params = await searchParams;
  const variantValue = Array.isArray(params.variant)
    ? params.variant[0]
    : params.variant;
  const hasVariant = isVariant(variantValue);
  const initialVariant = hasVariant ? variantValue : "3s";

  return <Game initialVariant={initialVariant} autoStart={hasVariant} />;
}
