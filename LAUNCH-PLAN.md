# Vendkom — Launch Plan & Marketing Campaign

Capital: **15,000 JOD** · Market: Amman, Jordan · Model: two-sided marketplace
(event organizers ↔ vetted vendors) · Revenue: subscription + commission

---

## Read this first: the one thing that decides everything

Vendkom is a **two-sided marketplace**, and that changes what "launch" means.

An organizer arriving to an empty vendor list leaves and never comes back. A
vendor who joins and gets no bookings churns in a month and tells other vendors
it didn't work. **You only get one first impression with each side**, and the
sides depend on each other.

So the sequence is not negotiable:

> **Supply first. Demand second. Never both at once.**

Get 15–20 genuinely good vendors listed with real photos and real prices
*before* you spend a single dinar driving organizers to the site. Every dinar
of demand-side marketing spent before that point is wasted — worse than
wasted, because it burns your first impression.

This is why the budget below front-loads vendor acquisition and holds most of
the ad spend until month 2–3.

### On "all out, all in"

I'd push back on this one, and here's the honest reason.

Marketplaces don't fail from underspending on marketing. They fail from
running out of cash before the two sides reach critical mass — which for a
local marketplace typically takes **6–12 months**, not 6–12 weeks. If you put
12,000 JOD into a launch campaign and it works, you'll have demand you can't
service and no cash to fix it. If it half-works, you're dead at month four
with no second attempt.

The plan below spends **~4,800 JOD (32%)** on marketing — which is aggressive
for a business at this stage — and deliberately holds **6,000 JOD (40%)** as
runway. That reserve *is* the strategy. It buys you a second and third attempt
at the campaign, and attempt two is always better than attempt one because it
has real data behind it.

---

# PART 1 — LAUNCH CHECKLIST

## Phase 0 — Legal & financial foundation
*Do this first. Nothing else is real until this exists.*

- [ ] **Register the business.** A sole proprietorship (individual
      establishment) with the Ministry of Industry, Trade & Supply is the fast
      path — registration is reportedly around **JD 5 for a first-time
      registration** and can be done via the ministry's e-portal. Submit three
      candidate names.
      → **Decide first: sole proprietorship vs LLC.** A sole prop is cheap and
      fast but carries **unlimited personal liability** — no separation between
      business and personal assets. For a business that handles other people's
      deposits and sits between two parties in a contract, that's real
      exposure. **Talk to a Jordanian lawyer or accountant before choosing.**
      With two co-founders, an LLC is usually the right answer anyway.
- [ ] **Get a Tax Identification Number (TIN).**
- [ ] **Understand your tax position.** Income tax runs roughly 5–30% by
      bracket. VAT registration becomes mandatory above **100,000 JOD annual
      turnover** — you won't hit that in year one, but know where the line is.
- [ ] **Open a business bank account.** Separate from personal, from day one.
      Do not run customer deposits through a personal account.
- [ ] **Co-founder agreement, in writing.** Equity split, roles, what happens
      if one of you leaves, who decides what. Do this while you still like each
      other. This is the single most-skipped and most-regretted item on any
      startup checklist.
- [ ] **Verify the numbers above with a local accountant.** Fees and thresholds
      change; treat everything here as a starting point, not gospel.

## Phase 1 — Make the machine actually work
*These are known-broken right now. Fix before any launch.*

- [ ] **🔴 Netlify deploys are paused** (account out of plan credits). The live
      site at vendkom.com is frozen on an old version — none of the last two
      weeks of work is public. Resolve billing or upgrade, then verify
      vendkom.com actually serves the current site.
- [ ] **🔴 Airtable automation is broken.** The Netlify → Airtable field
      mapping was never redone after we found the real payload shape. Right now
      form submissions land with only "Status" populated. **Test it end to end:
      submit both forms, confirm every field arrives.** If leads silently
      vanish on launch day, nothing else matters.
