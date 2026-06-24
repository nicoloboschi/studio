// build-data.mjs — the scenario for the "a bigger context window isn't memory" short.
//
// Illustrative but concrete: a dev tells their agent facts over a long session. The window has a
// fixed capacity; as new messages arrive, the OLDEST scroll out — including the one that mattered.
// Ask a question whose answer depends on that dropped fact and the agent gets it wrong. With a memory
// system the fact is lifted out of the window and kept, so the same question is answered right.
//
// Edit and re-run to recut:  node agent-memory/context-window/capture/build-data.mjs

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const data = {
  headline: "A bigger context window isn't memory: the key fact scrolls out, the agent answers wrong — memory keeps it.",
  // messages the user sends across one long session; index 0 is the fact that will matter later.
  messages: [
    { text: "heads up: we're on Postgres, not MySQL", key: true },
    { text: "the API is written in Go" },
    { text: "deploys go out on Fridays" },
    { text: "web app uses pnpm" },
    { text: "staging mirrors prod" },
    { text: "feature flags via LaunchDarkly" },
    { text: "CI runs the tests on every PR" },
    { text: "logs ship to Datadog" },
  ],
  capacity: 5, // how many messages fit in the window before the oldest is truncated
  // the memory system distills the key message into one durable fact
  memory: { label: "DB", value: "Postgres" },
  question: "what migration tool should I use?",
  answerWrong: "Use Flyway with your MySQL setup.", // forgot — the Postgres note scrolled out
  answerRight: "Use a Postgres tool — golang-migrate or Atlas.", // remembered
};

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "data.json");
writeFileSync(out, JSON.stringify(data, null, 2) + "\n");
console.log(`wrote ${out} · ${data.messages.length} messages · capacity ${data.capacity}`);
