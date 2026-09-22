# FoodOPS — UI/UX Product Audit (`/docs/UI_AUDIT.md`)

> **Objective**: Comprehensive product-grade audit evaluating visual presentation, component hierarchy, user experience friction, and design consistency across all FoodOPS routes.

---

## Page-by-Page Audit & Recommendations

### 1. Public Landing Page (`/`)
* **Current Problem**: Landing page uses a dark mode glassmorphism hero with floating icons that feel like a student showcase rather than a linear, operational logistics product.
* **UX Issue**: Hero CTA lacks clear product positioning. The operational workflow (Listing -> Matching -> Route -> Handover) is obscured by high-level marketing text.
* **Visual Issue**: Inconsistent color palette, excessive glow effects, and non-semantic badge styling.
* **Priority**: **P0 (High)**
* **Recommended Change**: 
  - Change Hero headline to: *"Rescue surplus food before the window closes."*
  - Supporting text: *"FoodOPS coordinates donors, verified receivers, and volunteers to move surplus food from listing to handover before the rescue window closes."*
  - Primary CTA: **Donate Surplus Food** (`/donor/create`). Secondary CTA: **Explore Food Rescues** (`/ngo`).
  - Replace abstract graphics with an operational product preview showing live listing status, NGO distance match, and volunteer route.

---

### 2. Global Navbar & Navigation (`/components/Navbar.tsx`)
* **Current Problem**: Navbar has mixed role navigation links and lacks clear active-page indicators.
* **UX Issue**: Users switching roles or navigating sub-pages (e.g. `/admin` vs `/admin/data`) lack a unified navigation hierarchy.
* **Visual Issue**: High contrast borders with ad-hoc padding; missing sticky backdrop filter.
* **Priority**: **P0 (High)**
* **Recommended Change**: 
  - Restructure header into a clean, modern SaaS header with crisp typography.
  - Display role badge (DONOR / NGO / VOLUNTEER / ADMIN) with current account status (`VERIFIED` vs `PENDING`).
  - Add smooth active state indicators and a responsive mobile drawer navigation menu.

---

### 3. Donor Dashboard (`/donor`)
* **Current Problem**: Dashboard displays cards with mixed sizes and text styles without a clear focal point.
* **UX Issue**: Unverified donor phone OTP banner and account status banners compete for visual attention.
* **Visual Issue**: Standard card grid layout feels like a generic CRUD dashboard.
* **Priority**: **P0 (High)**
* **Recommended Change**: 
  - Re-architect header with prominent primary CTA: **+ Create Donation**.
  - Organize into 2 clean columns: Active Surplus Rescues (Left) and Historical Activity / Impact Summary (Right).
  - Simplify OTP banner into a clean inline verification callout without distracting alert boxes.

---

### 4. Multi-Step Donation Creation Flow (`/donor/create`)
* **Current Problem**: All donation creation fields (Title, Category, Quantity, Pickup Address, Map Picker, Expiry) are presented on one long form page.
* **UX Issue**: Form fatigue for donors attempting to quickly publish surplus food before event teardown.
* **Visual Issue**: AI OCR audit section looks like an intrusive "Gemini AI" advertisement block rather than a subtle assistant helper.
* **Priority**: **P0 (High)**
* **Recommended Change**: 
  - Convert into a crisp 4-step wizard:
    1. **Step 1: Food Details** (Title, category, veg/non-veg, quantity, servings)
    2. **Step 2: Pickup Logistics** (Address, map location picker, pickup window & deadline)
    3. **Step 3: Review & AI Audit** (Subtle *"AI-Assisted Listing Review"* helper to auto-suggest categories without claiming food safety certification)
    4. **Step 4: Publish Listing** (Final confirmation)
  - Add a top step-progress bar.

---

