// Producers and the consumer that replace pgmq + pg_cron.
// The old `queue-worker` function and the `drain-queues` cron job both retire with this file:
// Cloudflare Queues pushes batches to the consumer, so nothing polls on a timer.
import type { Bindings, PayoutJob, WebhookJob } from "./env";
import { withSql } from "./db";

export const enqueueWebhookProcess = (env: Bindings, body: WebhookJob) =>
  env.WEBHOOK_QUEUE.send(body);

export const enqueuePayoutProcess = (env: Bindings, payoutRequestId: string) =>
  env.PAYOUT_QUEUE.send({ payoutRequestId });

type AnyJob = WebhookJob | PayoutJob;

// Consumer entry. Ack per message so one bad job does not retry the whole batch.
export const handleQueueBatch = async (
  batch: MessageBatch<AnyJob>,
  env: Bindings,
  ctx: ExecutionContext,
): Promise<void> => {
  await withSql(env, ctx, async (sql) => {
    for (const message of batch.messages) {
      try {
        if (batch.queue === "prism-webhook-processing") {
          // TODO: port handleWebhookJob from _shared/webhook-handlers.ts, taking sql as a param.
          await processWebhook(sql, message.body as WebhookJob);
        } else if (batch.queue === "prism-payout-processing") {
          // TODO: port processPayout from _shared/payout-processor.ts, taking sql as a param.
          await processPayout(sql, message.body as PayoutJob);
        }
        message.ack();
      } catch (err) {
        console.error("Queue job failed", { queue: batch.queue, id: message.id, err });
        message.retry();
      }
    }
  });
};

// Placeholders so the Worker type-checks before the handlers are ported.
type Sql = Awaited<ReturnType<typeof import("./db").createSql>>;

const processWebhook = async (_sql: Sql, _job: WebhookJob): Promise<void> => {
  throw new Error("processWebhook not ported yet");
};

const processPayout = async (_sql: Sql, _job: PayoutJob): Promise<void> => {
  throw new Error("processPayout not ported yet");
};
