# Error Budgets

## The idea, in plain language

If your SLO says "99.5% of checkout requests must complete in under
500ms," you've just admitted that **0.5% of requests are allowed to be
slow or fail** without anyone breaking their promise to anyone else. That
0.5% is your **error budget** -- a spendable allowance, not a target to
avoid entirely.

Why treat it as spendable rather than "zero is the goal"? Because it turns
a vague argument ("is it safe to ship this risky change?") into a number
both engineering and product can agree on ahead of time:

- **Budget remaining** -> ship fast, take risks, deploy on Fridays, try the
  experimental caching layer.
- **Budget nearly exhausted** -> freeze risky changes, prioritize
  reliability work over new features, until the budget resets.

This is the mechanism that stops "reliability" from being an abstract
value everyone agrees with but no one acts on -- it converts into a
concrete gate with a number attached.

## Worked example: ecommerce checkout

From `docs/slo-sla-sli.md`:

> 99.5% of checkout requests complete in under 500ms, over a rolling 30 days.

**Step 1 -- convert the SLO into an error budget.**

```
error budget = 100% - SLO = 100% - 99.5% = 0.5%
```

**Step 2 -- apply it to actual traffic.**

Say ecommerce's `POST /api/checkout` handled 50,000 requests over the last
30 days (a number you'd pull from
`sum:trace.express.request.hits{service:ecommerce-backend,resource:POST /api/checkout}.as_count()`
in Datadog).

```
allowed bad requests = 50,000 x 0.5% = 250 requests
```

That's the whole budget for the 30-day window: 250 checkout requests are
allowed to be slow (>500ms) or error out before the SLO is breached.

**Step 3 -- track what's actually been spent.**

Suppose this month so far, 90 checkout requests have exceeded 500ms or
returned a 5xx.

```
budget consumed = 90 / 250 = 36%
budget remaining = 250 - 90 = 160 requests (64%)
```

At 36% consumed with (say) 12 days left in the 30-day window, the team is
burning budget slower than the window is closing -- comfortable, no action
needed.

**Step 4 -- what if the burn rate spikes?**

If a bad deploy causes 40 slow/failed checkouts in a single hour, that's
40/250 = 16% of the *entire month's* budget gone in one hour. This is
exactly what a **burn-rate alert** watches for (see
`datadog/monitors/high-latency-p95.json` and `high-error-rate.json`): it's
not just "are we over the SLO right now," it's "are we consuming budget so
fast that we'll blow through it long before the window resets."

## Time-based framing (useful for availability SLOs)

For an availability-style SLO like banking's "99.9% of transfer requests
succeed, over a rolling 30 days," you can express the same budget as
*downtime* instead of *request count*:

```
30 days = 43,200 minutes
error budget = 43,200 x 0.1% = 43.2 minutes of allowed full-failure time per month
```

If a single incident causes a 20-minute total outage of the transfer
endpoint, that incident alone burns 20/43.2 = 46% of the entire month's
downtime budget -- a good prompt for a postmortem even if the SLA (looser
than the SLO) was never technically breached.

## Using this in the lab

When you work through `docs/incident-scenarios/`, note for each incident:

1. Which SLO did it threaten or breach?
2. Roughly how much error budget did it consume (use the request-count or
   downtime-minutes method above -- exact precision doesn't matter, the
   habit of asking the question does)?
3. Does the remaining budget change what you'd prioritize next sprint?
