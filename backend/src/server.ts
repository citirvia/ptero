import closeWithGrace from "close-with-grace";
import { buildApp } from "./app.js";
import { env, hasAppKey, hasClientKey } from "./config/env.js";
import { startBillingProcessor } from "./lib/billing-processor.js";
import { startUsageRecorder } from "./lib/usage-recorder.js";

async function main() {
  const app = await buildApp();

  if (!hasClientKey) {
    app.log.warn(
      "PTERO_CLIENT_KEY is not set — client routes (/api/servers/*) will return 501.",
    );
  }
  if (!hasAppKey) {
    app.log.warn(
      "PTERO_APP_KEY is not set — admin routes (/api/admin/*) will return 501.",
    );
  }

  let stopRecorder: (() => void) | undefined;
  let stopBilling: (() => void) | undefined;

  closeWithGrace({ delay: 10_000 }, async ({ err }) => {
    if (err) app.log.error(err);
    stopRecorder?.();
    stopBilling?.();
    await app.close();
  });

  try {
    await app.listen({ host: env.HOST, port: env.PORT });
    app.log.info(`Panel target: ${env.PTERO_PANEL_URL}`);
    if (env.NODE_ENV !== "test") {
      stopRecorder = startUsageRecorder(app);
      stopBilling = startBillingProcessor(app);
    }
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

void main();
