# Your PS-2 demo kit

A live happy path, four realistic edge cases, and the words to explain them.

Record one continuous walkthrough of no more than five minutes. The recommended recording is the happy path plus missing bank proof and its response loop. Keep the other three edge cases for the interview; trying to run all four in five minutes leaves too little time to explain the decisions.

## Start here

1. Extract ASA_Demo_Kit.zip and open this guide.
2. Open https://asa-vendor-ui-review.musicalbraid.chatgpt.site/demo/ and sign in with the Site owner account.
3. Use a dedicated browser profile or a fresh private window for rehearsal. Do not delete your working cases. Keep that same browser session for the duplicate test.
4. Open folder 01_Happy_Path in your file picker, and keep 02_Missing_Bank_Proof nearby.
5. Rehearse once with a timer. Aim to stop at 4:55; the timestamps are planning estimates, not measured speech timing.

## Scenario map

Folder | Expected result / key feature
01_Happy_Path | Approved → live review, PDF prefill, evidence, history
02_Missing_Bank_Proof | Pending → vendor request/response → Approved
03_Bank_Name_Conflict | Pending → source conflict → corrected proof → Approved
04_Invalid_Tax_ID | Pending → paired-source correction → Approved
05_Duplicate_Submission | Pending → reviewer confirms duplicate → Rejected
06_Extra_Robustness | Image-only bank PDF → Pending / needs manual review

All vendors and files are synthetic. IDs are shaped test strings and are not claims of real registrations. No real bank account details are included.


---

# Which PDF goes where?

File | Upload location
00_vendor_submission.pdf | Choose vendor submission PDF → Read PDF → Apply all suggestions
01_registration.pdf | Registration document slot
02_tax_document.pdf | Tax document slot
03_bank_proof.pdf | Bank proof slot

## Two important exceptions

Missing bank proof: upload only the submission, registration and tax PDFs at intake. Keep AFTER_REQUEST/03_bank_proof.pdf for the later vendor response. Attaching it immediately removes the edge case.

Invalid tax ID: 00_MANUAL_ENTRY_REFERENCE.pdf is a reading aid only. Do not upload it. Enter its five values into the form manually, then attach the three supporting PDFs. Those documents contain the corrected ID. This isolates a realistic form-entry error and lets you demonstrate paired-source correction without leaving an outdated submission PDF as conflicting evidence.

## Keep the demo repeatable

Run each scenario once in the same clean session. Recreating the happy path in that session will correctly trigger duplicate detection. For another rehearsal, use a new isolated profile/session. Merely removing ?demo=1 does not delete stored cases. Illustrative portfolio records are separate from the live cases you create; do not present them as executed tests.

## Feature checklist for the recording

Show PDF suggestions with page evidence; the real live stages; Approved and Pending; a case-specific Copilot answer; the source inspector; the actionable vendor request; response import and rerun; before/after history; and the queue or decision register. Keep theme switching and decorative views out of the timed demonstration.

## Recording setup

Use desktop Chrome at 100% zoom, ideally 1440×900 or larger. Check microphone and download permissions before recording. Pre-open the app and the folders, but create and run the two cases live. The Stage 1 intake is followed by six live-run tiles covering Stages 2–7. Fast stages may complete quickly: explain their saved results without suggesting a delayed animation is processing.


---

# Video script · happy path

0:00–1:45 | Exact actions and spoken words

## 0:00–0:20 | Frame the problem

SHOW / DO: Open the dashboard. Keep the browser at 100% zoom and the demo folders beside it.

SAY: A vendor can submit a complete-looking packet and still be unsafe to onboard. This workflow reads the documents, checks completeness and consistency, and gives the reviewer a clear status with the reason and the next action.

## 0:20–0:55 | Happy path: real PDF intake

SHOW / DO: New submission → choose 01_Happy_Path/00_vendor_submission.pdf → Read PDF → Apply all suggestions. Check the fields; attach 01_registration.pdf, 02_tax_document.pdf and 03_bank_proof.pdf in their named slots. Submit and open the new Maple Harbor case.

SAY: I’m starting with a fictional vendor, Maple Harbor. The reader extracts labelled values from this PDF and shows the source page. I confirm those suggestions, then attach separate registration, tax and bank evidence. The submission form alone is not enough to pass the review.

## 0:55–1:20 | Visible execution

SHOW / DO: Click Run review. Let the actual stages finish. Point to the stage results and Approved status.

SAY: The run reads the files, checks the required details and tax-ID shape, and compares the evidence. It also looks for a duplicate in this browser’s history. Here, all configured checks pass, so the case is approved and the result is recorded.

## 1:20–1:45 | Explainable result

SHOW / DO: Click Why this status? Show the evidence comparison and open one registration or tax source. Point to the filename, page and quoted value.

SAY: The decision is inspectable. The case Copilot explains the saved checks, and I can follow a value back to its document and page. This is a rules-based assistant. It explains the evidence we have; it does not independently verify the company with a government registry.


---

# Video script · edge case

1:45–3:35 | Missing proof and a useful follow-up

## 1:45–2:20 | Edge case: missing evidence

