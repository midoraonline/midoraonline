# AGENTS.COPY.md — Midora voice, tone & UI copy rules

Rules for **every user-facing string** in Midora: buttons, labels, hints, placeholders,
toasts, errors, empty states, confirmations, emails, push notifications, page titles,
metadata and `aria-label`s. Read this before writing or changing any text a person will see.
API error messages that reach the screen (from `nestapi`) follow the same rules.

Companion docs: `AGENTS.md` (engineering), `AGENTS.UI.md` (visual density & polish).

---

## 0. Who we write for

Midora is an **African marketplace, built in and for Uganda first**. People use it to buy, sell,
advertise services, and find jobs and opportunities. Most people who use it:

- are on an **Android phone**, often a low-cost one with a small screen, and on **mobile data that costs them money**. Connections can be slow or drop.
- read English as a **second or third language**. English is Uganda's official language and Swahili is the second official language, but many people speak Luganda, Runyankole-Rukiga, Lusoga, Acholi, Ateso, Lugbara or another local language at home.
- trust **people, phone calls and WhatsApp** more than websites. Many have heard of online scams such as fake sellers, "send money first" fraud and items that don't match the photos.
- pay with **mobile money (MTN MoMo, Airtel Money) or cash**. Cards are less common.
- find places by **area, town, district and landmark** ("near Shell, Ntinda"), not by street address or postcode.

So the bar is: **a first-time visitor on a cheap phone, reading in their second language, understands it at a glance and knows what to do next.**

> Facts in this section are well established, but they are not measured numbers. When you need figures (internet use, literacy, mobile money use), get current ones from UBOS (census), the Uganda Communications Commission, the Bank of Uganda and DataReportal before quoting them in product decisions.

---

## 1. The one-line rule

**Write like a helpful, calm shop attendant: plain words, short sentences, one idea at a time, friendly but never silly, and always tell people what to do next.**

- **Clear first, clever second.** Good copy is so easy to understand that people don't notice it.
- **Plain language.** Aim for a reading level of grade 6–8. Errors should be grade 5–8.
- **Front-load the point.** Put the key word or action first, because people scan.
- **Be specific.** Say what happened, why (only if it helps), and how to fix it.
- **Be consistent.** Use one word for one thing, everywhere (see the glossary in §6).

---

## 2. Voice (always the same)

| Principle | What it means |
| --- | --- |
| **Clear** | Simple words. No jargon, no internal terms (`slug`, `payload`, `null`, `intent`, `IPN`, `ranking score`). |
| **Helpful** | Every message moves the person forward. |
| **Warm** | Human, polite and reassuring. Courtesy matters in Uganda, so be respectful without being stiff. |
| **Trustworthy** | Be honest about prices, fees, delivery, verification and problems. Never overpromise. |

**Tone settings**

| Scale | Setting |
| --- | --- |
| Formal ↔ casual | **Semi-casual.** Friendly and easy, but no slang and no texting style. |
| Serious ↔ funny | **Mostly serious.** Light touches only in low-stakes moments (empty feed, welcome). Never in errors, payments or reports. |
| Respectful ↔ irreverent | **Always respectful.** Never blame the user or tease them about a mistake. |
| Enthusiastic ↔ matter-of-fact | **Moderate.** Warm on success and discovery, matter-of-fact on tasks and problems. |

## 3. Tone by moment

| Moment | Tone | Example |
| --- | --- | --- |
| Browsing / discovery | Friendly, light | "Find something you'll love near you." |
| Success (saved, posted) | Positive, brief | "Listing posted." / "Saved." |
| Payments, plans, boosts | Calm, precise, reassuring | State the price in UGX, what they get and for how long. No jokes. |
| Errors | Calm, kind, practical | Explain and fix. Never blame. |
| Empty states | Encouraging | Say what's missing and what to do: "No saved listings yet. Tap the heart on a listing to save it." |
| Problems, reports, account actions | Empathetic, direct | Own the problem, then give the next step and the timeline. |
| Safety / scam warnings | Serious, plain, caring | "Meet in a public place. Don't send money before you see the item." |

---

## 4. Writing rules

### 4.1 Plain language
- Keep sentences to about **20 words or fewer**, and a hint or error to one or two short sentences.
- Use the **active voice**: "We couldn't save your listing", not "Your listing could not be saved".
- Use **everyday words**: "use only letters and numbers", not "alphanumeric". Say "photo", not "media asset".
- **Avoid idioms and Western cultural references** ("knock it out of the park", "ballpark", "zip code", "state", "check", "Black Friday"). They don't translate and they confuse people.
- Use **contractions** ("you'll", "can't", "we've"). They read warmer and are easy to understand.
- Use **"you"** for the user and **"we"** for Midora. Use "I"/"my" only in first-person buttons when that helps ("Track my order").

### 4.2 Scannable and phone-first
- Put the most important word first. Use short headings, short paragraphs and lists.
- **Write about half the words you'd use in print.** It saves screen space and data.
- Short, but not cryptic. A clear three-word phrase beats one word that people misread.
- Check that labels fit at **360px wide** without truncating meaning.