- [ ] **Decide how you actually collect money.** This is the biggest unresolved
      product question. You need to choose:
      - **Payment gateway** — HyperPay, PayTabs, Tap, MyFatoorah and Amazon
        Payment Services all operate in Jordan. Expect **~2.5–3.5% transaction
        fee plus a gateway fee**. Note this eats directly into your 6–15%
        commission — on the Pro tier's 6%, a 3% processing fee is *half your
        margin*.
      - **Local wallets** — Zain Cash, Orange Money, eFAWATEERcom are widely
        used in Jordan and worth supporting.
      - **Or launch manually.** Honestly the right call for the first ~20
        bookings: take deposits by bank transfer or wallet, invoice manually,
        reconcile in Airtable. Don't build payments infrastructure before you
        have proof anyone will book.
- [ ] **Write the vetting process down.** You promise on every page that
      vendors are "reviewed by our team." Define exactly what that means: what
      you check, what disqualifies, who decides, how long it takes. A
      one-page internal checklist is enough — but it must exist, because it's
      the core of your value proposition.
- [ ] **Replace the placeholder vendor photos.** The site currently shows
      stock/random images for Golden Hour Studio, The Copper Cart, etc. These
      must be real vendors before launch — showing fake listings to a real
      vendor is a credibility problem you don't recover from.
- [ ] **Legal pages reviewed by a lawyer.** Privacy Policy, Terms, and Vendor
      Agreement are drafted and live, but they were written by me, not by a
      Jordanian lawyer. Get them reviewed — especially the Vendor Agreement,
      since it governs money.
- [ ] **Test the whole funnel yourself.** Fill in both forms as a stranger
      would. Does the email arrive? Does Airtable populate? Does someone reply?

## Phase 2 — Supply: get 15–20 vendors live
*Target: 8 weeks. This is the whole ballgame.*

