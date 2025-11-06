# AML Rule Conditions Reference Guide

## 📋 Complete Keyword Reference by Rule Type

This document lists all condition keywords used by each AML rule evaluator in the system.

---

## 1. THRESHOLD Rule (`ThresholdRuleEvaluator`)

**Purpose:** Detects transactions based on amount thresholds and account behavior patterns.

### Basic Threshold Keywords

| Keyword | Type | Required | Description | Example |
|---------|------|----------|-------------|---------|
| `amountThreshold` | BigDecimal | Yes* | Simple threshold amount | `100000` |
| `minAmount` | BigDecimal | Yes* | Minimum amount for range-based rules | `9000` |
| `maxAmount` | BigDecimal | Yes* | Maximum amount for range-based rules | `10000` |
| `currency` | String | No | Currency code (defaults to "ANY") | `"INR"`, `"USD"`, `"ANY"` |
| `transactionType` | String | No | Filter by transaction type | `"TRANSFER"`, `"DEPOSIT"`, `"WITHDRAWAL"` |

**Note:** Either `amountThreshold` OR (`minAmount` + `maxAmount`) is required.

### Advanced Threshold Keywords

| Keyword | Type | Required | Description | Example |
|---------|------|----------|-------------|---------|
| `amountToBalanceRatio` | BigDecimal | No | Trigger if amount exceeds % of balance | `0.8` (80% of balance) |
| `historicalDays` | Integer | No | Days to look back for average calculation | `30` |
| `deviationFactor` | BigDecimal | No | Multiplier for historical average | `3.0` (3x average) |

### Example Conditions

**Simple Threshold:**
```json
{
  "amountThreshold": 100000,
  "currency": "INR"
}
```

**Range-Based (Structuring Detection):**
```json
{
  "minAmount": 9000,
  "maxAmount": 10000,
  "currency": "ANY"
}
```

**Advanced - Balance Ratio:**
```json
{
  "amountThreshold": 50000,
  "amountToBalanceRatio": 0.8
}
```

**Advanced - Historical Deviation:**
```json
{
  "amountThreshold": 50000,
  "historicalDays": 30,
  "deviationFactor": 3.0
}
```

---

## 2. GEOGRAPHIC Rule (`GeographicRuleEvaluator`)

**Purpose:** Detects transactions involving high-risk countries based on sender/receiver location.

### Geographic Keywords

| Keyword | Type | Required | Description | Example |
|---------|------|----------|-------------|---------|
| `highRiskAmountThreshold` | BigDecimal | No | Amount threshold for HIGH risk countries | `50000` (default) |
| `mediumRiskAmountThreshold` | BigDecimal | No | Amount threshold for MEDIUM risk countries | `500000` (default) |

### Risk Level Behavior

| Risk Level | Behavior | Amount Check |
|------------|----------|--------------|
| **CRITICAL** | Block ALL transactions | No amount check |
| **HIGH** | Flag if amount >= `highRiskAmountThreshold` | Yes |
| **MEDIUM** | Flag if amount >= `mediumRiskAmountThreshold` | Yes |
| **LOW** | Ignore | N/A |

### Example Conditions

**Default Thresholds:**
```json
{
  "highRiskAmountThreshold": 50000,
  "mediumRiskAmountThreshold": 500000
}
```

**Custom Thresholds:**
```json
{
  "highRiskAmountThreshold": 25000,
  "mediumRiskAmountThreshold": 250000
}
```

**Note:** This rule checks BOTH `countryCode` (sender) and `counterpartyCountryCode` (receiver) fields in the transaction.

---

## 3. FREQUENCY Rule (`FrequencyRuleEvaluator`)

**Purpose:** Detects rapid succession of transactions within a time window.

### Basic Frequency Keywords

| Keyword | Type | Required | Description | Example |
|---------|------|----------|-------------|---------|
| `maxTransactions` | Integer | Yes | Maximum allowed transactions in window | `5` |
| `timeWindowMinutes` | Integer | Yes | Time window in minutes | `30` |

### Advanced Frequency Keywords

| Keyword | Type | Required | Description | Example |
|---------|------|----------|-------------|---------|
| `dormantDays` | Integer | No | Days of inactivity before flagging | `90` |
| `minAmount` | BigDecimal | No | Minimum amount for dormant account check | `50000` |

### Example Conditions

**Rapid Withdrawals:**
```json
{
  "maxTransactions": 5,
  "timeWindowMinutes": 30
}
```

**High Transaction Velocity:**
```json
{
  "maxTransactions": 10,
  "timeWindowMinutes": 1440
}
```

**Dormant Account Activation:**
```json
{
  "maxTransactions": 3,
  "timeWindowMinutes": 60,
  "dormantDays": 90,
  "minAmount": 50000
}
```

---

## 4. VELOCITY Rule (`VelocityRuleEvaluator`)

**Purpose:** Detects rapid movement of funds with specific patterns.

### Velocity Keywords

