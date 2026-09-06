const assert = require("node:assert/strict");
const test = require("node:test");

const { MoveWriteBuffer } = require("../src/services/move-write-buffer");

function move(sequence) {
  return { sequence, notation: `(${sequence})W:e2_e4` };
}

test("flushes at the configured batch size in sequence order", async () => {
  const writes = [];
  const buffer = new MoveWriteBuffer({
    batchSize: 3,
    flushIntervalMs: 60_000,
    persistBatch: async (batch, metadata) => {
      writes.push({ sequences: batch.map((item) => item.sequence), metadata });
    }
  });

  buffer.add(move(1));
  buffer.add(move(2));
  buffer.add(move(3));
  await buffer.flush();

  assert.deepEqual(writes, [
    {
      sequences: [1, 2, 3],
      metadata: { expectedLastSequence: 0, reason: "batch-size" }
    }
  ]);
  assert.equal(buffer.durableSequence, 3);
});

test("flushes pending moves when the interval expires", async () => {
  const writes = [];
  const buffer = new MoveWriteBuffer({
    batchSize: 10,
    flushIntervalMs: 10,
    persistBatch: async (batch) =>
      writes.push(batch.map((item) => item.sequence))
  });

  buffer.add(move(1));
  await new Promise((resolve) => setTimeout(resolve, 30));

  assert.deepEqual(writes, [[1]]);
  assert.equal(buffer.durableSequence, 1);
});

test("terminal close forces a final flush and closes the buffer", async () => {
  const writes = [];
  const buffer = new MoveWriteBuffer({
    persistBatch: async (batch) =>
      writes.push(batch.map((item) => item.sequence))
  });

  buffer.add(move(1));
  buffer.add(move(2));
  const finalSequence = await buffer.close();

  assert.equal(finalSequence, 2);
  assert.deepEqual(writes, [[1, 2]]);
  assert.throws(() => buffer.add(move(3)), /MOVE_BUFFER_CLOSED/);
});

test("a failed batch is retained and later writes cannot overtake it", async () => {
  const failure = new Error("database unavailable");
  let reportedError = null;
  const buffer = new MoveWriteBuffer({
    persistBatch: async () => {
      throw failure;
    },
    onError: (error) => {
      reportedError = error;
    }
  });

  buffer.add(move(1));
  await assert.rejects(buffer.flush(), failure);

  assert.equal(buffer.pendingCount, 1);
  assert.equal(reportedError, failure);
  assert.throws(() => buffer.add(move(2)), failure);
});
