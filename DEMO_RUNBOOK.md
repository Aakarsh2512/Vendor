# ASA Vendor Review Hub — five-minute demo

## Portfolio dashboard demo: normal cases first

For a hosted presentation, open the Render URL with ?demo=1. The first visit in a clean browser loads 100 baseline cases with an uneven country mix. Then add four Pending cases and eight reviewer-rejected examples.

Use this sequence for the dashboard and analytics recording, then record the edge cases as a second part. The portfolio contains fictional examples only. The normal cases are passed through the workflow's existing validation, comparison, and automatic decision functions. Their document items and extraction evidence are simulated records; there are no source files attached, and the detail view says so.

### Set up the normal portfolio

1. Start the local app with `py server.py` and open `http://127.0.0.1:8000` in the same browser you will record.
2. On a fresh browser, the app seeds 100 baseline cases once. If needed, go to **Overview** and click **Load 100 baseline cases**. A dataset update replaces old synthetic samples and preserves manual cases.
3. Show the Overview totals, then open **Analytics** and **Decision outputs**. These pages recalculate from the cases stored in this browser.
4. Record the baseline before loading edge cases. If you need a clean repeat, click **Clear demo data** on Overview; this preserves manually entered cases. Refresh and load the normal portfolio again.

### Narration for the baseline

**Say:** "This dashboard is populated with 100 fictional standard vendor submissions across five countries, with a deliberately uneven mix that reflects a more realistic intake portfolio. Each sample has three simulated evidence records and has been processed by the configured workflow rules, so we can inspect a useful baseline rather than a single hand-entered case."

**Show:** Overview totals and priority actions. Open Analytics and show the disposition donut, monthly trend line, country columns, approval rate, document coverage, and workflow stages. The baseline country mix is India 38, United States 24, United Kingdom 16, Canada 12, and Australia 10. Month values are part of the synthetic demo data.

**Say:** "The baseline gives us 100 out of 100 rule-based approvals. The charts show outcome mix, intake volume over time, and regional concentration. These are prototype checks on synthetic records, not live registry verification."

**Show:** Decision outputs. Point to the decision mix, rule-based count, reviewer overrides, follow-up drafts, and decision register. Open one row and show the synthetic evidence notice.

### Add review and rejection examples after the baseline

On Overview, click **Add 4 pending cases**. Analytics lists the four scenarios and Decision outputs should show 104 decisions: 100 Approved baseline cases and 4 Pending review cases, if there are no manual cases. Then click **Add 8 rejected examples**. The full presentation set now shows 112 decisions: 100 Approved, 4 Pending, and 8 Rejected.

- Missing bank proof.
- Tax ID shape needs review.
- Bank holder differs from vendor name.
- Possible duplicate submission.
- Eight reviewer overrides with visible reasons (confirmed duplicate, unresolved bank or registration details, tax ID not corrected, declined onboarding terms, or no response to follow-up).

**Say:** "These four exceptions remain Pending so an analyst can resolve the gap. I also added eight examples where a reviewer records a rejection with a reason. Rejection is a human override in this prototype, never an automatic outcome. All records are synthetic, and the rules only check formats and this browser's saved history."

End on **Analyst Copilot** to show its queue summary and suggested next actions. The copilot uses local deterministic rules and the country reference dataset; it has no paid API or hosted AI dependency.

## Demo case

Use this fictional vendor and the three text files in demo_packet. The tax ID is shaped to pass the prototype's India PAN syntax check; it is not a real or registry-verified ID.

| Form field | Demo value |
| --- | --- |
| Legal business name | Cedar Ridge Office Supplies Pvt. Ltd. |
| Country or region | India |
| Tax or registration ID | DEMOA1234F |
| Primary contact email | vendor.case01@example.com |
| Bank account holder | Cedar Ridge Office Supplies Pvt. Ltd. |

Use a fresh, unique demo record in this browser. Stage 4 searches saved browser records for duplicates, so reusing the same name, ID, or email can correctly produce a review flag.

## Recording setup

1. Start the app with py server.py and open http://127.0.0.1:8000.
2. Use fictional data only. Keep the app's local server running during the recording.
3. Upload 01_registration.txt as Registration document, 02_tax_document.txt as Tax document, and 03_bank_proof.txt as Bank proof.
4. Use a 1920 × 1080 window, begin at the top of the intake page, and pause briefly after each stage button so the result is readable.

## Narration and clicks

### 0:00–0:30 — Problem and approach

