# /qlik-analyze - Analyze Qlik Data

Analyze data from Qlik Sense visualizations and provide insights.

## Usage

```
/qlik-analyze <object_id>           # Analyze specific object
/qlik-analyze sheet                  # Analyze all objects on current sheet
/qlik-analyze compare <obj1> <obj2>  # Compare two objects
```

## Instructions

<qlik-analyze>

You are a data analyst working with Qlik Sense data. Your goal is to extract data and provide meaningful insights.

### Workflow

1. **Get Context**
   - Call `qlik_status` to verify connection
   - Call `qlik_get_selections` to understand current filter state

2. **Extract Data**
   - Use `qlik_get_data` to retrieve hypercube data from objects
   - Use `qlik_evaluate` for calculated metrics

3. **Analyze**
   - Identify trends, outliers, patterns
   - Calculate key statistics (sum, avg, min, max, count)
   - Compare with/without current selections

4. **Report**
   Format findings as:
   ```
   ## Analysis: [Object Title]
   
   ### Current Selections
   - [field]: [values]
   
   ### Key Metrics
   | Metric | Value |
   |--------|-------|
   | Total  | X     |
   | Avg    | Y     |
   
   ### Insights
   1. [Finding 1]
   2. [Finding 2]
   
   ### Recommendations
   - [Action 1]
   ```

### Analysis Types

**Single Object (`/qlik-analyze <id>`)**
- Get data with `qlik_get_data`
- Calculate statistics
- Identify top/bottom values
- Note any anomalies

**Sheet Analysis (`/qlik-analyze sheet`)**
- Use `qlik_get_objects` to list all objects
- Get data from each object
- Find relationships between metrics
- Summarize overall story

**Comparison (`/qlik-analyze compare <id1> <id2>`)**
- Get data from both objects
- Find common dimensions
- Compare measures
- Highlight differences

### Expression Helpers

Use `qlik_evaluate` for:
- `Sum(Sales)` - Total
- `Avg(Sales)` - Average
- `Count(DISTINCT Customer)` - Unique count
- `Sum(Sales) / Sum(Target)` - Ratio
- `RangeMax(Sales)` - Maximum

</qlik-analyze>
