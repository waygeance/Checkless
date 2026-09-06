const DEFAULT_BATCH_SIZE = 10;
const DEFAULT_FLUSH_INTERVAL_MS = 5000;

/**
 * Serializes and batches durable move writes for one live game.
 *
 * New moves may continue entering the buffer while a previous batch is being
 * written. Only one persist operation runs at a time, so batches cannot be
 * reordered. A failed buffer stays failed and must not silently skip data.
 */
class MoveWriteBuffer {
  constructor({
    persistBatch,
    onError = () => {},
    batchSize = DEFAULT_BATCH_SIZE,
    flushIntervalMs = DEFAULT_FLUSH_INTERVAL_MS
  }) {
    if (typeof persistBatch !== "function") {
      throw new TypeError("persistBatch must be a function");
    }
    if (!Number.isInteger(batchSize) || batchSize < 1) {
      throw new TypeError("batchSize must be a positive integer");
    }
    if (!Number.isInteger(flushIntervalMs) || flushIntervalMs < 1) {
      throw new TypeError("flushIntervalMs must be a positive integer");
    }

    this.persistBatch = persistBatch;
    this.onError = onError;
    this.batchSize = batchSize;
    this.flushIntervalMs = flushIntervalMs;
    this.pending = [];
    this.flushChain = Promise.resolve();
    this.flushTimer = null;
    this.failedError = null;
    this.accepting = true;
    this.durableSequence = 0;
  }

  add(move) {
    if (this.failedError) throw this.failedError;
    if (!this.accepting) throw new Error("MOVE_BUFFER_CLOSED");

    this.pending.push(move);

    if (this.pending.length >= this.batchSize) {
      void this.flush("batch-size").catch(() => {});
    } else {
      this.scheduleFlush();
    }
  }

  scheduleFlush() {
    if (this.flushTimer || !this.accepting || this.pending.length === 0) return;

    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      void this.flush("interval").catch(() => {});
    }, this.flushIntervalMs);
    this.flushTimer.unref?.();
  }

  clearFlushTimer() {
    if (!this.flushTimer) return;
    clearTimeout(this.flushTimer);
    this.flushTimer = null;
  }

  flush(reason = "manual") {
    this.clearFlushTimer();

    const operation = this.flushChain.then(async () => {
      if (this.failedError) throw this.failedError;
      if (this.pending.length === 0) return this.durableSequence;

      const batch = this.pending.splice(0, this.pending.length);

      try {
        await this.persistBatch(batch, {
          expectedLastSequence: this.durableSequence,
          reason
        });
        this.durableSequence = batch[batch.length - 1].sequence;
      } catch (error) {
        this.pending.unshift(...batch);
        this.failedError = error;
        this.accepting = false;
        this.onError(error);
        throw error;
      }

      this.scheduleFlush();
      return this.durableSequence;
    });

    // Keep the internal serialization chain usable for inspection without
    // creating an unhandled rejection. failedError prevents later writes.
    this.flushChain = operation.catch(() => {});
    return operation;
  }

  async close(reason = "terminal") {
    this.accepting = false;
    this.clearFlushTimer();
    return this.flush(reason);
  }

  get pendingCount() {
    return this.pending.length;
  }
}

module.exports = {
  DEFAULT_BATCH_SIZE,
  DEFAULT_FLUSH_INTERVAL_MS,
  MoveWriteBuffer
};
