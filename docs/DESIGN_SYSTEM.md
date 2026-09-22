# FoodOPS — Design System Specifications (`/docs/DESIGN_SYSTEM.md`)

> **Product Positioning**: "An intelligent, time-bound surplus-food rescue and recovery platform."
> **Visual Identity**: Modern SaaS + Logistics/Operations Platform + Humanitarian Technology.

---

## 1. Color Palette Tokens

The FoodOPS design system relies on a semantic, restrained color palette anchored around deep forest green and charcoal neutrals.

```css
:root {
  /* Core Brand Colors */
  --color-primary: #0b3c26;           /* Deep Forest Green */
  --color-primary-hover: #052e16;     /* Darker Forest Green */
  --color-primary-foreground: #ffffff; /* White text on primary */

  --color-accent: #10b981;            /* Fresh Lime Green (Highlights/Badges) */
  --color-accent-hover: #059669;

  /* Neutral Backgrounds & Text */
  --color-background: #f8faf9;        /* Warm Neutral Off-White */
  --color-foreground: #0f172a;        /* Deep Charcoal Body Text */
  --color-surface: #ffffff;           /* Clean Card Background */
  --color-surface-muted: #f1f5f9;     /* Light Slate Container Background */
  --color-surface-hover: #e2e8f0;

  /* Borders & Dividers */
  --color-border: #e2e8f0;            /* Crisp Subtle Border */
  --color-border-hover: #cbd5e1;

  /* Semantic Status Palette */
  --color-success: #15803d;           /* Green - Completed / Verified */
  --color-success-bg: #f0fdf4;
  --color-success-border: #bbf7d0;

  --color-active: #064e3b;            /* Forest - Active / In Transit */
  --color-active-bg: #ecfdf5;
  --color-active-border: #a7f3d0;

  --color-warning: #b45309;           /* Amber - Expiring SLA / Pending */
  --color-warning-bg: #fffbeb;
  --color-warning-border: #fde68a;

  --color-danger: #b91c1c;            /* Red - SLA Missed / Rejected */
  --color-danger-bg: #fef2f2;
  --color-danger-border: #fecaca;

  --color-neutral: #475569;           /* Slate - Neutral / Draft */
  --color-neutral-bg: #f8fafc;
  --color-neutral-border: #e2e8f0;

  --color-muted-text: #475569;         /* Secondary Text */
  --color-muted-light: #64748b;        /* Auxiliary Text */

  /* Typography */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;

  /* Layout Elevation & Radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  --shadow-xs: 0 1px 2px 0 rgba(15, 23, 42, 0.03);
  --shadow-sm: 0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.03);
  --shadow-md: 0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04);
}
```

---

## 2. Typography Scale

FoodOPS uses **Inter** as its primary typeface with strict typographic hierarchy:

| Level | Size | Weight | Line Height | Case | Letter Spacing |
|---|---|---|---|---|---|
| **Display Header** | `2.25rem (36px)` | 800 (Extrabold) | 1.15 | Sentence | `-0.025em` |
| **Page Title (H1)** | `1.875rem (30px)` | 800 (Extrabold) | 1.2 | Sentence | `-0.02em` |
| **Section Header (H2)** | `1.25rem (20px)` | 700 (Bold) | 1.3 | Sentence | `-0.015em` |
| **Subsection Header (H3)** | `1.0rem (16px)` | 700 (Bold) | 1.4 | Sentence | `-0.01em` |
| **Body Large** | `1.0rem (16px)` | 400 / 500 | 1.5 | Sentence | `normal` |
| **Body Standard** | `0.875rem (14px)` | 400 / 500 | 1.5 | Sentence | `-0.011em` |
| **Caption / Label** | `0.75rem (12px)` | 600 (Semibold) | 1.4 | Uppercase | `0.05em` |
| **Monospace ID / Code** | `0.75rem (12px)` | 700 (Bold) | 1.3 | Monospace | `0.025em` |

---

## 3. Semantic Status Indicator System

To avoid visual confusion, all operational statuses are mapped to **5 unified status classes**:

| Status Class | State Mapping | Background | Text | Border | Icon |
|---|---|---|---|---|---|
| **`SUCCESS`** | `COMPLETED`, `VERIFIED`, `HANDOVER_VERIFIED` | `#f0fdf4` | `#15803d` | `#bbf7d0` | `✓` |
| **`ACTIVE`** | `AVAILABLE`, `CLAIMED`, `VOLUNTEER_ASSIGNED`, `PICKUP_IN_PROGRESS`, `DELIVERY_IN_PROGRESS` | `#ecfdf5` | `#064e3b` | `#a7f3d0` | `●` |
| **`WARNING`** | `PENDING_VERIFICATION`, `UNDER_REVIEW`, `URGENT_SLA`, `RECOVERY_ESCALATED` | `#fffbeb` | `#b45309` | `#fde68a` | `⏱️` |
| **`CRITICAL`** | `EXPIRED`, `REJECTED`, `SUSPENDED`, `CANCELLED` | `#fef2f2` | `#b91c1c` | `#fecaca` | `✕` |
| **`NEUTRAL`** | `DRAFT`, `ORGANIC_RECOVERY`, `OFFLINE` | `#f8fafc` | `#475569` | `#e2e8f0` | `—` |

---

## 4. Reusable UI Components

### Buttons
- **Primary**: Deep Forest Green `#0b3c26`, white text, subtle shadow, 6px radius.
- **Secondary**: Pure White `#ffffff`, charcoal text, `#e2e8f0` border, hover `#f1f5f9`.
- **Danger**: Red `#b91c1c`, white text.
- **Warning**: Amber `#b45309`, white text.

### Inputs & Selects
- White background, `0.625rem 0.875rem` padding, 6px radius, `#0b3c26` focus outline with 3px focus ring (`rgba(11, 60, 38, 0.1)`).

### Rescue Cards & Operational Timeline
- Clean white card (`#ffffff`) with 1px border (`#e2e8f0`), 8px radius.
- Interactive timeline step indicators (`✓ Listed` -> `✓ Claimed` -> `✓ Rider Assigned` -> `● Pickup in Transit` -> `📦 Picked Up` -> `🚛 Delivery` -> `🏁 Completed`).

---

## 5. Responsive & Mobile Rules
- **Mobile First**: All dashboards, volunteer logistics flows, and donation forms must adapt seamlessly on mobile screens (`< 640px`).
- **Touch Targets**: Minimum `44px` height for all interactive buttons and inputs on mobile viewports.
- **Volunteer Usability**: Destination address, distance, and primary action buttons occupy full screen width on mobile devices.
