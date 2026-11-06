# Deliverable 2 — five-minute live demo script

**Format:** One continuous screen recording, maximum five minutes. No slides or editing. Show the happy path running in the app, then one live edge case. Narrate what each step does, what decision it produces, and why.

## Before recording

- Open the live site with the presentation portfolio: <https://asa-vendor-review-hub.onrender.com/?demo=1>.
- Use a fresh browser profile so the happy-path vendor does not match a case you entered earlier. The demo portfolio will seed in that browser.
- Have the files in `demo_packet/` and `demo_packet/edge_cases/` ready to choose. Use fictional information only.
- Keep the browser at 100% zoom and the whole app visible. Do not edit the recording.

## Happy path and required short edge case

| Time | What to show | What to say |
| --- | --- | --- |
| **0:00–0:20** | Start on **Overview**. Point to the case totals, open work, decisions, and navigation. | “This is the Vendor Review Hub running live. It gives the analyst one place to receive a vendor packet, check its evidence, record a decision, and see the case history. I’ll run a clean submission, then resolve one exception.” |
| **0:20–0:40** | Open **Analyst Copilot**. In the vendor evidence planner, choose **Goods, equipment, or supplies**, select **Goods or services cross borders**, and build the checklist. | “The Copilot helps the company reviewer decide what evidence to request for the work and its scope. This local checklist explains why an item may matter; policy and the analyst still decide what is required. It uses free rules and references, with no paid AI service or API key.” |
| **0:40–1:20** | Open **New review**. Choose `demo_packet/00_vendor_submission.pdf`, click **Read PDF**, scan the values and source lines, then click **Apply all 6 suggestions**. Confirm these details: **Cedar Ridge Office Supplies Pvt. Ltd.**, **India**, **DEMOA1234F**, **vendor.case01@example.com**, and bank holder **Cedar Ridge Office Supplies Pvt. Ltd.** Attach `01_registration.txt`, `02_tax_document.txt`, and `03_bank_proof.txt` under their matching types. Briefly point out the Copilot completeness guidance. | “The vendor’s completed PDF supplies the intake details. I review the six source-linked values, then apply them together to keep intake quick. I attach registration, tax, and bank proof separately because the application PDF does not replace verification evidence. The Copilot highlights missing details and helps me see what still needs attention.” |
| **1:20–1:35** | Click **Create review case**. Show the new case ID and Stage 1 status in the case view. | “Creating the case assigns a run ID and timestamp. That gives the review a traceable record before checks begin.” |
| **1:35–1:55** | In **Stage 2**, click **Read documents**. Show the extracted values, filenames, and source evidence. | “The reader processes the attached files and shows the values with their source lines and PDF pages where available. The analyst can inspect the evidence instead of relying on an unexplained result.” |
| **1:55–2:15** | In **Stage 3**, click **Run checks**. Show the five checks passing. | “Stage 3 checks required fields, basic email shape, country-specific ID format, required document types, and readable text. The ID rule checks syntax only; it does not contact a government registry.” |
| **2:15–2:40** | In **Stage 4**, click **Compare details**. Point to the name, bank holder, tax ID, country, cross-document consistency, and duplicate results. | “Stage 4 compares the form with its supporting documents, checks for conflicting values, and searches saved cases in this browser for matching names, IDs, or email. All seven configured checks pass for this unique packet. There is no external registry lookup.” |
| **2:40–3:00** | In **Stage 5**, show the proposed outcome and click **Make decision**. | “Because the saved completeness and comparison checks pass, the rule-based proposal is Approved. I record it as the analyst. A mismatch would stay Pending for review; a rejection always needs an explicit reviewer choice and reason.” |
| **3:00–3:20** | In **Stage 6**, click **Record no follow-up**. In **Stage 7**, click **Complete run** and show the final outcome and audit timeline. | “No follow-up is needed for this approved packet. I record that and complete the run. The final record keeps the decision and the actions taken at each stage together.” |
| **3:20–4:00** | Open **Analytics** and point to the charts. Then open **Decision outputs** and show the new case and an existing rejection reason. | “The dashboard reads from the saved cases. Analytics shows volume, regional mix, decisions, and reviewer rejection reasons; the decision register keeps each outcome and reason available at case level. This makes the process history useful across the portfolio, not only for one submission.” |
| **4:00–4:50** | Open **Exception desk**. Open Westhaven Distribution Ltd. (missing bank proof). Choose **Bank proof**, attach `demo_packet/edge_cases/01_westhaven_bank_proof.txt`, and click **Attach and rerun checks**. Show the evidence and refreshed Stage 3 and Stage 4 results. Click **Make decision** to record the refreshed result. | “Here the workflow starts with a missing bank proof, so the case is held Pending rather than rejected. I attach the vendor’s bank document. The reader extracts the account-holder name and reruns completeness and comparison automatically. The gap clears against the new evidence, and I record the final outcome as the reviewer.” |

## Values and expected happy-path result

| Intake field | Value |
| --- | --- |
| Legal business name | Cedar Ridge Office Supplies Pvt. Ltd. |
| Country or region | India |
| Tax or registration ID | DEMOA1234F |
| Primary contact email | vendor.case01@example.com |
| Bank account holder | Cedar Ridge Office Supplies Pvt. Ltd. |

For the happy path, expect all five Stage 3 checks to pass, all seven Stage 4 comparisons to match, and the rule-based proposal to be **Approved**. Stage 6 records no follow-up, and Stage 7 shows the final result and audit history. Counts in Analytics depend on what is already saved in that browser.

## Recording reminders

- Keep the narration focused on what the app is doing, why it made the proposal, and what the analyst confirms.
- Use the demo files; they contain fictional information. On the hosted site, uploaded files are sent to the free text reader for processing and are not retained by the app.
- Scanned/image-only PDFs need manual review because this prototype does not include OCR.
- The app uses local rules and curated guidance. It does not verify tax IDs with a registry, send vendor messages, or make the final reviewer decision on its own.