| Keyword | Type | Required | Description | Example |
|---------|------|----------|-------------|---------|
| `timeWindowMinutes` | Integer | Yes | Time window for velocity check | `1440` (24 hours) |
| `minAmount` | BigDecimal | Yes | Minimum transaction amount to consider | `10000` |
| `maxTransactions` | Integer | Yes | Maximum allowed transactions | `5` |
| `checkAlternation` | Boolean | No | Check for alternating credit/debit pattern | `true` |

### Example Conditions

**Basic Velocity:**
```json
{
  "timeWindowMinutes": 1440,
  "minAmount": 10000,
  "maxTransactions": 5
}
```

**Rapid Currency Cycling:**
```json
{
  "timeWindowMinutes": 1440,
  "minAmount": 50000,
  "maxTransactions": 3
}
```

**Alternating Pattern Detection:**
```json
{
  "timeWindowMinutes": 1440,
  "minAmount": 10000,
  "maxTransactions": 5,
  "checkAlternation": true
}
```

---

## 5. PATTERN Rule (`PatternRuleEvaluator`)

**Purpose:** Detects specific patterns using regex matching on transaction fields.

### Pattern Keywords

| Keyword | Type | Required | Description | Example |
|---------|------|----------|-------------|---------|
| `regex` | String | Yes | Regular expression pattern | `".*round.*trip.*"` |
| `field` | String | No | Field to match (defaults to "description") | `"description"`, `"amount"` |

### Example Conditions

**Description Pattern:**
```json
{
  "regex": ".*round.*trip.*",
  "field": "description"
}
```

**Amount Pattern:**
```json
{
  "regex": "^9[0-9]{3}$",
  "field": "amount"
}
```

**Smurfing Pattern:**
```json
{
  "regex": ".*(split|divide|multiple).*",
  "field": "description"
}
```

---

## 6. KEYWORD Rule (`KeywordRuleEvaluator`)

**Purpose:** Detects suspicious keywords in transaction descriptions using database-stored keywords.

### Keyword Keywords

**No JSON conditions required!** This rule uses the `suspicious_keywords` database table.

### How It Works

1. Fetches all active keywords from `suspicious_keywords` table
2. Normalizes transaction description (removes punctuation, lowercase)
3. Matches keywords with severity scoring
4. Scales risk based on:
   - Maximum keyword severity (1-10)
   - Number of matches (bonus for multiple matches)
   - Rule's configured `riskScoreImpact`

### Keyword Severity Scoring

| Match Count | Severity Boost |
|-------------|----------------|
| 1 match | Base severity |
| 2 matches | +5 points |
| 3+ matches | +10 points |

### Example Database Keywords

```sql
INSERT INTO suspicious_keywords (word, severity, category, is_active) VALUES
('hawala', 10, 'MONEY_LAUNDERING', 1),
('layering', 9, 'MONEY_LAUNDERING', 1),
('shell company', 8, 'CORPORATE_STRUCTURE', 1),
('offshore', 7, 'TAX_HAVEN', 1),
('cash', 6, 'SUSPICIOUS_BEHAVIOR', 1);
```

**No JSON conditions needed - fully database-driven!**

---

## 7. FUNNEL_ACCOUNT Rule (`FunnelAccountRuleEvaluator`)

**Purpose:** Detects funnel accounts (many senders to one receiver - fan-in pattern).

### Funnel Keywords

| Keyword | Type | Required | Description | Example |
|---------|------|----------|-------------|---------|
| `minSenders` | Integer | Yes | Minimum unique senders to trigger | `5` |
| `timeWindowMinutes` | Integer | Yes | Time window for counting senders | `60` |

### Example Conditions

**Fan-In Detection:**
```json
{
  "minSenders": 5,
  "timeWindowMinutes": 60
}
```

**Aggressive Fan-In:**
```json
{
  "minSenders": 10,
  "timeWindowMinutes": 1440
}
```

---

## 📊 Quick Reference Table

| Rule Type | Primary Keywords | Optional Keywords | Database Driven |
|-----------|------------------|-------------------|-----------------|
| **THRESHOLD** | `amountThreshold` OR `minAmount`+`maxAmount` | `currency`, `transactionType`, `amountToBalanceRatio`, `historicalDays`, `deviationFactor` | No |
| **GEOGRAPHIC** | None (uses `risky_countries` table) | `highRiskAmountThreshold`, `mediumRiskAmountThreshold` | Yes |
| **FREQUENCY** | `maxTransactions`, `timeWindowMinutes` | `dormantDays`, `minAmount` | No |
| **VELOCITY** | `timeWindowMinutes`, `minAmount`, `maxTransactions` | `checkAlternation` | No |
| **PATTERN** | `regex` | `field` | No |
| **KEYWORD** | None (uses `suspicious_keywords` table) | None | Yes |
| **FUNNEL_ACCOUNT** | `minSenders`, `timeWindowMinutes` | None | No |

---

## 🎯 Rule Configuration Examples

### Example 1: High Value Transaction Rule
```json
{
  "name": "High Value Transaction - Savings Account",
  "type": "THRESHOLD",
  "conditions": {
    "amountThreshold": 100000,
    "currency": "INR",
    "accountType": "SAVING"
  },
  "riskScoreImpact": 75
}
```

