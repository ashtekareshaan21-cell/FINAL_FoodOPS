# FoodOps 3.0 Motion UI/UX Integration Guide

This guide details the Motion animation system implemented across the FoodOps platform. It acts as both documentation for developers and a study guide for understanding modern React animation principles.

---

## 1. `<motion.div>`

### Where FoodOps Uses It
Used globally to wrap grids, dashboard stats, listing cards, inputs, and form steps (e.g., inside [NearbyDonationsList.tsx](file:///d:/FINAL_FOODOPS/src/app/ngo/NearbyDonationsList.tsx) and [LoginForm.tsx](file:///d:/FINAL_FOODOPS/src/app/login/LoginForm.tsx)).

### What Problem It Solves
Standard HTML `<div>` elements change states instantly. Wrapping them in `<motion.div>` allows CSS attributes (opacity, layout dimensions, transitions) to be animated smoothly.

### Simplified Code Example
```tsx
import { motion } from "motion/react";

export function SimpleCard() {
  return (
    <motion.div className="bg-white p-4 shadow-md">
      Interactive Content
    </motion.div>
  );
}
```

### When to Use It
*   For UI containers that need to respond to state changes, gestures, or enter/leave lifecycle animations.
*   For cards, buttons, lists, and drawers.

### When NOT to Use It
*   For static layout wrappers (headers, structural grids, wrappers) that do not animate. Using it excessively increases memory footprint.

---

## 2. `initial` & `animate`

### Where FoodOps Uses It
Used in the Homepage Hero ([HeroSection.tsx](file:///d:/FINAL_FOODOPS/src/components/Home/HeroSection.tsx)) and Onboarding forms ([RegisterForm.tsx](file:///d:/FINAL_FOODOPS/src/app/register/RegisterForm.tsx)) to orchestrate entrance animations.

### What Problem It Solves
Enables declarative states for elements. You define the "starting state" (e.g., off-screen or invisible) and the "target state" when mounted, bypassing complex selector-driven keyframes.

### Simplified Code Example
```tsx
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
>
  Sliding Entrance Card
</motion.div>
```

### When to Use It
*   For modal/drawer mounting animations.
*   For loading indicators, toasts, and card mounts.

### When NOT to Use It
*   For trivial hover transitions that can be solved with pure CSS.

---

## 3. `transition`

### Where FoodOps Uses It
Implemented across all variants (e.g., `transition: { duration: 0.35, ease: 'easeOut' as const }`) to ensure curves match throughout the app.

### What Problem It Solves
Controls the pacing, damping, and curves of property changes. Prevents animations from feeling robotic or jarring.

### Simplified Code Example
```tsx
<motion.div
  animate={{ opacity: 1 }}
  transition={{ duration: 0.4, ease: "easeInOut" }}
/>
```

### When to Use It
*   To set structural duration, delay, repeat limits, or physics springs (`stiffness`, `damping`).

### When NOT to Use It
*   Avoid overriding transitions in deep children. Rely on parent-orchestrated staggers instead.

---

## 4. `whileHover`

### Where FoodOps Uses It
Applied to surplus card lists on the NGO dashboard and KPI counters on the Admin panel ([AdminMetrics.tsx](file:///d:/FINAL_FOODOPS/src/app/admin/AdminMetrics.tsx)) to elevate cards and scales buttons slightly.

### What Problem It Solves
Communicates clickability/interactivity. Elevating elements on hover guides the cursor focus on dense operational dashboards.

### Simplified Code Example
```tsx
<motion.div
  whileHover={{ scale: 1.01, y: -2 }}
  className="border border-border cursor-pointer"
>
  Card Content
</motion.div>
```

### When to Use It
*   For listings, clickable cards, sidebar navigation tabs, and grid items.

### When NOT to Use It
*   For mobile viewports (where hover is sticky/jarring) or non-clickable elements.

---

## 5. `whileTap`

### Where FoodOps Uses It
Integrated on primary buttons, registration role selections, and OTP buttons across dashboards.

### What Problem It Solves
Simulates physical tactile response. It informs the user that a click has been successfully registered, preventing double-submitting forms.

### Simplified Code Example
```tsx
<motion.button
  whileTap={{ scale: 0.98 }}
  className="bg-primary text-white"
>
  Submit Request
</motion.button>
```

### When to Use It
*   For buttons, form submissions, checkbox tags, and dialog confirms.

### When NOT to Use It
*   For text links, layout elements, or disabled fields.

---

## 6. `variants` & `staggerChildren`

### Where FoodOps Uses It
Organizes lists on [DonorDonationsList.tsx](file:///d:/FINAL_FOODOPS/src/app/donor/DonorDonationsList.tsx) and [PendingNgoList.tsx](file:///d:/FINAL_FOODOPS/src/app/admin/PendingNgoList.tsx).

### What Problem It Solves
Orchestrates nested timelines. Instead of having each list card animate at the exact same millisecond (which looks blocky), lists cascade down sequentially, conveying speed and grid hierarchy.

### Simplified Code Example
```tsx
const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

export function StaggeredList({ items }) {
  return (
    <motion.ul variants={listVariants} initial="hidden" animate="visible">
      {items.map(item => (
        <motion.li key={item.id} variants={itemVariants} />
      ))}
    </motion.ul>
  );
}
```

### When to Use It
*   For dashboard grids, lists, timelines, and multi-element dashboards.

### When NOT to Use It
*   For isolated, single components that don't share parents or staggers.

---

## 7. `AnimatePresence`

### Where FoodOps Uses It
Utilized in [RegisterForm.tsx](file:///d:/FINAL_FOODOPS/src/app/register/RegisterForm.tsx) for onboarding step switches and to render errors/status messages dynamically.

### What Problem It Solves
React instantly unmounts conditional components, causing them to disappear abruptly. `AnimatePresence` holds the element in the DOM until its exit animation completes.

### Simplified Code Example
```tsx
import { AnimatePresence, motion } from "motion/react";

export function ConditionalMessage({ show }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          Dynamic Alert Message
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

### When to Use It
*   For collapsing alerts, notification banners, step wizards, and modal closures.

### When NOT to Use It
*   For toggling styling only (use class changes or style variables instead).

---

## 8. `layout`

### Where FoodOps Uses It
Used in active rescue cards to animate height shifts when organic waste diversion sections expand or collapse.

### What Problem It Solves
Changes to layout attributes (height, width, flex position) normally trigger layout shifts that snap instantly. Adding the `layout` prop animates these layout shifts smoothly.

### Simplified Code Example
```tsx
<motion.div layout className="bg-surface p-4">
  <p>Standard header</p>
  {isOpen && <p>Expanded details section</p>}
</motion.div>
```

### When to Use It
*   For accordions, details panels, lists that change length, and tabs.

### When NOT to Use It
*   Avoid adding it to complex parent grids, as it can cause inner text stretching or performance degradation.

---

## 9. `whileInView` (Scroll Reveals)

### Where FoodOps Uses It
Animate the Roadmap ([RoadmapSection.tsx](file:///d:/FINAL_FOODOPS/src/components/Home/RoadmapSection.tsx)) and ESG Metrics card rows ([EsgMetrics.tsx](file:///d:/FINAL_FOODOPS/src/components/Home/EsgMetrics.tsx)) as they scroll into view.

### What Problem It Solves
Elements that load below the fold are missed by mounting animations. Triggers entrance animations only when they are visible in the user's viewport.

### Simplified Code Example
```tsx
<motion.div
  initial={{ opacity: 0, y: 15 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-50px" }}
>
  Scroll Reveal Card
</motion.div>
```

### When to Use It
*   For landing pages, info cards, features, and timeline steps below the viewport.

### When NOT to Use It
*   For elements above the fold (use standard mounting animations instead) or sidebars.

---

## 10. `useReducedMotion` (Accessibility)

### Where FoodOps Uses It
Integrated at the top of all our custom motion wrappers to verify user preferences.

### What Problem It Solves
Ensures accessibility compliance. Users with vestibular disorders or motion sensitivity can disable animations at the operating system level. The hook checks this preference to disable translations and staggers.

### Simplified Code Example
```tsx
import { useReducedMotion } from "motion/react";

export function AccessibleCard() {
  const shouldReduce = useReducedMotion();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduce ? 0 : 15 }}
      animate={{ opacity: 1, y: 0 }}
    >
      Safety-compliant Card
    </motion.div>
  );
}
```

### When to Use It
*   **MANDATORY** for any animation that shifts position, scales, rotates, or staggers.

### When NOT to Use It
*   Do not use it to hide actual content or remove status feedback.

---

## 11. State-Driven Animations

### Where FoodOps Uses It
Implemented in the 8-stage surplus pipeline connector ([LifecyclePipeline.tsx](file:///d:/FINAL_FOODOPS/src/components/Home/LifecyclePipeline.tsx)) and the donor progression stepper.

### What Problem It Solves
Draws a direct link between real application data and presentation. It ensures animations correspond to the actual status of the model, rather than faking timers.

### Simplified Code Example
```tsx
export function ProgressLine({ status }) {
  const activeStep = ['AVAILABLE', 'ACCEPTED', 'COMPLETED'].indexOf(status);
  
  return (
    <div className="relative">
      <motion.div 
        className="h-1 bg-primary"
        animate={{ width: `${(activeStep / 2) * 100}%` }}
      />
    </div>
  );
}
```

### When to Use It
*   For logistics tracking, order states, claim lock indicators, and OTP verification feedback.

### When NOT to Use It
*   Do not combine with mock timers or fake animations. Keep the data strictly backed by Server Action returns.