### 4.3 Consistent mechanics
- Use **sentence case** for buttons, headings, tabs and menu items: "Add to cart", "Post a listing". Capitalise only proper nouns (Midora, WhatsApp, MTN MoMo, Airtel Money, Kampala).
- **Use UK/Ugandan English spelling**: colour, favourite, organisation, centre, cancelled, enrol, licence (noun), programme, metre, catalogue. Code identifiers (`color`, CSS) stay as they are. Only change the words people see.
- **Don't use title case** ("Create Your Shop Now") and don't use ALL CAPS, except for UGX and tiny visual tag styles done with CSS.
- **Use few exclamation marks.** At most one, and only for real celebration ("Your shop is live!"). Never in errors.
- **Don't end a button or a short label with a full stop.** End full sentences in hints, errors and toasts with one.
- Use **"…"** (a single ellipsis character) for progress states: "Saving…", "Uploading photos…".
- Use **numerals**: "3 photos", not "three photos".

### 4.4 Inclusive and accessible
- Links and buttons must make sense out of context: "View shop", not "Click here" or "Learn more".
- Use `aria-label` in the same plain voice: "Close", "Save listing", "Next photo".
- **Don't rely on colour alone** to show errors or status. Pair it with text.
- Use gender-neutral wording ("the seller", "they").

---

## 5. Patterns

### 5.1 Buttons and calls to action
Use **a verb plus what happens**.
- ❌ Submit · OK · Click here · Proceed · Go
- ✅ Post listing · Save changes · Send message · Chat on WhatsApp · Open my shop · Pay with mobile money
- Put a short **reassurance line** under high-stakes buttons, such as the price, what happens next, or "Free. No card needed."
- Pair destructive actions with the object: "Delete listing", not "Delete". The confirm dialog says what will be lost: "Delete this listing? Buyers won't see it again. You can't undo this."
- Use "Cancel" for dismissing a dialog. Use "Keep listing" or "Keep editing" when "Cancel" would be ambiguous next to a destructive action.

### 5.2 Error messages: what happened → why (if useful) → how to fix
- ❌ "Invalid input." → ✅ "Enter a phone number like 0772 123 456."
- ❌ "Authentication failed (401)." → ✅ "That email or password doesn't match. Try again or reset your password."
- ❌ "Upload failed." → ✅ "We couldn't upload that photo. Check your connection and try again."
- ❌ "Network Error" → ✅ "You seem to be offline. Check your data or Wi-Fi and try again."
- ❌ "Something went wrong" (on its own) → ✅ "We couldn't load listings. Try again." Always add a next step.
- **Never show** status codes, `Error:` prefixes, stack traces, raw server messages, "null", "undefined", "exception", "invalid", "forbidden", "unauthorized" or "payload". Log them for developers (`console.error`) instead.
- **Never blame the user**: avoid "You entered…" and "You failed to…".
- **Show the error inline** next to the field, as soon as it's useful.
- **Prevent errors**: show format hints ("e.g. 0772 123 456"), auto-format phone numbers and prices, and disable buttons until the form can succeed. When you disable a button, explain why nearby.
- **Expect bad connections.** Timeouts and offline errors should say so and offer "Try again". Don't make people retype a form.

### 5.3 Forms and labels
- Put a **visible label above every field**. A placeholder is only an example ("e.g. Toyota Premio 2008"), never the label.
- Mark the fewer fields: put **"(optional)"** on optional fields instead of starring every required one.
- **Explain sensitive asks**: "We'll show this number to buyers so they can call or WhatsApp you." / "We only use your email to sign you in and send receipts."
- **Location fields** ask for area, town or district, and landmark. Don't ask for a "street address", "ZIP" or "state".
- **Phone fields** accept 07…, 256… and +256… and show a hint like "e.g. 0772 123 456".

### 5.4 Money, payments, plans and boosts (trust moments)
- Write prices as **`UGX 50,000`**: the currency code first, a space, comma thousands separators and **no decimals**. Use the shared formatter (`Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 })` or existing helpers). Don't hand-build price strings. Don't mix "Shs", "USh" and "/=".
- Show the **full cost before the pay button**: the price, how long it lasts, and whether it renews.
- Say **what happens after paying**: "You'll be taken to Pesapal to pay with mobile money or card. Your plan starts as soon as payment is confirmed."
- When a payment is pending, say so plainly and give a timeline: "Waiting for your mobile money confirmation. Check your phone for the prompt."
- Write "Negotiable" and "Free" in words. Don't write "Price: 0".

### 5.5 Trust, safety and verification
- Explain badges in plain words: "Verified: we checked this shop's phone number with WhatsApp." Never imply more checking than we did.
- Put safety tips near contact buttons: "Meet in a safe, public place. Check the item before you pay."
- Reports: "Thanks. We'll review this listing within 24 hours." Only promise a time we actually meet.

