export const CONTACTS = [
  {
    name: "Priya Nair",
    type: "buyer",
    stage: "Showing",
    last: "Yesterday",
    score: 82,
    tag: "Looking, 3bd Northside",
    email: "priya.nair@mail.com",
    raw_dump: "Priya Nair is looking for a 3-bedroom house on the Northside. She prefers a quiet neighborhood, has a pre-approval letter for up to $650k, and is active on the weekends. She responded to the last outreach message expressing interest in Ashwood Lane.",
    extracted_profile: {
      pain_points_inferred: ["high rates", "limited inventory on Northside"],
      recent_signals: ["replied to showing note", "viewed Ashwood Ln twice"],
      tone_of_voice: "Direct, low patience for small talk",
      credibility_signals: ["pre-approved up to $650k", "active buyer"],
      likely_priorities: ["3-bedroom layout", "quiet street", "near good schools"],
      avoid_mentioning: ["fixer-uppers", "busy transit routes"]
    },
    tone_note: "Short & blunt",
    ai_status: "READY",
    messages: [
      {
        id: "msg_001",
        date: "Aug 3",
        channel: "email",
        tone_used: "Short & blunt",
        subject: "Quick update: 412 Ashwood Lane showing slots",
        body: "Hi Priya, 412 Ashwood Lane showing starts this Thursday. I have slots in the morning. Let me know if you want a walkthrough. Best, Saad",
        outcome: "replied",
        outcome_synced: "2h ago"
      }
    ]
  },
  {
    name: "Marcus Webb",
    type: "seller",
    stage: "Listed",
    last: "3 days ago",
    score: 74,
    tag: "Listing 412 Ashwood Ln",
    email: "marcus.webb@mail.com",
    raw_dump: "Marcus Webb is selling 412 Ashwood Lane. He wants to close quickly due to relocation. The property was listed at $620k. He is open to staging suggestions but wants minimal disruption.",
    extracted_profile: {
      pain_points_inferred: ["relocation timeline pressure", "needs high net proceeds"],
      recent_signals: ["approved listing price", "requested staging update"],
      tone_of_voice: "Professional, focused on logistics",
      credibility_signals: ["sole owner", "completed pre-sale inspection"],
      likely_priorities: ["quick closing", "minimal listing disruption"],
      avoid_mentioning: ["low-ball investor offers"]
    },
    tone_note: "Formal",
    ai_status: "READY",
    messages: [
      {
        id: "msg_002",
        date: "Aug 1",
        channel: "email",
        tone_used: "Formal",
        subject: "Listing Active: 412 Ashwood Lane",
        body: "Dear Marcus, the listing for 412 Ashwood Lane is now active on all channels. We will keep you updated on show times. Regards, Saad",
        outcome: "opened",
        outcome_synced: "1d ago"
      }
    ]
  },
  {
    name: "The Chen Family",
    type: "buyer",
    stage: "Offer",
    last: "Today",
    score: 91,
    tag: "Offer on 31 Harrow St",
    email: "chenfamily@mail.com",
    raw_dump: "The Chen Family submitted an offer of $450k on 31 Harrow St. They are anxious to get a response and want to make sure the appraisal will clear. They have a 20% down payment ready.",
    extracted_profile: {
      pain_points_inferred: ["anxiety about appraisal gap", "bidding war fear"],
      recent_signals: ["viewed Harrow St 3 times", "submitted formal offer"],
      tone_of_voice: "Polite, detail-oriented",
      credibility_signals: ["20% down payment verified", "pre-approval from local bank"],
      likely_priorities: ["spacious backyard", "appraisal clearance"],
      avoid_mentioning: ["backup offers", "delays in seller response"]
    },
    tone_note: "Warm & consultative",
    ai_status: "PROCESSING",
    messages: [
      {
        id: "msg_003",
        date: "Aug 4",
        channel: "email",
        tone_used: "Warm & consultative",
        subject: "Your offer has been submitted for 31 Harrow St",
        body: "Hi Chens, I have officially submitted your offer to the seller's agent. We should hear back by tomorrow morning. I'll keep you posted. Best, Saad",
        outcome: "replied",
        outcome_synced: "30m ago"
      }
    ]
  },
  {
    name: "Devon Cole",
    type: "nurture",
    stage: "Cold",
    last: "34 days ago",
    score: 22,
    tag: "Browsing, no urgency yet",
    email: "devon.cole@mail.com",
    raw_dump: "Devon Cole is browsing online. He is registered on our site but hasn't responded to emails. He seems to be looking at modern lofts downtown. No active pre-approval yet.",
    extracted_profile: {
      pain_points_inferred: ["unsure of buying power", "waiting for rates to drop"],
      recent_signals: ["browsing modern lofts online"],
      tone_of_voice: "Quiet, non-committal",
      credibility_signals: ["none"],
      likely_priorities: ["downtown location", "low association fees"],
      avoid_mentioning: ["pre-approval requirements", "hard selling"]
    },
    tone_note: null,
    ai_status: "NOT_STARTED",
    messages: []
  },
  {
    name: "Farida Iqbal",
    type: "seller",
    stage: "Under contract",
    last: "1 week ago",
    score: 88,
    tag: "221 Maple Grove, closing soon",
    email: "farida.iqbal@mail.com",
    raw_dump: "Farida Iqbal is selling 221 Maple Grove. The transaction is under contract at $410k. Inspection has cleared, and the appraisal is complete. Closing is scheduled for next week.",
    extracted_profile: {
      pain_points_inferred: ["worries about buyer financing"],
      recent_signals: ["signed inspection disclosure", "confirmed closing date"],
      tone_of_voice: "Business-like, busy",
      credibility_signals: ["contract fully executed", "earnest money in escrow"],
      likely_priorities: ["smooth closing", "timely wire transfer"],
      avoid_mentioning: ["moving delays"]
    },
    tone_note: "Data-driven",
    ai_status: "READY",
    messages: [
      {
        id: "msg_004",
        date: "Jul 28",
        channel: "email",
        tone_used: "Data-driven",
        subject: "Inspection cleared for 221 Maple Grove",
        body: "Hi Farida, the buyer has officially signed off on the inspection. The deal is moving smoothly to closing. Best, Saad",
        outcome: "opened",
        outcome_synced: "1w ago"
      }
    ]
  },
  {
    name: "Oliver Grant",
    type: "buyer",
    stage: "Nurture",
    last: "12 days ago",
    score: 41,
    tag: "First-time buyer, pre-approval pending",
    email: "oliver.grant@mail.com",
    raw_dump: "Oliver Grant is a first-time buyer looking for a condo. He is waiting on pre-approval letter for a budget around $300k. He has lots of questions about the buying process.",
    extracted_profile: {
      pain_points_inferred: ["confused by escrow process", "tight budget limits"],
      recent_signals: ["opened pre-approval guide", "asked about down payment assistance"],
      tone_of_voice: "Inquisitive, cautious",
      credibility_signals: ["saving for down payment"],
      likely_priorities: ["low maintenance fees", "move-in ready"],
      avoid_mentioning: ["fixer-uppers"]
    },
    tone_note: "Curious / exploratory",
    ai_status: "READY",
    messages: [
      {
        id: "msg_005",
        date: "Jul 23",
        channel: "email",
        tone_used: "Curious / exploratory",
        subject: "Questions on the pre-approval guide?",
        body: "Hi Oliver, just checking if you had a chance to look at the guide. Let me know what questions you have about pre-approval. Best, Saad",
        outcome: "no_response",
        outcome_synced: "2w ago"
      }
    ]
  },
  {
    name: "Simone Reyes",
    type: "nurture",
    stage: "Cold",
    last: "41 days ago",
    score: 19,
    tag: "Downsizing, timeline unclear",
    email: "simone.reyes@mail.com",
    raw_dump: "Simone Reyes wants to downsize from her large family home. However, she has lived there for 30 years and is emotionally attached. Her timeline is highly uncertain.",
    extracted_profile: {
      pain_points_inferred: ["emotional hesitation to move", "overwhelmed by decluttering"],
      recent_signals: ["visited downsizing blog page"],
      tone_of_voice: "Reserved, sentimental",
      credibility_signals: ["substantial home equity"],
      likely_priorities: ["compassionate guidance", "small manageable garden"],
      avoid_mentioning: ["quick sale", "immediate listing"]
    },
    tone_note: null,
    ai_status: "FAILED",
    messages: []
  },
  {
    name: "Elena Vance",
    type: "seller",
    stage: "New Lead",
    last: "Just imported",
    score: 85,
    tag: "Selling, 12 Oak Ridge Rd",
    email: "elena.vance@mail.com",
    raw_dump: "[Imported row — Excel] Name: Elena Vance | Email: elena.vance@mail.com | Property: 12 Oak Ridge Road single-family home. Ready to list. Expected target value $800k.",
    extracted_profile: {
      pain_points_inferred: ["wants quick listing turnarounds"],
      recent_signals: ["requested valuation estimate"],
      tone_of_voice: "Formal, detail-oriented",
      credibility_signals: ["primary owner, clear title"],
      likely_priorities: ["maximizing return", "flexible closing time"],
      avoid_mentioning: ["prolonged negotiations"]
    },
    tone_note: null,
    ai_status: "NOT_STARTED",
    messages: []
  },
  {
    name: "Jordan Blake",
    type: "buyer",
    stage: "New Lead",
    last: "Just imported",
    score: 72,
    tag: "Looking, 4bd suburbs",
    email: "jordan.blake@mail.com",
    raw_dump: "[Imported row — Excel] Name: Jordan Blake | Email: jordan.blake@mail.com | Target: Suburban 4-bedroom home for growing family. Budget range $700k.",
    extracted_profile: {
      pain_points_inferred: ["school district preferences", "suburban inventory lag"],
      recent_signals: ["clicked neighborhood rating report"],
      tone_of_voice: "Consultative",
      credibility_signals: ["active buyer"],
      likely_priorities: ["large backyard", "safe school zones"],
      avoid_mentioning: ["long commutes"]
    },
    tone_note: null,
    ai_status: "NOT_STARTED",
    messages: []
  },
  {
    name: "Taylor Vance",
    type: "nurture",
    stage: "New Lead",
    last: "Just imported",
    score: 41,
    tag: "Future buyer, downsizing",
    email: "taylor.vance@mail.com",
    raw_dump: "[Imported row — Excel] Name: Taylor Vance | Email: taylor.vance@mail.com | Notes: Interested in downsizing options next summer. Quiet client.",
    extracted_profile: {
      pain_points_inferred: ["unsure of market timing"],
      recent_signals: ["downloaded market report"],
      tone_of_voice: "Quiet, slow response",
      credibility_signals: ["equity in current home"],
      likely_priorities: ["smaller maintenance footprint"],
      avoid_mentioning: ["high-stakes urgency bids"]
    },
    tone_note: null,
    ai_status: "NOT_STARTED",
    messages: []
  }
];

