# ASA Vendor Review Hub — five-minute demo

## Portfolio dashboard and rejection analytics

Open the Render URL with `?demo=1`. A fresh browser automatically loads 140 fictional records: 120 approved routine cases, four Pending reviews, and 16 reviewer-recorded rejections. The expanded analytics are available immediately; there is no sample-loading box or per-case sample badge. The footer identifies the portfolio as fictional so the presentation remains clear about the data source.

### Set up the presentation

1. Start the local app with `py server.py` and open `http://127.0.0.1:8000?demo=1` in the browser you will record. The hosted presentation URL should also include `?demo=1`.
2. The app loads the 140-case portfolio once in that browser. A dataset version update replaces generated portfolio records and preserves manually entered cases.
3. Show the Overview totals, then open **Analytics**. The case counts, charts, and rejection register all derive from those saved records.

### Narration for the portfolio

**Say:** "This portfolio has 120 routine cases, four that are awaiting reviewer action, and 16 that reviewers closed with a recorded reason. The examples are fictional, and their generated evidence lets us demonstrate the workflow without presenting private vendor information."

**Show:** Overview totals. In Analytics, point out the approval rate across final outcomes, current work needing action, and the disposition chart. Show the monthly intake trend and country mix, then compare the outcome mix by country. The routine portfolio is uneven by design: India 46, United States 28, United Kingdom 20, Canada 14, and Australia 12, with Pending and rejected cases added across those regions.

**Show:** The reviewer rejection reason chart, then the case-level rejection table. Open a row to show the reviewer reason and decision history. Point out that the reason categories summarize human decisions and the tool never rejects a vendor automatically. Show document coverage, workflow stages, and follow-up drafts for the operational view.

**Say:** "The charts show how volume, outcomes, and review reasons differ across the portfolio. An approval means the configured prototype checks passed; it is not an identity or registry verification. Rejections are human decisions, and Analytics keeps the reason visible for each one."

The portfolio records are fictional. The exception walkthrough below uses separate fictional evidence files that you attach live; analytics and case records are local to this browser.

### Exception desk walkthrough: four resolution paths

Open **Exception desk**. It prioritizes the four held cases and groups them as an evidence gap, tax correction, bank relationship review, and duplicate match. Each case opens a reviewer workbench with an evidence uploader, source checks, case-specific actions, and a saved audit trail. Attachments accept PDF, DOCX, TXT, CSV, PNG, and JPG up to 10 MB; scanned PDFs are not OCR'd.

All walkthrough files are in `demo_packet/edge_cases/`. Use the matching **Document type** in the case workbench. Each attachment replaces the same-kind illustrative source for that case. The reader extracts supported text, then the app automatically reruns Stage 3 completeness and Stage 4 comparison. The result does not save an onboarding decision; the reviewer still records one in Stage 5.

#### 1. Resolve missing bank proof

1. Open **Missing bank proof** for Westhaven Distribution Ltd.
2. Choose **Bank proof** and upload `demo_packet/edge_cases/01_westhaven_bank_proof.txt`; click **Attach and rerun checks**.
3. Show the new filename and extracted account-holder evidence. Stage 3 should clear the required-document flag; Stage 4 should match the bank holder.
4. In Stage 5, record the refreshed rule-based result. If approved, Stage 6 records no follow-up. The app never sends a vendor email.

**Say:** “The missing document is a hold, not a rejection. I attach the vendor’s bank proof, reread it, and rerun both checks. The source file now supports the holder name, and the analyst records the final outcome.”

#### 2. Correct a conflicting tax ID from two sources

1. Open **Tax ID correction required** for Silver Fern Supplies Pvt. Ltd.
2. Upload `02_silver_fern_replacement_tax.txt` as **Tax document**, attach and rerun. Then upload `02_silver_fern_replacement_registration.txt` as **Registration document**, attach and rerun.
3. Enter a note such as: “Both replacement documents show ABCDS1234K; the configured India shape passes. This is a syntax check, not registry verification.” Click **Apply paired value**.
4. The app only offers the correction when both actual uploaded source documents contain the same country-shaped ID. It records the filenames and note, updates the submitted ID, then reruns Stages 3 and 4. Show the extracted evidence and the resulting checks before recording the decision.

**Say:** “The tool does not guess which tax number is right. I provide corrected tax and registration evidence, confirm that both sources agree, and explain why I accept the value. The original mismatch stays in the audit timeline.”

