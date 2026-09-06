const VARIANT_TIMES = Object.freeze({
  "1s": 1000,
  "3s": 3000,
  "5s": 5000
});

const VARIANT_DATABASE_VALUES = Object.freeze({
  "1s": "ONE_SECOND",
  "3s": "THREE_SECONDS",
  "5s": "FIVE_SECONDS"
});

function getVariantTime(variant) {
  const value = VARIANT_TIMES[variant];
  if (!value) throw new TypeError(`Unsupported game variant: ${variant}`);
  return value;
}

function getDatabaseVariant(variant) {
  const value = VARIANT_DATABASE_VALUES[variant];
  if (!value) throw new TypeError(`Unsupported game variant: ${variant}`);
  return value;
}

function getDatabaseColor(color) {
  if (color === "white") return "WHITE";
  if (color === "black") return "BLACK";
  throw new TypeError(`Unsupported chess color: ${color}`);
}

module.exports = {
  VARIANT_TIMES,
  getDatabaseColor,
  getDatabaseVariant,
  getVariantTime
};
