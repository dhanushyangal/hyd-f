# Payments

How Hydrilla charges, grants credits, and limits Slot hours. Displayed prices and how many models a month of credits buys are in [pricing-and-models.md](./pricing-and-models.md).

**Status:** current as of 2026-10-15. Test mode. Product ids live only in `backend/hydrilla_backend/.env.local`.

## Catalog

Four paid plans, monthly only. Free is the account with no entitled subscription.

| Plan id | Shown as | USD / month | Credits / month | Extra limit |
| --- | --- | --- | --- | --- |
| `starter` | Starter | $5 | 900 | none |
| `pro` | Pro | $12 | 3,000 | none |
| `slot` | Slot | $3 | 900 | 1 hour a day, 2 people per hour |
| `slot_pro` | Slot Pro | $8 | 3,000 | 2 hours a day, 4 people per window |

The charged amount is the Dodo product, not a number in the frontend. `lib/pricing.ts` is what the site shows.

Names that are easy to mix up:

| Word | What it is |
| --- | --- |
| Pro | The $12 plan. |
| `DODO_PAYMENT_STUDIO_PRODUCT_ID` | Env key for the Pro product. The key name stayed when the plan was renamed. |
| `creator`, `studio` | Old plan ids. Checkout still accepts them and maps them to Starter and Pro. |
| Model Studio, `/app/studio`, Water quality “studio” | The product. Not a paid plan. |

## Where the code lives

| Piece | Path |
| --- | --- |
| Routes | `backend/hydrilla_backend/src/routes/payments.ts` |
| Slot rules | `backend/hydrilla_backend/src/services/slotAccess.ts`, `slotClock.ts` |
| Env | `backend/hydrilla_backend/src/config.ts` → `dodoPayment`, `slot` |
| SQL already applied | `backend/hydrilla_backend/sql/024_slot_plans.sql` |
| Prices and checkout links | `lib/pricing.ts` |
| Pay | `app/checkout/page.tsx` → Dodo → `app/checkout/success/page.tsx` |
| Billing and hour picker | `app/app/settings/page.tsx`, `components/app/SlotHours.tsx` |
| Sidebar | `components/app/AppSidebar.tsx`, `hooks/useSlotStatus.ts` |
| Generate gate | `threeD.ts`, `codeSculpt.ts`, `routes/v1/developerApi.ts` call `slotGenerationBlock` |

## A payment, from click to credits

1. The site opens `/checkout?plan=starter|pro|slot|slot_pro`. `creator` and `studio` still map to Starter and Pro. `slot-pro` maps to `slot_pro` before the request is sent.
2. `POST /api/payments/create-checkout` with `{ plan, email }`. The signed-in user is required.
3. Dodo `checkoutSessions.create` uses the product id for that plan. Metadata stores `plan`, `user_id`, and `email`. Return URL is `DODO_PAYMENTS_RETURN_URL`, or `{frontend}/checkout/success`.
4. The person pays on Dodo. The return URL is not proof of payment.
5. The success page calls `POST /api/payments/sync` with the payment id or subscription id.
6. Sync loads the payment and subscription from Dodo. It writes credits only when the payment succeeded, the subscription is `active` or `past_due`, and the signed-in user owns the checkout (metadata `user_id`, otherwise the same email).
7. Opening the success page again does not grant again. Sync no-ops when that user already has this subscription id, this plan, and this credit total.

Local webhooks do not reach localhost. On a laptop, sync is what writes the plan and the credits. In production the webhook does the same write. Both paths share `handleSubscriptionActive` and `resetCreditsForNewPaidPeriod`.

Checkout is refused before Dodo in two cases:

| Situation | Response |
| --- | --- |
| Another paid plan is already entitled, and the current plan or the new plan is Slot or Slot Pro | 409. Cancel the current plan first. Only one paid plan can be active. |
| That same Slot or Slot Pro plan is already entitled | 409. This plan is already active. |

Starter and Pro can still be checked out over each other. Free can start any plan.

