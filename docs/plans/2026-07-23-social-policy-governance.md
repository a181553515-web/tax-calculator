# 社保政策数据治理审核版 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a local-only review build that prevents unverified social-insurance policies from producing misleading results and makes verified policies traceable and maintainable.

**Architecture:** Keep GitHub Pages and browser-only calculations. Move policy records into a versioned browser-loadable data source, retain a small pure calculation engine, and render result metadata from the selected policy. Block geographic-policy calculation unless a complete, verified, effective policy record is selected; allow explicitly labelled manual-input calculations.

**Tech Stack:** Static HTML, browser JavaScript, JSON, Node.js built-in test runner, Git.

---

### Task 1: Establish policy-data contract

**Files:**
- Create: `data/social-insurance/policies.v1.js`
- Create: `data/social-insurance/README.md`
- Create: `js/social-policy-engine.js`
- Test: `tests/social-policy-data.test.js`

**Step 1:** Write data validation tests for required provenance fields, effective dates, and the rule that only complete `verified` records may contain a calculation payload.

**Step 2:** Run `node --test tests/social-policy-data.test.js`; expect failure because the data file does not exist.

**Step 3:** Create the policy-data file. Add a manual-input mode and reference-only examples that retain official source links but cannot calculate. Do not add a geographic record marked `verified` until it has been reviewed by 小波财税.

**Step 4:** Run the test; expect pass.

**Step 5:** Document the human review workflow: official source -> input -> test -> review -> release note.

### Task 2: Use policy data in the social-insurance page

**Files:**
- Modify: `social-insurance.html`
- Create: `js/social-insurance-app.js`
- Test: `tests/social-insurance-calculator.test.js`

**Step 1:** Write a failing calculation test for verified policy selection and an unavailable-result test for reference-only policy selection.

**Step 2:** Move hard-coded province tables out of the page. Add a browser-safe policy engine and application script, render the region selector, and fail closed when a geographic policy is not verified or not effective.

**Step 3:** Add a manual-input calculation mode for local review. It must require complete bases and rates and must label all results as user-entered parameters.

**Step 4:** Render effective dates, scope, review date, and official source links with every verified result.

**Step 5:** Run `node --test tests/social-insurance-calculator.test.js`; expect pass.

### Task 3: Correct user-facing interpretation and tool linkage

**Files:**
- Modify: `social-insurance.html`
- Modify: `index.html`
- Test: `tests/social-insurance-calculator.test.js`

**Step 1:** Write assertions for the result label and privacy wording.

**Step 2:** Replace “个人到手工资” with “扣五险一金后工资（未扣个税）”. Add a button to continue to the individual-income-tax calculator.

**Step 3:** Use only `sessionStorage` for same-tab transfer of salary and personal five-insurance-and-housing-fund deductions. Do not put inputs into URLs.

**Step 4:** Add an explicit local-calculation/privacy notice and a policy-data caveat.

**Step 5:** Run tests; expect pass.

### Task 4: Restore essential search and sharing metadata

**Files:**
- Create: `sitemap.xml`
- Create: `favicon.svg`
- Modify: `robots.txt`
- Modify: `index.html`
- Modify: `social-insurance.html`

**Step 1:** Add canonical URLs, descriptions, Open Graph URLs/images and application titles.

**Step 2:** Add a sitemap with the two calculator URLs and correct the robots reference.

**Step 3:** Add a lightweight local SVG favicon and use it in both pages.

**Step 4:** Confirm the files with `rg` and a local HTTP server.

### Task 5: Package an auditable local version

**Files:**
- Create: `CHANGELOG.md`
- Modify: `README.md`
- Modify: `部署说明.md`

**Step 1:** Write an unreleased changelog entry listing behavior changes and explicit non-deployment status.

**Step 2:** Add local test and review instructions to the README.

**Step 3:** Update deployment guidance to require review, test pass, and data-source check before production push.

**Step 4:** Inspect `git diff --check`, run all Node tests, and start a local server to manually open both pages.

**Step 5:** Commit only files created or modified by this plan with message `feat: add auditable social policy review build`.