### 5. NGO Dashboard (`/ngo` & `/ngo/active`)
* **Current Problem**: Nearby available donations list displays text cards without clear urgency indication.
* **UX Issue**: Rescue window countdown is not immediately prominent; distance and category filters are scattered.
* **Visual Issue**: Overuse of green badges for different status states.
* **Priority**: **P0 (High)**
* **Recommended Change**: 
  - Position an **Operational Console Header** showing total available nearby food weight and urgent deadlines.
  - Display rescue window countdown badge prominent on each card (e.g., `⏱️ 42 MIN REMAINING`).
  - Use high-contrast **Claim Donation** button as the primary CTA.

---

### 6. Volunteer Assignment & Logistics Workflow (`/volunteer`)
* **Current Problem**: Volunteer cards list donor phone, pickup address, and action buttons in a dense side panel.
* **UX Issue**: Volunteers on mobile devices need large, readable turn-by-turn destination callouts and clear step progression.
* **Visual Issue**: Status progress bar uses 6 identical green bars regardless of stage.
* **Priority**: **P0 (High)**
* **Recommended Change**: 
  - Optimize layout for mobile-first operational use:
    - **Large Destination Callout**: *"Next Stop: Grand Banquet Hall (Donor)"* or *"Next Stop: Save Food Foundation (NGO)"*.
    - **Prominent Operational Button**: **START PICKUP** (triggers Google Maps directions) -> **ARRIVED AT DONOR** -> **VERIFY PICKUP OTP** -> **START DELIVERY** (triggers Google Maps directions) -> **VERIFY DELIVERY OTP**.
  - Add clear distinction between external Google Maps navigation and FoodOPS operational state machine.

---

### 7. Interactive NGO Rescue History (`/ngo/history`)
* **Current Problem**: History modal layout contains raw enum strings (`RECOVERY_ESCALATED`, `VOLUNTEER_ASSIGNED`).
* **UX Issue**: Raw audit logs are formatted as plain text lines without visual timeline dots.
* **Visual Issue**: Dense modal interface on mobile screens.
* **Priority**: **P1 (Medium)**
* **Recommended Change**: 
  - Map database status enums to human-friendly operational labels (`✓ Listed`, `✓ Claimed`, `✓ Rider Assigned`, `🚴 Pickup in Transit`, `📦 Picked Up`, `🚛 Delivery in Transit`, `🏁 Rescue Completed`).
  - Upgrade detail view modal into a sleek 2-column layout: Left (Food & Partner Info), Right (Interactive Vertical Timeline + Verified Ecological Impact).

---

### 8. Admin Operations Console (`/admin` & `/admin/data`)
* **Current Problem**: Admin pages look identical in style to user dashboards, making role context ambiguous.
* **UX Issue**: Tab switching between Data Browser sections (`/admin/data`) resets state.
* **Visual Issue**: Dense database tables without column sorting or compact row styling.
* **Priority**: **P1 (Medium)**
* **Recommended Change**: 
  - Apply a distinct **Operations Console Header** (Dark Forest Green `#052e16` accent border) signaling internal admin controls.
  - Compact data browser rows with monospace IDs, status pills, and fast search filter inputs.

---

## UX Audit Summary Matrix

| Page | Primary User Goal | Current UX Friction | Solution |
|---|---|---|---|
| **Landing (`/`)** | Understand FoodOPS rescue model & navigate | Over-decorated glassmorphism | Linear operational messaging & hero preview |
| **Donor (`/donor`)** | Create listing & track rescue status | Long 1-page form & noisy banners | 4-step wizard & clean dashboard layout |
| **NGO (`/ngo`)** | Find nearby food & claim before expiry | Expiry deadline not prominent | High-visibility rescue window timers (`42 min`) |
| **Volunteer (`/volunteer`)** | Navigate to destination & complete handover | Mobile button sizing & small text | Mobile-first destination focus & large CTAs |
| **Admin (`/admin/data`)** | Audit database & manage verifications | Dense tables & tab resets | Compact operations browser with live filter |