## Credits

`PLAN_CREDITS` in `payments.ts`: Starter 900, Pro 3,000, Slot 900, Slot Pro 3,000, Free 100.

| Event | `user_credits` |
| --- | --- |
| First successful payment, via sync | `plan` set, `credits_total` set to the allotment, `credits_used` reset to 0, `subscription_id` and `reset_at` stored. |
| `subscription.renewed` | Same allotment, `credits_used` reset to 0. |
| `GET /api/payments/credits` and the row is missing | Creates the paid row if a subscription is entitled, otherwise a free row of 100. |
| Slot row still says free, or the plan label is wrong, while a Slot subscription is entitled | Sets the plan. If the total is still 100, raises it to 900 or 3,000. Does not reset `credits_used`. |
| Starter or Pro row still on the free 100 | Same backfill, for Starter and Pro only. |
| `on_hold`, `paused`, or `failed` | Clears `plan`. Leaves `credits_total` and `credits_used` as they are. |
| `cancelled` or `expired` | `endPaidAccess`: total 100, used 0, plan cleared, subscription and reset cleared. |
| `past_due` | Access stays. Credits are not cut. |

`GET /api/payments/credits` returns `plan` from the entitled subscription (product id), not from a stale label on the credits row.

Generation credit costs are unchanged. Slot does not get a cheaper generate. See [pricing-and-models.md](./pricing-and-models.md).

## Who is entitled

A subscription entitles the account when `status` is `active` or `past_due` and `product_id` matches the env product for that plan.

`on_hold` and `paused` do not entitle. `past_due` does, until it becomes `on_hold` or is cancelled.

`user_subscriptions.plan` may still say `creator` or `studio` on old rows. Entitlement uses the product id. If a write of `starter` or `pro` hits the old check constraint, the row is saved as `creator` or `studio`. Slot has no legacy name. Migration `024_slot_plans.sql` is already applied, so `slot` and `slot_pro` are allowed on `user_subscriptions.plan`.

## Slot hours

One UTC hour is one worldwide slot. The picker shows that hour in the viewer’s timezone. New York 1:00–2:00 PM in October (UTC−4) is 17:00 UTC, which is 10:30–11:30 PM in India. Winter changes the New York label. The stored hour stays 17.

| Plan | Window | Seats | Seat pool |
| --- | --- | --- | --- |
| Slot | 1 hour, any start 0–23 | 2 | `slot` only |
| Slot Pro | 2 hours, may wrap past midnight (23 and 0) | 4 | `slot_pro` only |

A Slot booking does not use a Slot Pro seat, and the reverse.

`slot_bookings` is one row per person: plan, timezone, UTC `start_hour`, `duration_hours` (1 or 2), and `changed_on`.

`slot_hours` is the seat list: one row per hour that person holds. The count for “is this hour full?” is `slot_hours` rows with that hour and that plan, excluding the person booking. `set_slot` locks hours with `pg_advisory_xact_lock` so two bookings cannot pass the count together.

The first save leaves `changed_on` null. It is not a change. A later save sets `changed_on` to that UTC day and is allowed once per UTC week (Monday). The next change is the following Monday. The Billing screen says this before the confirm dialog. Confirm is what writes the hour.

Cancelling, expiring, holding, or failing a Slot subscription deletes that person’s `slot_hours` and `slot_bookings`.

## Generation

`slotGenerationBlock` runs only for an entitled Slot or Slot Pro product. Free, Starter, and Pro return immediately and are not limited by the hour.

The check is before credits are deducted. A closed hour does not charge, so the workspace says the credits were not used. It does not say they were refunded.

| State | Result |
| --- | --- |
| Not a Slot product | Generate proceeds. |
| Subscription read fails | Treated as not a Slot user. Generate proceeds. |
| Slot user, booking table missing | 403. Hour booking is not available yet. |
| Slot user, no hour chosen | 403. Choose the hour in Settings, under Billing. |
| Outside the UTC window | 403. The message names the local hour and the local time now. |
| Inside the window | Generate proceeds, then the normal credit charge. |

