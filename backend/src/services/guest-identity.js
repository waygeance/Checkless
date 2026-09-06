const crypto = require("node:crypto");

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;

function secret() {
  const value = process.env.GUEST_TOKEN_SECRET;
  if (!value || value.length < 32) {
    throw new Error("GUEST_TOKEN_SECRET must be at least 32 characters");
  }
  return value;
}

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function sign(payload) {
  return crypto
    .createHmac("sha256", secret())
    .update(payload)
    .digest("base64url");
}

function createGuestToken(guest) {
  const payload = encode({
    gid: guest.id,
    v: guest.tokenVersion,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS
  });
  return `${payload}.${sign(payload)}`;
}

function readGuestToken(token) {
  if (typeof token !== "string") return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  )
    return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return data.exp > Math.floor(Date.now() / 1000) ? data : null;
  } catch {
    return null;
  }
}

async function issueGuestIdentity(prisma) {
  const guest = await prisma.guestIdentity.create({
    data: {
      publicAlias: `Guest-${crypto.randomBytes(3).toString("hex").toUpperCase()}`
    }
  });
  return { guest, token: createGuestToken(guest) };
}

async function resolveGuestIdentity(prisma, token) {
  const data = readGuestToken(token);
  if (!data?.gid || !Number.isInteger(data.v)) return null;
  const guest = await prisma.guestIdentity.findUnique({
    where: { id: data.gid }
  });
  if (!guest || guest.tokenVersion !== data.v) return null;
  await prisma.guestIdentity.update({
    where: { id: guest.id },
    data: { lastSeenAt: new Date() }
  });
  return guest;
}

module.exports = {
  createGuestToken,
  readGuestToken,
  issueGuestIdentity,
  resolveGuestIdentity
};
