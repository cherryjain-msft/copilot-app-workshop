# 05 · Excel for business users

| | |
|---|---|
| **Slide** | 12 |
| **Time** | 8 minutes (about 5 minutes live) |
| **Goal** | Copilot isn't only for developers. A quality or finance analyst can explore warranty data in plain English and get tables, charts and insights |
| **Audience level** | Beginner |

## The data

`demo-assets/excel/warranty-claims.xlsx` — **synthetic** data, made by `generate_data.py`. It is not real Ford data.

| | |
|---|---|
| Sheet / table | `Data` sheet, Excel table **`Claims`** |
| Rows | 1,260 (12 months: Oct 2025 – Sep 2026) |
| Columns | Month, Quarter, Region, Plant, Vehicle Segment, Component, Claims, Total Cost (USD), Avg Repair Days |
| Segments | Full-size pickup, Midsize pickup, Compact SUV, Midsize SUV, Electric SUV, Off-road SUV, Commercial van |
| Components | Powertrain, Electrical, Infotainment, Body & Trim, Brakes & Suspension |
| Regions | North America, Europe, South America |

**Planted insights** (what Copilot should find):

1. **Compact SUV infotainment claims spike about 3×** in March–May 2026. Likely cause: a software update. This is the "wow" moment.
2. Electrical claims rise about 25% in winter (December–February).
3. Powertrain has the highest cost per claim. Electric SUV powertrain claims are about 45% lower.
4. Full-size pickup has the most claims because it sells the most, not because it has the highest rate.

## Setup

- `warranty-claims.xlsx` is closed.
- Excel canvas checked on this app build (prep section 7).

## Steps

1. **Open the workbook (30 sec).**

   ```text
   Open demo-assets/excel/warranty-claims.xlsx in the Excel canvas.
   ```

   - *Say:* "Imagine I'm a quality analyst. I don't write formulas every day. I just have questions."
2. **Summary and chart (1.5 min).**

   ```text
   Summarize claims by vehicle segment and quarter, with a chart.
   ```

   **Expected:** a new Summary sheet with `SUMIFS` formulas over the `Claims` table, and a column chart.
3. **Highlight costs (1 min).**

   ```text
   Highlight where cost per claim is 20% above average.
   ```

   **Expected:** a cost-per-claim column with conditional formatting. Point out that it used a formula, not hard-coded values, so it updates when the data changes.
4. **Find the anomaly (1.5 min).**

   ```text
   Find anything unusual in the last 6 months and explain it.
   ```

   **Expected:** the Compact SUV infotainment spike (about 3× in Mar–May 2026), possibly with the winter electrical rise.
   - *Say:* "That's the kind of thing that hides in a 1,260-row sheet. It found it in seconds, and it explains how."
5. **What-if (1 min).**

   ```text
   What if claims drop 15% after the fix? Show savings.
   ```

   **Expected:** a small scenario table with an input cell for the 15% and the cost saved.

## Talking points

- **Plain English in, formulas out.** You can check every cell, because Copilot writes real formulas you can audit.
- **The same canvas the developers use.** No extra tool to learn.
- **Ford use cases:** warranty, quality (8D reports), supplier scorecards, plant KPIs, dealer service data.
- **Microsoft 365 Copilot in Excel** does similar work inside Office. The Copilot app helps when the analysis sits next to code, data pipelines or automations.

## Fallback

- **Excel canvas not available:** open the workbook in Excel with Microsoft 365 Copilot and use the same prompts.
- **Results look different or it's slow:** open `warranty-analysis-completed.xlsx`. It has the expected **Summary** and **Insights** sheets.
- **Need fresh data:** run `python demo-assets/excel/generate_data.py` (needs `openpyxl`). The output is the same every time.