export const ACTIVITY = [
  { name: "Priya Nair", date: "Aug 3", change: "Qualified → Showing", value: "+$620,000", pos: true },
  { name: "Marcus Webb", date: "Aug 2", change: "New lead → Listed", value: "+$620,000", pos: true },
  { name: "The Chen Family", date: "Aug 1", change: "Showing → Offer", value: "+$450,000", pos: true },
  { name: "Farida Iqbal", date: "Jul 29", change: "Offer → Under contract", value: "$410,000", pos: false },
  { name: "Devon Cole", date: "Jul 27", change: "Nurture, no change", value: "—", pos: false }
];

export const SIGNALS = [
  { name: "Priya Nair", sub: "Replied to your showing note", score: "92", date: "2h ago" },
  { name: "The Chen Family", sub: "Viewed 31 Harrow St, 3rd time", score: "88", date: "5h ago" },
  { name: "Farida Iqbal", sub: "Signed inspection disclosure", score: "81", date: "Yesterday" },
  { name: "Oliver Grant", sub: "Opened your pre-approval guide", score: "54", date: "2d ago" }
];

export const KANBAN = {
  "New Lead": [
    { name: "Yusuf Tariq", prop: "Looking, downtown loft", value: "$310,000" },
    { name: "Anya Petrov", prop: "Referred by Priya Nair", value: "$275,000" }
  ],
  "Qualified": [
    { name: "Oliver Grant", prop: "Pre-approved, $300k cap", value: "$300,000" }
  ],
  "Showing": [
    { name: "Priya Nair", prop: "412 Ashwood Ln", value: "$620,000" },
    { name: "The Reeds", prop: "9 Copperfield Ct", value: "$280,000" }
  ],
  "Offer": [
    { name: "The Chen Family", prop: "31 Harrow St", value: "$450,000" }
  ],
  "Closed": [
    { name: "Farida Iqbal", prop: "221 Maple Grove", value: "$410,000" },
    { name: "Amir Siddiqui", prop: "54 Pinehollow", value: "$298,000" }
  ]
};

