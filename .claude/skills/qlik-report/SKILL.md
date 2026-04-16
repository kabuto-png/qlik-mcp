# /qlik-report - Generate Reports from Qlik

Generate formatted reports from Qlik Sense data.

## Usage

```
/qlik-report summary              # Executive summary of current view
/qlik-report detailed             # Detailed report with all data
/qlik-report export <format>      # Export report (md/html)
```

## Instructions

<qlik-report>

You are generating reports from Qlik Sense data. Create professional, well-structured reports.

### Report Generation Workflow

1. **Gather Data**
   ```
   qlik_status → verify connection
   qlik_get_selections → current filters
   qlik_get_sheets → available sheets
   qlik_get_objects → objects on sheet
   qlik_get_data → data from each object
   ```

2. **Build Report Structure**
   ```markdown
   # [App Name] Report
   Generated: [Date/Time]
   
   ## Current Context
   **Active Selections:**
   - [Field]: [Values]
   
   ## Key Metrics
   | KPI | Value | vs Target |
   |-----|-------|-----------|
   
   ## Detailed Analysis
   ### [Section 1]
   [Data table]
   [Insights]
   
   ### [Section 2]
   ...
   
   ## Summary
   [Key takeaways]
   ```

3. **Export Options**
   - Markdown: Direct output
   - Save to file if requested

### Report Types

**Summary (`/qlik-report summary`)**
- Top 5-10 key metrics
- Brief insights (2-3 bullet points)
- Trend indicators

**Detailed (`/qlik-report detailed`)**
- All metrics from visible objects
- Full data tables (first 50 rows)
- Comprehensive analysis
- Recommendations

### Formatting Guidelines

- Use markdown tables for data
- Include selection context
- Add calculated insights
- Keep summary concise
- Use bullet points for insights
- Include data freshness timestamp

### Example Output

```markdown
# Sales Dashboard Report
Generated: 2024-01-15 14:30

## Active Filters
- Region: North America
- Year: 2024

## Key Metrics
| Metric | Value | YoY Change |
|--------|-------|------------|
| Revenue | $12.5M | +15% |
| Orders | 8,432 | +8% |
| Avg Order | $1,483 | +6% |

## Top Products
| Product | Revenue | Units |
|---------|---------|-------|
| Widget A | $2.1M | 1,420 |
| Widget B | $1.8M | 1,105 |

## Insights
1. Revenue up 15% YoY driven by Widget A
2. Average order value increasing steadily
3. North America outperforming other regions

## Recommendations
- Increase Widget A inventory
- Investigate Widget C decline
```

</qlik-report>
