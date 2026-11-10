"""Generate SYNTHETIC warranty-claims data for the Excel demo.

All numbers are randomly generated for demonstration only. They are not Ford data.

Outputs (same folder):
  warranty-claims.csv                 raw data (for any tool)
  warranty-claims.xlsx                raw data as an Excel table (start of the live demo)
  warranty-analysis-completed.xlsx    finished analysis (fallback if the live demo fails)
"""
import csv
import random
from pathlib import Path

from openpyxl import Workbook
from openpyxl.chart import BarChart, Reference
from openpyxl.formatting.rule import ColorScaleRule
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.table import Table, TableStyleInfo

random.seed(2026)
OUT = Path(__file__).parent

MONTHS = [f"2025-{m:02d}" for m in range(10, 13)] + [f"2026-{m:02d}" for m in range(1, 10)]
SEGMENTS = {
    # segment: (plant, monthly base claims)
    "Full-size pickup": ("Plant MI-1", 120),
    "Midsize pickup": ("Plant MI-2", 55),
    "Compact SUV": ("Plant KY-1", 80),
    "Midsize SUV": ("Plant IL-1", 70),
    "Electric SUV": ("Plant MX-1", 45),
    "Off-road SUV": ("Plant MI-2", 40),
    "Commercial van": ("Plant MO-1", 60),
}
REGIONS = {"North America": 1.0, "Europe": 0.35, "South America": 0.2}
COMPONENTS = {
    # component: (share of claims, average cost per claim USD, average repair days)
    "Powertrain": (0.22, 2400, 4.5),
    "Electrical": (0.24, 650, 1.8),
    "Infotainment": (0.20, 380, 0.9),
    "Body & Trim": (0.18, 520, 2.2),
    "Brakes & Suspension": (0.16, 430, 1.4),
}


def quarter(month: str) -> str:
    y, m = month.split("-")
    return f"{y}-Q{(int(m) - 1) // 3 + 1}"


def build_rows():
    rows = []
    for month in MONTHS:
        mnum = int(month[-2:])
        for seg, (plant, base) in SEGMENTS.items():
            for region, rmult in REGIONS.items():
                for comp, (share, cost, days) in COMPONENTS.items():
                    mult = 1.0
                    if comp == "Electrical" and mnum in (12, 1, 2):
                        mult *= 1.25  # winter electrical spike
                    if seg == "Electric SUV" and comp == "Powertrain":
                        mult *= 0.55  # fewer moving parts
                    if seg == "Compact SUV" and comp == "Infotainment" and month in ("2026-03", "2026-04", "2026-05"):
                        mult *= 3.2  # planted anomaly: software update issue
                    claims = max(0, round(base * rmult * share * mult * random.uniform(0.8, 1.2)))
                    cpc = cost * random.uniform(0.85, 1.15)
                    rows.append({
                        "Month": month,
                        "Quarter": quarter(month),
                        "Region": region,
                        "Plant": plant,
                        "Vehicle Segment": seg,
                        "Component": comp,
                        "Claims": claims,
                        "Total Cost (USD)": round(claims * cpc, 2),
                        "Avg Repair Days": round(days * random.uniform(0.8, 1.25), 1),
                    })
    return rows


def style_header(ws, ncols):
    for c in range(1, ncols + 1):
        cell = ws.cell(row=1, column=c)
        cell.font = Font(bold=True, color="FFFFFF")
        cell.fill = PatternFill("solid", fgColor="003478")
        cell.alignment = Alignment(horizontal="center", vertical="center")


def write_data_sheet(ws, rows):
    headers = list(rows[0].keys())
    ws.append(headers)
    for r in rows:
        ws.append([r[h] for h in headers])
    last = f"{get_column_letter(len(headers))}{len(rows) + 1}"
    table = Table(displayName="Claims", ref=f"A1:{last}")
    table.tableStyleInfo = TableStyleInfo(name="TableStyleMedium2", showRowStripes=True)
    ws.add_table(table)
    widths = [10, 10, 15, 12, 20, 22, 9, 17, 16]
    for i, w in enumerate(widths, start=1):
        ws.column_dimensions[get_column_letter(i)].width = w
    for row in ws.iter_rows(min_row=2, min_col=8, max_col=8):
        row[0].number_format = "$#,##0"
    ws.freeze_panes = "A2"