The workspace submit button is also disabled outside the window, or before an hour is chosen. The server check is the one that holds. Other workspace controls stay usable. A job already running is not stopped when the hour ends.

Image, image-to-3D, text-to-image, image edit, Water generate, and Water chat are gated. The developer API returns `{ error: { message, type: "slot_closed", code } }`.

## Webhooks

`POST /api/payments/webhook/dodo`. Signature is verified with `DODO_PAYMENT_WEBHOOK_SECRET`. `SKIP_WEBHOOK_VERIFICATION=true` is ignored in production.

`webhook_events.webhook_id` makes a replay a no-op. The handler runs before the 200 response. A handler error is logged and still returns 200, so Dodo does not retry that delivery.

| Event | Effect |
| --- | --- |
| `subscription.active`, `subscription.plan_changed` | Store the subscription. Grant the allotment when the plan is known. Does not reset `credits_used` by itself. Sync does the reset for a new period. |
| `subscription.renewed` | Reset `credits_used` to 0 at the same total. |
| `subscription.cancelled`, `subscription.expired` | End paid access. Release the slot if the plan is Slot. A cancel that is still `active` and scheduled for the next bill only marks the schedule. |
| `subscription.on_hold`, `subscription.paused` | Clear the plan label. Release the slot. Leave the credit total. |
| `subscription.failed` | Same as on hold. |
| `subscription.past_due` | Store the status. Access stays. |
| `subscription.updated`, `subscription.unpaused` | Refresh the stored subscription. |
| `payment.succeeded` | Record `subscription_payments`. If no active subscription row exists yet, load the subscription from Dodo and run the same grant as `subscription.active`. |
| `payment.failed` | Record the payment as `failed`. Does not change the plan, the credits, or the hour. |
| `refund.succeeded`, `payment.refunded` | Mark that payment `refunded`. The row stays. |
| `credit.added` | Add the credit amount onto the existing total. |

## Tables

Leave these tables and their existing rows in place.

| Table | Role |
| --- | --- |
| `user_subscriptions` | One Dodo subscription. Status, product id, plan, period end. |
| `user_credits` | One balance per user. `credits_total`, `credits_used`, `plan`. |
| `subscription_payments` | One row per Dodo payment. Status `succeeded`, `failed`, or `refunded`. |
| `webhook_events` | Processed webhook ids. |
| `slot_bookings` | The hour that person chose. |
| `slot_hours` | Seats. Primary key `(hour, user_id)`. |

## Env

In `backend/hydrilla_backend/.env.local` only. Do not put product ids in `.env.example`.

| Key | Use |
| --- | --- |
| `DODO_PAYMENT_API_KEY` | Dodo API. |
| `DODO_PAYMENT_MODE` | `test` or `live`. Default `test`. |
| `DODO_PAYMENT_WEBHOOK_SECRET` | Webhook signature. |
| `DODO_PAYMENTS_RETURN_URL` | Where Dodo sends the browser after pay. |
| `DODO_PAYMENT_STARTER_PRODUCT_ID` | Starter product. |
| `DODO_PAYMENT_STUDIO_PRODUCT_ID` | Pro product. |
| `DODO_PAYMENT_SLOT_PRODUCT_ID` | Slot product. |
| `DODO_PAYMENT_SLOT_PRO_PRODUCT_ID` | Slot Pro product. |

Seat counts are code: `config.slot.seats` is 2, `config.slot.proSeats` is 4. They are not env vars.

## Edges that are still true

- A failed subscription read skips the Slot hour check for that request.
- `on_hold` and `failed` clear the plan label and the hour, and leave the credit total until cancel or expiry. Starter and Pro do the same with the credit total.
- Starter and Pro can replace each other at checkout. Slot cannot replace another paid plan, and another paid plan cannot replace Slot, until the current one is cancelled.
- The success page is what grants credits on localhost. A webhook to production does not update a local database.