export const EMAIL_VARIANTS = [
  {
    subject: "A quiet week on the market — here's what moved",
    body: `<p class="greet">Hello,</p>
    <p>Inventory in Northside crept up just slightly this week — three new listings, none of them competing directly with what you've been watching. Rates held flat, which is the closest thing to good news we've had in a month.</p>
    <p>412 Ashwood Ln, the property a few of you asked about, is now scheduled for showings starting Thursday. If you'd like a private walkthrough before the weekend, reply here and I'll hold a slot.</p>
    <p>No pressure, no countdown clocks — just wanted you to hear it from me before it hits the portals.</p>
    <p class="greet">— Saad</p>`
  },
  {
    subject: "Two things worth knowing before the weekend",
    body: `<p class="greet">Hello,</p>
    <p>First: the Harrow St offer closed this morning, three percent over ask. It's a useful data point if you've been waiting for the market to "cool" before making a move — it isn't, not in this pocket.</p>
    <p>Second: I'm holding two private showings Saturday morning before either property goes public. Message me if either sounds worth an hour of your time.</p>
    <p>That's the whole note. Talk soon.</p>
    <p class="greet">— Saad</p>`
  }
];

export const AI_STATUS_LABELS = {
  "NOT_STARTED": "Not started",
  "PROCESSING": "Generating…",
  "READY": "Ready",
  "FAILED": "Failed"
};