**Say:** “Vendor onboarding teams spend time checking whether a packet is complete and whether details agree across documents. This prototype gives the ASA analyst a traceable intake flow: it reads evidence, flags gaps, explains the result, and leaves the final decision with a person.”

**Show:** The intake page and the analyst copilot. Point to its Read, Compare, Follow up steps.

### 0:30–1:35 — Create a case from the packet

**Say:** “I’m recording the details from a fictional vendor packet. The copilot can read the selected files locally and suggest values with their source evidence. I can confirm each value before it enters the form.”

**Do:** Select the three text files in their matching upload cards. Click **Review packet and suggest fields**. Show the extracted values and filenames. Choose **Use** for the business name, country, tax ID, email, and bank account holder; verify the form values match the documents. The copilot should show 5 of 5 details and 3 of 3 documents. Click **Create review case**.

**Say:** “The suggestions don’t silently change the record. I confirm the values, and creating the case gives the review a run ID and timestamp.”

### 1:35–2:15 — Read and check completeness

**Do:** In the submission queue, open the new case with **View**. Click **Read documents**.

**Say:** “Stage 2 records what the local reader found and where it found it. Here, the registration and tax files agree on the name, country, and ID, and the bank proof supplies the account-holder name.”

**Do:** Click **Run checks**.

**Say:** “Stage 3 checks required fields, basic email and tax-ID shape, required document types, and readable text. These are syntax and completeness checks, not government verification.”

### 2:15–3:15 — Compare evidence

**Do:** Click **Compare details**. Pause over the result cards and source evidence.

**Say:** “Stage 4 compares the case with the documents and checks for conflicting values and possible duplicates in this browser’s saved cases. The useful output is not just a green status: the analyst can inspect which source supports each match. With this clean packet and a fresh demo record, all seven comparison checks should match.”

### 3:15–4:10 — Explain the decision

**Do:** Show the proposed decision, then click **Make decision** without selecting an override.

**Say:** “Because all configured checks passed, the rule-based proposal is Approved, with the reason that the completeness, format, and comparison checks passed. The reviewer can still override the outcome; a rejection requires a reason. The prototype doesn’t make an identity claim or contact an external registry.”

### 4:10–5:00 — Close the record

**Do:** In Stage 6, click **Record no follow-up**. In Stage 7, click **Complete run**. Show the final result and audit timeline.

**Say:** “An approved case needs no vendor follow-up, so I record that and complete the run. The final view keeps the outcome and the stage-by-stage history together. For a Pending case, the same workflow can prepare an editable follow-up draft for the analyst to review; it never sends the message.”

## Expected output

| Stage | Expected result for this clean packet |
| --- | --- |
| Copilot pre-read | 8 labelled values shown with file and evidence line; analyst applies the values |
| 2. Document reading | 3 of 3 files readable; 8 labelled fields extracted |
| 3. Completeness | 5 of 5 checks pass |
| 4. Comparison | 7 of 7 checks match, assuming this demo record is unique in browser history |
| 5. Decision | Proposed and recorded result: **Approved** |
| 6. Follow-up | “No follow-up needed” recorded; no email is sent |
| 7. History | Final result and audit timeline are visible |

### Stage 3 check details

Expect PASS for: all five required fields present; contact email has a basic valid shape; India PAN-like syntax matches; registration, tax, and bank-proof files are attached; and all three text files are readable.

### Stage 4 comparison details

Expect MATCH/PASS for: legal business name; bank account holder; tax ID (the registration and tax files agree); country; registered name versus bank account holder; no conflicting extracted values; and no possible duplicate in the browser's saved history.

The decision panel should explain: “All configured completeness, format, and comparison checks passed.” This is a rule-based result, not a registry or identity verification.

## Optional short exception clip

If the case-study rubric needs a non-approved outcome and communication, use the separate packet in demo_packet/pending_scenario:

| Form field | Demo value |
| --- | --- |
| Legal business name | Maple Harbor Business Supplies Ltd. |
| Country or region | India |
| Tax or registration ID | MAPLE5678A |
| Primary contact email | vendor.case02@example.com |
| Bank account holder | Maple Harbor Business Supplies Ltd. |

Upload that folder's registration and tax files, plus 03_bank_proof_mismatch.txt as Bank proof. The bank document says “Maple Harbor Trading Services Ltd.” Stage 3 should pass completeness and syntax; Stage 4 should flag the bank-holder and registered-name comparison; Stage 5 should propose Pending. Click **Prepare follow-up** to show an editable draft asking the vendor to confirm the bank-holder name and clarify its relationship to the registered business. The draft is not sent. Use a separate run from the happy path.