SHOW / DO: Close the case. Use 02_Missing_Bank_Proof/00_vendor_submission.pdf, Read PDF and Apply all suggestions. Attach only 01_registration.pdf and 02_tax_document.pdf. Leave Bank proof empty. Submit, open Amber Field and click Run review.

SAY: For the edge case, Amber Field has supplied its company and tax documents but left out bank proof. The form still contains an account-holder name. That claimed value cannot substitute for the missing supporting document, so I’m running the same process with incomplete evidence.

## 2:20–2:50 | Useful Pending state

SHOW / DO: Show Pending. Click What resolves this? Point to the missing-bank request and the stage waiting for evidence. Briefly show the vendor request section.

SAY: The outcome is Pending. It is not an automatic rejection. The Copilot identifies the missing bank proof and explains what the vendor needs to supply. The request carries the open requirements, so the analyst can ask a specific question instead of sending a vague follow-up.

## 2:50–3:35 | Vendor response loop

SHOW / DO: Download request page. Open that downloaded HTML in a second tab. In Bank proof choose 02_Missing_Bank_Proof/AFTER_REQUEST/03_bank_proof.pdf. Add a note, download the response JSON, return to Amber Field and use Import response. Keep the same case and latest request.

SAY: I’m switching roles to demonstrate the vendor response. The request page lets the vendor attach the missing proof and return a response file. In this prototype, the analyst sends and receives these files through an existing channel. Nothing is emailed automatically. Importing the response brings the evidence back into the same case.


---

# Video script · resolution

3:35–4:55 | Show the changed result and close

## 3:35–4:05 | Recheck and preserve history

SHOW / DO: Wait for the rerun to finish. Show Approved. Click What changed? and expand or scroll to response history and the audit timeline.

SAY: The new document triggers the checks again. The proof now matches the submission, so this case becomes approved. What changed shows the earlier Pending outcome, while response history preserves the prior decision and evidence. We can explain why the status changed instead of losing the original problem.

## 4:05–4:35 | Portfolio and design judgment

SHOW / DO: Close the case. Show Review queue and Decision outputs. Point to the two actual cases just created. If time allows, show the exceptions view without pretending seeded samples were executed.

SAY: The queue and decision register show the outcomes across runs. I also prepared bank-name conflicts, an invalid tax-ID entry and a duplicate submission for the interview. Each requires a deliberate next step. A duplicate is only a review signal; rejection requires an explicit reviewer decision and a recorded reason.

## 4:35–4:55 | Honest close

SHOW / DO: Keep the two completed cases on screen. End recording before five minutes.

SAY: The prototype stores cases in this browser. Scanned PDFs need manual review, and tax checks validate format rather than registry status. The demonstrated outcome is a runnable, traceable review process with a clear path for resolving missing evidence.

## If local HTML opening is blocked

Use this tested alternative for the same missing-proof case: in Exception Desk choose Bank proof, select AFTER_REQUEST/03_bank_proof.pdf, and click Attach and rerun checks. After Stage 3 and 4 refresh, click Make decision, Prepare follow-up, and Complete run. Replace the vendor-response narration with: “The vendor has returned the requested proof through our normal channel. I’m attaching it to the same case and rerunning the checks.” Do not claim you demonstrated response import if you used this route.

## Time budget

The main narration contains approximately 441 words. Speak naturally and leave silent pauses for uploads and result changes. If rehearsal exceeds five minutes, omit the source preview during the happy path or the portfolio detour at the end; preserve the live happy-path and edge-case runs. Do not rush the evidence explanation.


---

# Interview edge 2 · bank conflict

Use 03_Bank_Name_Conflict. Allow about 2–3 minutes.

## Upload and run

Use all four PDFs in the main folder in the normal slots. Intake says Willow Crest Logistics Pvt Ltd; the first bank proof says Willow Crest Holdings Pvt Ltd. Run review. Expected: Pending, with Bank account holder, Registered name vs bank account holder, and cross-document conflict flags. The missing-proof scenario has different flags; show the reason, not just the badge.

## Show the conflict

Click Which documents disagree? Open the bank source from the evidence comparison. Point to the two different holder names and the original bank PDF.

SAY: Every required document is attached, but the bank proof names a different entity. Completeness alone would miss this. The comparison keeps the case pending and exposes the specific conflicting source. A related company name is not enough to assume authorization.

## Resolve with new evidence

Download a fresh request page from this case. On it upload CORRECTED/03_bank_proof_corrected.pdf in Bank proof and add: “The initial proof belonged to a different group entity. Attached is the correct proof.” Download the response JSON, import it into this case, and wait for the rerun. Expected: Approved, with the prior conflict retained in response history. Click What changed?

SAY: For this fictional scenario, the vendor confirms it sent the wrong proof and returns a matching replacement. Importing that file reruns the checks. The case can now pass, while the original conflict remains in history. If the names were legitimately different, I would need relationship evidence and an explicit reviewer assessment instead.

## What this demonstrates

Source-based cross-checks; case-specific Copilot; correction without overwriting history; and a response that changes the result for an explainable reason. Do not change the entered company name to make a mismatch disappear.


---

# Interview edge 3 · invalid tax ID

