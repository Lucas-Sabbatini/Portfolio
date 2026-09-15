# Hard-ish guard against runaway spend. Alerts by email when actual monthly
# cost exceeds the budget. Set alert_email to enable.

resource "aws_budgets_budget" "monthly" {
  count = var.alert_email == "" ? 0 : 1

  name         = "lucasjanot-static-monthly"
  budget_type  = "COST"
  limit_amount = var.monthly_budget_usd
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.alert_email]
  }
}
