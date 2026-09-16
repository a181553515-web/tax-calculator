# Housing Fund Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** Add housing-fund contribution and loan tools while preserving the existing social-insurance calculator and sharing one contribution-policy source.

**Architecture:** Keep the current static HTML and CommonJS/browser-global pattern. Add pure calculation and policy-resolver modules with Node tests, then integrate them into the existing page through a two-level task switcher. Contribution limits continue to come from `social-policy-data.js`; loan rates and verified caps live in a new loan-policy file.

**Tech Stack:** Static HTML/CSS/JavaScript, Node.js built-in test runner, local browser validation.

---

### Task 1: Establish policy and calculation contracts

**Files:**
- Create: `housing-fund-policy-data.js`
- Create: `housing-fund-policy-resolver.js`
- Create: `housing-fund-calculation-engine.js`
- Create: `tests/housing-fund-calculation.test.js`
- Create: `tests/housing-fund-policy-resolver.test.js`

**Steps:**
1. Add failing tests for contribution clamping, reverse-base calculation, first/second-home rates, equal-payment schedules and principal-decreasing schedules.
2. Add failing tests proving the resolver returns the same contribution limits as `social-policy-data.js` for province and city entries.
3. Run `node --test tests/housing-fund-*.test.js` and confirm the missing modules fail.
4. Implement the minimum pure modules needed to pass.
5. Run the new tests and the complete existing test suite.
6. Commit as `feat: add housing fund policy and calculation engines`.

### Task 2: Add the three-task interface

**Files:**
- Modify: `social-insurance.html`

**Steps:**
1. Add static-structure tests for the three main entry buttons and two submodes in each public-fund section.
2. Add the main task switcher: 公积金缴存、公积金贷款、社保用工成本.
3. Add contribution inputs and compact results.
4. Add loan monthly-payment inputs, repayment-method switch and expandable schedule.
5. Add verified-cap lookup plus manual-cap fallback.
6. Keep the current social form inside its own panel without changing its IDs or handlers.
7. Run syntax and all tests.
8. Commit as `feat: add housing fund contribution and loan interface`.

### Task 3: Policy maintenance and regression safeguards

**Files:**
- Modify: `social-policy-data.js`
- Modify: `tests/housing-fund-policy-resolver.test.js`
- Create: `tests/housing-fund-policy-maintenance.test.js`

**Steps:**
1. Add metadata validation for reviewed dates, effective dates and sources.
2. Add a test preventing copied contribution limits in the new loan-policy file.
3. Document the single-update path in code comments and the design document.
4. Run all tests and commit as `test: guard shared housing fund policy data`.

### Task 4: Browser and mobile verification

**Files:**
- Modify as needed: `social-insurance.html`

**Steps:**
1. Serve the workspace locally with a simple HTTP server.
2. Verify all three main tasks at desktop width.
3. Verify contribution forward and reverse calculations at 375px width.
4. Verify first/second-home, equal-payment and principal-decreasing loan flows.
5. Verify the existing social forward and reverse flows still render and calculate.
6. Check for horizontal overflow and new console errors.
7. Run the full test suite and review the final diff.
8. Commit any visual corrections as `fix: refine housing fund mobile layout`.