### 5.6 Empty states, confirmations and notifications
- **Empty states** say what's missing and what to do: "No listings in this category yet. Be the first to post one."
- **Confirmations** say what happened and what comes next: "Listing posted. Buyers can find it now."
- **Notifications** carry one message and one purpose, with a clear action. Push and email subjects lead with the useful word: "New message from Sarah about Toyota Premio".
- **Loading** text is short and specific: "Loading listings…". Prefer skeletons to text where you can.

### 5.7 Listing and shop descriptions (system text and AI-generated text)
- Lead with what it is and the main benefit. Keep specs in a scannable list.
- Keep the selling language light and factual. No ALL CAPS and no "!!!".
- Use consistent detail across categories (vehicles: make, model, year, mileage; phones: model, storage, condition).

---

## 6. Glossary (one word for one thing)

| Use | Don't use (in UI copy) | Notes |
| --- | --- | --- |
| **Sign in** / **Sign out** | Log in, Login, Log out | "Sign-in" as a noun or adjective: "Sign-in failed". |
| **Create account** | Register, Sign up (in buttons) | Lead with the benefit: "Create an account to save listings and chat with sellers." The route names `/register` stay. |
| **Listing** | Ad, post, item (as the generic thing) | A listing can be a product, service, job or opportunity. Use the specific type when it's known. |
| **Post a listing** / **Post listing** | Submit, Publish ad, Upload item | |
| **Shop** | Store, merchant account, business page | |
| **Seller** (public) / **shop owner** | Merchant, vendor | "Merchant" is fine only inside the merchant dashboard nav, where it's an established route label. Prefer "your shop" in copy. |
| **Buyer** | Customer (public side), client | "Customer" is fine for a shop owner talking about their own customers. |
| **Save** / **Saved** | Favourite, wishlist | If a feature is a public like count, keep "Like". Don't rename features, only fix wording. |
| **Chat** / **Message** | Inbox, DM, conversation (in buttons) | "Chat on WhatsApp" for WhatsApp, "Message seller" for in-app chat. |
| **Phone number** | Mobile no., MSISDN, tel | |
| **Mobile money** | MoMo (alone), e-wallet | Name the providers when helpful: MTN MoMo, Airtel Money. |
| **Area / town / district** | Region (for a place), state, ZIP, postcode | |
| **Boost** | Promote, sponsor (mixed) | Paid visibility. Pick one term and keep it. |
| **Plan** | Subscription tier, package | "Your plan" and "Change plan". |
| **Verified** | Certified, approved (for badges) | |
| **Photo(s)** | Image(s), media | "Video" stays "video". |
| **Working days** | Business days, BD | |
| **Delete** (permanent) vs **Remove** (from a list) vs **Close** (listing no longer active) | Mixed | Use them precisely. |

If a term isn't here, search the codebase for the most common user-facing form and match it. Add new terms here when you introduce them.

---

## 7. Before → after reference

| Context | Weak | Stronger |
| --- | --- | --- |
| Phone error | "Invalid phone." | "Enter a phone number like 0772 123 456." |
| Sign-in error | "Login failed (401)." | "That email or password doesn't match. Try again or reset your password." |
| Payment | "Transaction declined." | "We couldn't take your payment. Check your mobile money balance or try another method." |
| Button | "Submit" | "Post listing" |
| Empty saved list | "No items." | "No saved listings yet. Tap the heart on any listing to save it here." |
| Delivery | "TAT: 3–5 BD" | "Arrives in 3–5 working days" |
| Success | "Success." | "Saved. Your changes are live." |
| Sold out | "Item unavailable." | "Sold. See similar listings." |
| Account gate | "Register to proceed." | "Create an account to chat with sellers." |
| Offline | "Network Error" | "You're offline. Check your data or Wi-Fi and try again." |
| Upload | "File too large" | "That photo is too big. Choose one under 8 MB." |

---

## 8. Checklist for any new string

- [ ] Would a first-time visitor on a small phone, reading English as a second language, understand it without help?
- [ ] Is the most important word or action first?
- [ ] Is it specific (what happened, why, what to do)?
- [ ] Is the tone right for how the person probably feels?
- [ ] Does it use the glossary terms, sentence case and UK spelling?
- [ ] Is it free of blame, jargon, codes, idioms and unnecessary humour or exclamation marks?
- [ ] Are prices in `UGX 50,000` format and phone hints in `0772 123 456` format?
- [ ] Is there a next step (button, link or instruction)?

## 9. Evidence notes

- **Strong evidence**: plain language, scannability, specific error messages, consistent terms and tone that fits the context (NN/g, Baymard, Shopify Polaris, Intuit, GOV.UK-style plain-language guidance).
- **Weaker evidence**: exact conversion lifts from button wording (Schuh "Add to bag" +17%, Fab text CTA +49%, first-person CTAs +24–90%). These are single-site tests, so treat them as ideas to test.
- **Local fit**: most of that research comes from Western, English-first markets. Test the key flows (sign-up, posting a listing, contacting a seller, paying for a plan or boost) with real Ugandan users. Later, consider Luganda and Swahili versions of the highest-traffic screens. Keep English copy plain so it translates cleanly.