Use 04_Invalid_Tax_ID. Allow about 2 minutes.

## Enter these values manually

Intake field | Value
legalName | Birch Vale Consulting Pvt Ltd
country | India
taxId | BAD-ID-4104
email | birch@vendor.example
accountHolder | Birch Vale Consulting Pvt Ltd

Do not upload 00_MANUAL_ENTRY_REFERENCE.pdf. Attach 01_registration.pdf, 02_tax_document.pdf and 03_bank_proof.pdf. Both registration and tax evidence show DEMOD4104J. Run review. Expected: Pending for the entered ID format and the mismatch between intake and source documents.

SAY: The vendor’s form contains an invalid India tax-ID shape. The underlying documents agree on a different value. I keep the case pending instead of guessing a correction from just one source. This check only tests the configured format; it does not prove the ID exists in a registry.

## Correct only after reviewing both sources

In Exception Desk, inspect the paired value DEMOD4104J. In Reviewer note enter: “The registration and tax PDFs both show DEMOD4104J. I checked both sources and confirm the submitted value was a data-entry error.” Click Apply paired value. After the completeness and comparison checks refresh, click Make decision with Use rule-based result selected. Then Prepare follow-up and Complete run. Expected: Approved with the correction and note in the timeline.

SAY: I can apply a correction only when the registration and tax evidence agree on a properly shaped value, and I record why I accept it. Applying the paired value reruns the checks. I then save the decision and finish the case, leaving the correction and its reason visible in the audit history.

## Why this case is deliberately entered by form

The error lives in the form entry, not in an uploaded vendor form PDF. If an old submission PDF also contains the wrong ID, it remains conflicting evidence and needs separate handling; this test does not claim that contradiction is automatically resolved.


---

# Interview edge 4 · duplicate

Use 05_Duplicate_Submission after the happy path. Allow about 2 minutes.

## Prerequisite and inputs

Keep the approved Maple Harbor case from 01_Happy_Path in the same browser. Create a new submission using all four PDFs in 05_Duplicate_Submission. These intentionally repeat the legal name, India tax ID and contact email. Run review. Expected: Pending with a linked Possible duplicate submission result. The individual evidence checks should pass.

SAY: This packet is internally consistent, but the same vendor already exists in the review history. The duplicate check points to the earlier case and the matching fields. It raises a review signal rather than automatically rejecting a vendor, because a shared detail can have a legitimate explanation.

## Show a reasoned rejection

In Exception Desk enter this in Confirm duplicate — reviewer reason: “This repeats the approved Maple Harbor case: the same India tax ID, registered name, and email. Close this intake and retain the approved original.” Click Confirm duplicate and prepare rejection. This only prepares the rejection. In Stage 5 inspect the selected Rejected override and reason, then click Make decision. Click Prepare follow-up and Complete run. Expected: Rejected / Reviewer override, with a note and timeline.

SAY: I’ve checked the linked record and confirmed this is the same vendor. I record my reason and explicitly save the rejection of this repeated intake. The original approved case remains. Rejection is therefore an accountable reviewer decision, not an unexplained automatic outcome.

## What to point out

Local-history scope; matched signals; linked original record; reason required for rejection; prepared vendor follow-up; and the reviewer event in history. Duplicate detection only sees this browser’s saved cases. Do not call it an organization-wide vendor-master lookup.


---

# Verification and rehearsal notes

Executed on 11 November 2026 using Chromium against the bundled application in a Cloudflare-compatible Worker runtime. Every scenario used the PDF files in this kit through the actual interface. This is local runtime verification of the hosted build, not a new production browser run or an external registry check.

Test | Observed result
Happy path: four real PDFs | Approved
Missing bank proof | Pending
Missing bank resolved by vendor response | Approved
Repeated vendor response blocked | Approved
Conflicting bank proof | Pending
Corrected bank evidence resolves conflict | Approved
Invalid tax ID entered in form | Pending
Paired-source tax correction | Approved
Duplicate submission matched to happy path | Pending
Reasonless rejection blocked | Pending
Duplicate rejected by reasoned reviewer decision | Rejected
Image-only PDF needs manual review | Pending
Direct attachment fallback resolves missing proof | Approved

## Extra technical check: scanned evidence

In a fresh isolated session, use the happy-path inputs but replace Bank proof with 06_Extra_Robustness/image_only_bank_proof.pdf. Expected: Pending and needs manual review / OCR. This is a real image-only PDF with no selectable text. The app should not claim it read or verified the account holder. This is an additional robustness check beyond the four business edge cases.

## What to say if asked what is missing

“The prototype uses deterministic extraction and rules, not a generative model. It validates configured syntax and consistency, not real-world legitimacy. I would add shared case storage, identity and access controls for a vendor portal, OCR with confidence review, and appropriate registry integrations before treating this as a production onboarding system.”

## Last rehearsal check

Confirm you can sign in, upload all PDFs, open the vendor request HTML, locate the downloaded response JSON, and complete the happy path plus missing-proof loop within five minutes. The Site remains owner-private: the hiring team needs an explicitly arranged access method before they can use its link. No sharing permissions were changed for this kit.