- [ ] **Build a target list of 60–80 vendors** across your four categories in
      Amman. Source from Instagram hashtags (#weddingjordan, #عرس_اردني,
      #cateringamman), wedding Facebook groups, venue partner lists, and
      Google Maps.
- [ ] **Rank them.** Tier A = strong work, weak online presence (your ideal —
      they need you most). Tier B = strong work, strong presence (harder, but
      they're your credibility anchors). Tier C = everyone else.
- [ ] **Found­ing Vendor offer.** Make it genuinely worth saying yes to:
      - Free professional photo/video shoot of their work (see budget)
      - Free listing setup — you write the copy, you pick the photos
      - Commission locked at the founding rate for 12 months
      - "Founding Vendor" badge on their listing
      Cap it at **20 vendors** and say so. Scarcity is doing real work here.
- [ ] **Founder-led outreach.** You and Khaled personally. Not email — DM and
      WhatsApp, then meet in person. Target 10 conversations per week each.
      This is unglamorous and it is the highest-ROI activity available to you.
- [ ] **Get 3 anchor vendors first.** One genuinely well-known name in each of
      catering and photography changes every subsequent conversation. Offer
      them more (0% commission for 6 months) if that's what it takes — their
      logo on your site is worth more than the commission.
- [ ] **Onboard properly.** Use the five-step flow already on the site. Track
      each vendor's stage in Airtable.

## Phase 3 — Demand: organizers
*Start only when 15+ vendors are live with real content.*

- [ ] **Define your first beachhead precisely.** Don't launch to "everyone
      planning an event." Pick one: **engaged couples in Amman planning a
      wedding in the next 6 months** is the obvious choice — highest value,
      highest urgency, most active online, and it's the segment where "I don't
      know who to trust" is most painful.
- [ ] **Build the content library before you advertise.** 20–30 pieces:
      vendor spotlights, real event footage, "how much does a wedding in Amman
      actually cost" style posts. Advertising into an empty Instagram profile
      converts badly.
- [ ] **Soft launch to a warm list.** Friends, family, both founders' networks.
      Get your first 5 real bookings from people who already trust you, and
      use them to find the breaks in your process.
- [ ] **Then, and only then, turn on paid.**

## Phase 4 — Operations you'll need on day one

- [ ] **A shared inbox** that both founders monitor (hello@ or bookings@).
- [ ] **Response time commitment.** You promise organizers a shortlist in 48h
      and ask vendors to reply within 24h. Make sure *you* can hit 48h.
- [ ] **A simple CRM.** Airtable is fine — one table for vendors, one for
      organizer requests, one for bookings.
- [ ] **Contract templates** for organizer↔vendor bookings.
- [ ] **A refund / cancellation policy** you've actually thought through.
- [ ] **Know your numbers.** Track from day one: vendors listed, organizer
      requests, requests→shortlist, shortlist→booking, average booking value,
      commission earned. Without these you're flying blind.

---

# PART 2 — MARKETING CAMPAIGN

## Budget allocation — 15,000 JOD

| Bucket | JOD | % | Notes |
|---|---:|---:|---|
| Legal, registration, accounting | 1,200 | 8% | Registration, lawyer review of contracts, first-year accountant |
| Tools & infrastructure (12 mo) | 900 | 6% | Hosting, Airtable, Google Workspace, scheduling, design tools |
| **Content production** | **2,400** | **16%** | The founding-vendor shoots — your single best spend |
| **Paid marketing** | **2,400** | **16%** | Meta/Instagram, Google Search, influencers |
| Launch event | 700 | 5% | See below |
| Contingency | 400 | 3% | Something always breaks |
| **Operating reserve / runway** | **7,000** | **47%** | **Do not touch. This is your second attempt.** |
| **Total** | **15,000** | **100%** | |

Marketing + content together = **4,800 JOD (32%)**, which is genuinely
aggressive for a pre-revenue local marketplace. The reserve is what lets you
survive being wrong about something — and you will be wrong about something.

---

## The campaign: "Founding 20"

**The core idea:** don't market a marketplace — nobody cares about a
marketplace. Market **the vendors**. Every piece of content is a real Jordanian
small business getting made to look world-class. Vendkom is the thing that
made it happen.

This works because it solves both sides at once. Vendors want the exposure
(so they join). Organizers want to see beautiful vendors (so they come). And
it's honest — it's literally what your product does.

### Phase A — Weeks 1–8: Supply. Budget 2,400 JOD

**The Founding Vendor content days** — this is the campaign, not a support to it.

- Book a photographer and videographer for **6 shoot days** (~350–400 JOD/day
  all-in). Ironically, hire them *from your own vendor pipeline* — it's their
  audition and your content in one.
- Shoot **3 founding vendors per day** → ~18 vendors covered.
- Each vendor gets: 15–20 edited stills + one 30-second vertical video.
- **You keep full usage rights.** This is the deal: they get a free
  professional shoot, you get a content library that fuels the next six months.

**Why this is the best 2,400 JOD you'll spend:**
1. It's the offer that gets vendors to say yes (worth 300–500 JOD to them)
2. It produces every asset you need for Phase B and C
3. It makes your site look like an established brand, not a startup
4. It creates real relationships, not transactions

**Also in Phase A (free):**
- Founder DM/WhatsApp outreach — 20 conversations/week combined
- A "Vendkom Founding Vendors" WhatsApp group — let them meet each other; it
  creates commitment and they refer each other
- Post every shoot to Instagram as you go — builds the profile before launch

### Phase B — Weeks 6–12: Content engine. Budget ~300 JOD

Instagram and TikTok are where the Jordanian event market lives. Go all-in on
short vertical video.

**Post 5×/week, rotating:**
1. **Vendor spotlight** — the shoot footage, vendor's story, starting price
2. **Real event** — footage from an actual booking (get permission)
3. **Useful/educational** — "What a 200-person wedding in Amman actually
   costs", "5 questions to ask a caterer before you book". This is the content
   that gets *saved and shared*, which is what the algorithm rewards.
4. **Behind the scenes** — you two building this. People back founders.
5. **Social proof** — a booking, a review, a milestone

Budget here is small because the content already exists from Phase A. The
~300 JOD covers a scheduling tool and occasional boosted posts.

### Phase C — Weeks 10–20: Demand. Budget 2,100 JOD

Only start once 15+ vendors are live.

| Channel | JOD | What it does |
|---|---:|---|
| **Meta ads (IG/FB)** | 900 | Your main engine. Target: engaged (Facebook relationship status), 22–35, Amman, interests in wedding planning. Run to a **lead form**, not the homepage — one form field beats one more click. Start 15 JOD/day, kill what doesn't work weekly. |
| **Micro-influencers** | 700 | Jordanian micro-influencers run roughly **50–300 JOD/post**. Pick **4–6** in the wedding/lifestyle/food space. Prefer engagement over follower count — a 12k account with real comments beats a 90k account with none. Offer a free vendor consultation as part of the deal. |
| **Google Search** | 400 | Small but very high intent. Bid on "wedding photographer Amman", "catering Amman", "مصور اعراس عمان". These people are ready to book *now*. |
| **Wedding fair / expo** | 100 | A small presence at one Amman wedding exhibition. Mostly for vendor recruitment and face-to-face credibility. |

### The launch event — 700 JOD

Host a **Founding Vendor evening** for your 18–20 vendors, at a partner venue,
catered by one of your own vendors (barter — they get content and exposure).

Why it's worth 700 JOD:
- Your vendors meet each other → they become a community, not a supplier list.
  Communities don't churn.
- You get a night's worth of premium content in one evening
- Invite 2–3 micro-influencers and a couple of local press contacts
- It signals "this is a real company", which is exactly what a new marketplace
  struggles to signal

---

## Targets to hold yourself to

**Month 3**
- 15+ vendors live with real photos
- 500+ Instagram followers
- 20+ organizer enquiries
- 3+ completed bookings

**Month 6**
- 30+ vendors
- 2,000+ followers
- 60+ enquiries/month
- 15+ bookings/month
- First month where revenue covers tools + ad spend

**Month 12**
- 60+ vendors
- 40+ bookings/month
- Break-even on operating costs

If Month 3 targets miss badly, **stop spending and diagnose** rather than
spending harder. That's what the reserve is for.

---

## The four things most likely to kill this

1. **Launching demand before supply.** Covered above. The most common
   marketplace death.
2. **Vendors churning after month one** because they got no bookings. Manage
   expectations honestly at signup — tell them month one will be quiet.
3. **Payment processing eating the margin.** At 2.5–3.5% processing against a
   6% Pro-tier commission, you keep roughly half. Model this properly before
   you commit to a gateway, and consider whether the Pro tier is priced right.
4. **Both founders doing everything.** Split it now: one owns supply (vendors),
   one owns demand (organizers + marketing). Overlap wastes your scarcest
   resource.

---

## Immediate next actions

**This week**
1. Fix Netlify billing → get the current site live
2. Fix and test the Airtable form pipeline end to end
3. Talk to an accountant about sole prop vs LLC
4. Draft the co-founder agreement

**Next 2 weeks**
5. Build the 60–80 vendor target list
6. Write the Founding Vendor offer as a one-page PDF
7. Book the photographer/videographer for the shoot days
8. Start founder outreach — 20 conversations/week

**Weeks 3–8**
9. Run the shoot days, onboard vendors
10. Replace every placeholder listing with a real vendor
11. Build the content library, start posting

---

*Figures on Jordanian registration, tax thresholds, payment gateway fees and
influencer rates come from public sources as of July 2026 and should be
confirmed directly — particularly anything legal or tax-related, which
warrants a local professional rather than a web search.*