### Example 2: Structuring Detection Rule
```json
{
  "name": "Structuring Detection",
  "type": "THRESHOLD",
  "conditions": {
    "minAmount": 9000,
    "maxAmount": 10000,
    "currency": "ANY"
  },
  "riskScoreImpact": 60
}
```

### Example 3: Critical Country Block
```json
{
  "name": "Critical Country Block - Iran",
  "type": "GEOGRAPHIC",
  "conditions": {
    "highRiskAmountThreshold": 0,
    "mediumRiskAmountThreshold": 0
  },
  "riskScoreImpact": 90
}
```

### Example 4: Rapid Withdrawals
```json
{
  "name": "Rapid Withdrawals",
  "type": "FREQUENCY",
  "conditions": {
    "maxTransactions": 5,
    "timeWindowMinutes": 30
  },
  "riskScoreImpact": 65
}
```

### Example 5: Rapid Currency Cycling
```json
{
  "name": "Rapid Currency Cycling",
  "type": "VELOCITY",
  "conditions": {
    "timeWindowMinutes": 1440,
    "minAmount": 50000,
    "maxTransactions": 3
  },
  "riskScoreImpact": 70
}
```

### Example 6: Smurfing Pattern
```json
{
  "name": "Smurfing Pattern",
  "type": "PATTERN",
  "conditions": {
    "regex": ".*(split|divide|multiple|smurf).*",
    "field": "description"
  },
  "riskScoreImpact": 80
}
```

### Example 7: Suspicious Keywords
```json
{
  "name": "Suspicious Keywords",
  "type": "KEYWORD",
  "conditions": {},
  "riskScoreImpact": 75
}
```
**Note:** Keywords are managed in `suspicious_keywords` table, not in JSON conditions.

### Example 8: Fan-Out Pattern
```json
{
  "name": "Fan-Out Pattern",
  "type": "FUNNEL_ACCOUNT",
  "conditions": {
    "minSenders": 5,
    "timeWindowMinutes": 60
  },
  "riskScoreImpact": 70
}
```

---

## 🔧 Advanced Configuration Patterns

### Combining Multiple Conditions

**High Value + Historical Deviation:**
```json
{
  "amountThreshold": 100000,
  "currency": "INR",
  "historicalDays": 30,
  "deviationFactor": 3.0
}
```

**Frequency + Dormant Account:**
```json
{
  "maxTransactions": 3,
  "timeWindowMinutes": 60,
  "dormantDays": 90,
  "minAmount": 50000
}
```

**Velocity + Alternation Check:**
```json
{
  "timeWindowMinutes": 1440,
  "minAmount": 10000,
  "maxTransactions": 5,
  "checkAlternation": true
}
```

---

## 📝 Implementation Notes

### Data Types
- **BigDecimal**: Used for monetary amounts (supports decimal precision)
- **Integer**: Used for counts, time windows, days
- **String**: Used for currency codes, regex patterns, field names
- **Boolean**: Used for flags like `checkAlternation`

### Default Values
- Most keywords have no defaults - missing required keywords cause rule to be skipped
- `currency`: Defaults to "ANY" (applies to all currencies)
- `field`: Defaults to "description" for PATTERN rules
- Geographic thresholds: Default to 50000 (HIGH) and 500000 (MEDIUM)

### Case Sensitivity
- Currency codes: Case-insensitive (`"INR"` = `"inr"`)
- Transaction types: Case-insensitive
- Regex patterns: Case-insensitive by default
- Keywords: Case-insensitive with normalization

### Validation
- Missing required keywords → Rule skipped with warning log
- Invalid data types → Rule skipped with error log
- Null/empty values → Treated as missing

---

## 🚀 Testing Your Rules

### Test Rule Configuration
```bash
# Create a rule via API
POST /api/admin/rules
{
  "name": "Test High Value",
  "type": "THRESHOLD",
  "conditions": "{\"amountThreshold\":50000,\"currency\":\"INR\"}",
  "riskScoreImpact": 70,
  "isActive": true
}
```

### Test Transaction
```bash
# Create a transaction that should trigger the rule
POST /api/transactions/transfer
{
  "senderAccountId": 1,
  "receiverAccountNumber": "200000000002",
  "amount": 75000,
  "currency": "INR",
  "description": "Test transfer",
  "countryCode": "IN"
}
```

### Check Logs
```
💰 THRESHOLD RULE EVALUATION - Rule: Test High Value
💰 Rule conditions: {amountThreshold=50000, currency=INR}
💰 Parsed threshold: 50000 INR
💰 Transaction amount: 75000 INR
⚠️ THRESHOLD RULE TRIGGERED: Test High Value | 75000 INR >= 50000 (currency: INR)
```

---

## 📚 Related Documentation

- **Rule Engine Architecture**: See `BACKEND_REVIEW_GUIDE.md`
- **API Endpoints**: See API documentation
- **Database Schema**: See `rules`, `risky_countries`, `suspicious_keywords` tables
- **Risk Scoring**: See `RuleEngineServiceImpl.java`

---

**Last Updated:** November 6, 2025  
**Version:** 1.0  
**Maintainer:** AML Development Team