def main():
    rows = build_rows()

    with open(OUT / "warranty-claims.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)

    # Raw workbook: starting point for the live demo
    wb = Workbook()
    ws = wb.active
    ws.title = "Data"
    write_data_sheet(ws, rows)
    wb.save(OUT / "warranty-claims.xlsx")

    # Completed workbook: fallback showing the expected end state
    wb = Workbook()
    data = wb.active
    data.title = "Data"
    write_data_sheet(data, rows)

    summ = wb.create_sheet("Summary", 0)
    quarters = sorted({r["Quarter"] for r in rows})
    segs = list(SEGMENTS.keys())
    summ["A1"] = "Warranty claims by vehicle segment and quarter (synthetic demo data)"
    summ["A1"].font = Font(bold=True, size=14, color="003478")
    header = ["Vehicle Segment"] + quarters + ["Total Claims", "Total Cost (USD)", "Cost per Claim"]
    for c, h in enumerate(header, start=1):
        summ.cell(row=3, column=c, value=h)
    for i, seg in enumerate(segs):
        r = 4 + i
        summ.cell(row=r, column=1, value=seg)
        for j, q in enumerate(quarters):
            summ.cell(row=r, column=2 + j,
                      value=f'=SUMIFS(Claims[Claims],Claims[Vehicle Segment],$A{r},Claims[Quarter],"{q}")')
        qlast = get_column_letter(1 + len(quarters))
        tc = 2 + len(quarters)
        summ.cell(row=r, column=tc, value=f"=SUM(B{r}:{qlast}{r})")
        summ.cell(row=r, column=tc + 1, value=f"=SUMIFS(Claims[Total Cost (USD)],Claims[Vehicle Segment],$A{r})")
        summ.cell(row=r, column=tc + 2, value=f"={get_column_letter(tc + 1)}{r}/{get_column_letter(tc)}{r}")
        summ.cell(row=r, column=tc + 1).number_format = "$#,##0"
        summ.cell(row=r, column=tc + 2).number_format = "$#,##0"
    total_row = 4 + len(segs)
    summ.cell(row=total_row, column=1, value="Total").font = Font(bold=True)
    for c in range(2, len(header) + 1):
        col = get_column_letter(c)
        if c == len(header):
            prev2, prev1 = get_column_letter(c - 1), get_column_letter(c - 2)
            summ.cell(row=total_row, column=c, value=f"={prev2}{total_row}/{prev1}{total_row}").number_format = "$#,##0"
        else:
            cell = summ.cell(row=total_row, column=c, value=f"=SUM({col}4:{col}{total_row - 1})")
            cell.font = Font(bold=True)
            if c == len(header) - 1:
                cell.number_format = "$#,##0"
    for c in range(1, len(header) + 1):
        cell = summ.cell(row=3, column=c)
        cell.font = Font(bold=True, color="FFFFFF")
        cell.fill = PatternFill("solid", fgColor="003478")
        cell.alignment = Alignment(horizontal="center", wrap_text=True)
    summ.column_dimensions["A"].width = 20
    for c in range(2, len(header) + 1):
        summ.column_dimensions[get_column_letter(c)].width = 13
    qrange = f"B4:{get_column_letter(1 + len(quarters))}{total_row - 1}"
    summ.conditional_formatting.add(qrange, ColorScaleRule(start_type="min", start_color="F8FAFC",
                                                           mid_type="percentile", mid_value=50, mid_color="FDE68A",
                                                           end_type="max", end_color="DC2626"))

    chart = BarChart()
    chart.type = "col"
    chart.title = "Total claims by vehicle segment"
    chart.y_axis.title = "Claims"
    tc = 2 + len(quarters)
    chart.add_data(Reference(summ, min_col=tc, min_row=3, max_row=total_row - 1), titles_from_data=True)
    chart.set_categories(Reference(summ, min_col=1, min_row=4, max_row=total_row - 1))
    chart.height, chart.width = 8, 18
    summ.add_chart(chart, f"A{total_row + 3}")

    notes = wb.create_sheet("Insights", 1)
    notes["A1"] = "Insights (what Copilot should surface)"
    notes["A1"].font = Font(bold=True, size=14, color="003478")
    insights = [
        "Compact SUV infotainment claims spike ~3x in Mar-May 2026 (likely software update issue).",
        "Electrical claims rise ~25% in winter months (Dec-Feb) across all segments.",
        "Powertrain has the highest cost per claim; Electric SUV powertrain claims are ~45% lower.",
        "Full-size pickup has the most claims overall (largest volume), not the highest rate.",
    ]
    for i, t in enumerate(insights, start=3):
        notes.cell(row=i, column=1, value=f"- {t}")
    notes.column_dimensions["A"].width = 110

    wb.save(OUT / "warranty-analysis-completed.xlsx")
    print(f"Wrote {len(rows)} rows")


if __name__ == "__main__":
    main()