#### 3. Review an authorized affiliate bank account

1. Open **Bank holder differs from vendor name** for Riverstone Components Ltd.
2. Upload `03_riverstone_bank_proof.txt` as **Bank proof**, attach and rerun. The name difference should remain visible.
3. Upload `03_riverstone_relationship_evidence.txt` as **Bank relationship evidence**, attach and rerun.
4. Add an analyst note, for example: “The affiliate letter and current bank confirmation support the authorized settlement relationship; both were reviewed against policy.” Click **Record relationship review and rerun comparison**.
5. Stage 4 marks the relationship check as reviewed while preserving both submitted names and showing the evidence filename and note. The analyst still records the Stage 5 decision.

**Say:** “A name mismatch should not be silently normalized. The reviewer checks current bank proof and the relationship evidence, records the basis, and the comparison explains that the source names remain unchanged.”

#### 4. Confirm the possible duplicate and record a reasoned rejection

1. Open **Possible duplicate submission** for Mosaic Field Services Ltd. In Stage 4, show the linked case and whether the same country/tax ID, legal name, or email matched.
2. In **Confirm duplicate — reviewer reason**, enter: “Same legal name, country, tax ID, and contact email as ASA-26-0050. This submission repeats the existing vendor profile.” Click **Confirm duplicate and prepare rejection**.
3. The duplicate stays a review signal. Stage 5 is prefilled with **Rejected** and the reviewer’s reason; inspect it, then click **Make decision** to save the rejection.
4. Show the decision in **Decision outputs** or Analytics. The portfolio should now show 120 Approved, three Pending, and 17 Rejected without changing the total of 140. The new reason appears under reviewer decisions. The system never rejects automatically.

**Say:** “A possible duplicate only prompts investigation. I compare the linked record and record the rejection reason as the analyst. The case is not rejected until I save that explicit decision.”

**Optional false-positive branch:** attach `04_mosaic_entity_separation.txt` as **Entity separation evidence**, rerun, add a reviewer note explaining the evidence, and choose **Record distinct-entity review and rerun comparison**. The interface warns that matching ID and contact details remain serious signals; use this only as a training path, not as proof that a real duplicate is cleared.

### What the exception flow demonstrates

- A vendor PDF or supporting PDF can be attached to a case; selectable text is read with the existing free local reader, with no paid AI service or API key.
- New evidence replaces the same document type, preserves other source records, and triggers Stage 3 and Stage 4 again.
- Tax corrections require the same valid-shape value from actual Tax and Registration documents, plus an analyst note.
- Bank relationship overrides require current Bank proof, separate relationship evidence, and an analyst note; submitted names are not rewritten.
- Duplicate matches link to the compared case. A true duplicate requires an explicit reasoned Stage 5 reviewer rejection.
- Decisions and evidence actions are appended to the case audit trail; the application does not send emails or make registry lookups.
## Show the PDF intake and vendor evidence planner

Use `demo_packet/00_vendor_submission.pdf` for a separate intake demo. It contains only fictional, selectable text.

1. Open **New review**, choose the sample PDF, and click **Read PDF**.
2. Show that each detected value is tied to the PDF page and evidence line. Click **Use** for the business name, country, tax ID, email, bank holder, and vendor service type. Pause to confirm the form fills only after the analyst applies each suggestion.
3. Attach the separate registration, tax, and bank proof files. Explain that the vendor's application PDF is the intake form and does not replace those evidence documents.
4. Open **Analyst Copilot > Vendor evidence planner**. Choose **Goods, equipment, or supplies**, mark **Goods or services cross borders**, and click **Build evidence checklist**. Point out the origin/import paperwork item and its rationale. Try the personal-data flag with a software or data-processing vendor to demonstrate a different checklist.

**Say:** "A vendor can send one completed PDF instead of having the analyst retype every field. The free reader extracts selectable text and shows the source page; the analyst chooses which suggestions to apply. The evidence planner then tailors confirmation documents to the type of work and flags conditional items based on scope. It explains why each item may be useful, while the reviewer and company policy decide what is required."

Scanned PDFs are not OCR'd in this free prototype. Enter those values manually, and use only fictional files on the hosted demo: uploaded files are sent to the demo server for text extraction and are not retained by the app.

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
