# 03 · Copilot Fusion and the 30% offer

| | |
|---|---|
| **Slides** | 9–10 |
| **Time** | 8 minutes (about 4 minutes live) |
| **Goal** | Fusion picks the right models for each step. You choose an effort level, not a model. It's 30% off model costs right now |
| **Audience level** | Beginner → intermediate |

## Setup

- A session on this repo.
- The model picker is visible.

## Steps

1. **Model picker (1 min).** Open the model picker. Select **Copilot Fusion**, then show the three effort levels:

   | Effort | Use it for |
   |---|---|
   | **Fusion Standard** | Everyday work: questions, small edits, tests |
   | **Fusion High** | Complex bugs and multi-file changes |
   | **Fusion Max** | The hardest problems: design, deep debugging |

2. **Easy task on Standard (1 min).**

   ```text
   Write a JSDoc comment for the isValidDate function in app/src/slots.js.
   ```

   - *Say:* "For a small task, Fusion usually uses a single, efficient model."
3. **Harder task on High (2 min).** Switch to **Fusion High**:

   ```text
   Review app/src/bookings.js and app/src/server.js for edge cases in booking validation and concurrency. List the top 3 risks with a test idea for each. Don't change any files.
   ```

   - *Say:* "On harder work, Fusion may draft with one model and have others check it. That's the Cascade or Critique pattern on slide 9."
4. **Show which models were used (30 sec).** Hover over the effort level under the response to show the models Fusion used.
5. **Value (1 min).** Go back to slide 10.

## Expected result

- Step 2: a short JSDoc block.
- Step 3: a list of risks. Likely items:
  - Bookings in the past are accepted.
  - `customerName` has no length limit.
  - Bookings are lost when the server restarts (in-memory store).
- If it flags a race condition, ask "Is that a real risk in Node.js here?" `create()` is synchronous, so it isn't. This shows how to challenge the agent's answers.

## Talking points

- **GA on October 28, 2026.** Available in VS Code, the CLI, the Copilot app and JetBrains.
- **Patterns:** Single (one model), Cascade (efficient model drafts, a judge accepts or escalates), Critique (critics review in parallel, the drafter revises).
- **Billing:** no separate Fusion fee. You pay each model's standard rate. High and Max can use more than one model, so a task can cost more than Standard.
- **30% offer:** paid Copilot plans get 30% off model costs with Fusion **through November 30, 2026**.
- **Benchmark:** Fusion Max scored 60 on the Artificial Analysis Coding Agent Index, within 2 points of the top frontier model, at about half the cost and about 40% less time.
- **Admin control:** Fusion only uses models allowed by policy. Admins can exclude models from Fusion or make Fusion the default.

## Fallback

- **Fusion Max isn't in the picker:** a required model is disabled by policy. Say so — it shows that admin controls work — and use Fusion High.
- **Fusion isn't available at all:** show slides 9–10 and run the same prompts with any model.
