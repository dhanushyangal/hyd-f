import { logs, SeverityNumber, type Logger } from "@opentelemetry/api-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchLogRecordProcessor, LoggerProvider } from "@opentelemetry/sdk-logs";
import { getPostHogHost, getPostHogToken } from "./posthog";

export { SeverityNumber };

let loggerProvider: LoggerProvider | null = null;

/** Initialize PostHog OpenTelemetry logging (Node.js only). */
export function initPostHogLogs(): void {
  const token = getPostHogToken();
  if (!token || loggerProvider) return;

  const host = getPostHogHost().replace(/\/+$/, "");

  loggerProvider = new LoggerProvider({
    resource: resourceFromAttributes({ "service.name": "hydrilla-ai" }),
    processors: [
      new BatchLogRecordProcessor(
        new OTLPLogExporter({
          url: `${host}/i/v1/logs`,
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
      ),
    ],
  });

  logs.setGlobalLoggerProvider(loggerProvider);
}

export function getPostHogLoggerProvider(): LoggerProvider | null {
  return loggerProvider;
}

export function getPostHogLogger(name = "hydrilla-ai"): Logger | null {
  return loggerProvider?.getLogger(name) ?? null;
}

/** Flush batched logs — call from route handlers via next/server `after()`. */
export async function flushPostHogLogs(): Promise<void> {
  await loggerProvider?.forceFlush();
}
