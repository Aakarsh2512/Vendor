# ASA Vendor Review Hub

## Run locally

1. Install the dependencies with `py -m pip install -r requirements.txt` (or use `python` in place of `py`).
2. Start the local app with `py server.py`.
3. Keep the local server running. You can open `http://127.0.0.1:8000` or open the existing `index.html` the same way you used it in Stage 1.

The server listens on the local machine only. Vendor records are stored in the browser; uploaded files are stored in that browser's local IndexedDB. Nothing is sent to an external service. Browser storage is scoped by origin, so keep using the same way of opening the app to see existing Stage 1 records.

## Workspace tabs

The ASA Vendor Review Hub has an Overview dashboard, New review form, Review queue, Analytics, Decision outputs, and a featured Analyst Copilot workspace. Analytics and case summaries are computed from cases saved in the current browser. The Analytics tab includes a portfolio takeaway with the outcome mix, leading review signal, open work, and document coverage. Opening a case report shows that case's decision, completeness checks, evidence matches, and document coverage with progress bars. Use the top-bar Night mode control to switch themes; the preference is saved in the browser. The prominent Copilot card in the sidebar and the top-bar button open the same help workspace.

## Cost-free local submission copilot

The intake screen includes an analyst copilot for ASA staff processing vendor packets. It shows a live completeness checklist, answers common document and tax-ID questions, and can read selected PDF, DOCX, TXT, or CSV files before the case is created. It shows each detected value with its source evidence; the analyst chooses whether to apply it.

The copilot uses the app's free text reader, fixed workflow rules, and the static reference library in `knowledge-base.js`. It is not a generative AI model and needs no account, API key, paid service, or extra package. Locally, files are read by the local app server. On the hosted presentation link, a selected file is sent to the demo server for in-memory text extraction and is not retained by the app; use fictional data only.

The dataset covers basic PAN/GSTIN shapes for India, EIN for the United States, VAT number for the United Kingdom, BN/program account number for Canada, ABN for Australia, and a manual-review guide for Singapore UENs. Other locations receive a manual-review cue. Sources link to official government or regulator material: [Income Tax Department PAN overview](https://wmstatic-prd.incometaxindia.gov.in/web/guest/pan), [PAN format guidance](https://incometaxindia.gov.in/Documents/MOP_Volume_II.pdf), [GST Portal](https://tutorial.gst.gov.in/downloads/invoiceuploadofflineutility.pdf), [IRS](https://www.irs.gov/irm/part3/irm_03-024-038), [GOV.UK](https://www.gov.uk/register-for-vat/how-register-for-vat), [HMRC VAT guidance](https://www.gov.uk/hmrc-internal-manuals/enquiry-manual/em3058), [Canada Revenue Agency](https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/business-registration/business-number-program-account.html), [ACRA Singapore](https://www.acra.gov.sg/resources/guides-forms/applying-for-special-uen/), and [Australian Business Register](https://www.abr.gov.au/business-super-funds-charities/applying-abn).

The library is a focused, maintained reference set, not an exhaustive database of every tax ID or local rule. Its automatic checks only compare basic character and length shapes. They do not contact registries or confirm that an ID is active or belongs to the vendor. Keep a reviewer in the loop and recheck these references before a company deployment. The packet checklist describes this prototype's workflow, not a universal legal requirement.

## PDF-first intake and vendor evidence planner

On **New review**, a vendor can be processed from one completed, text-based PDF form. Choose **Read PDF** to extract labelled values, then use the source-linked suggestions to fill the intake fields. Each suggestion includes its page and evidence line; the analyst applies and confirms it before the case is saved. PDF uploads are limited to 10 MB. Scanned/image-only PDFs need manual entry because free OCR is not included.

The vendor's application PDF records their submitted details; it does not replace separate registration, tax, and bank-proof documents used in the later completeness and comparison stages. The submitted PDF is saved with the case in this browser and read by Stage 2 like the other attachments.

The **Analyst Copilot > Vendor evidence planner** offers typical and conditional confirmation records for software/cloud, consulting, goods, logistics, marketing, facilities, data processing, regulated services, and other vendors. Analysts can flag personal data, on-site work, cross-border activity, regulated goods, or production-system access to highlight relevant conditional items. Each recommendation explains why to ask for it. The curated list is a starting point, not an automatic compliance rule; confirm the scope, jurisdiction, and company policy.

For a ready-made demo, upload `demo_packet/00_vendor_submission.pdf`, apply its six suggestions, and attach the three separate text evidence files. In the evidence planner, choose **Goods, equipment, or supplies** and select the cross-border scope flag to show the origin/import paperwork recommendation.

## Local presentation portfolio

The Overview page can load 100 fictional, rule-passing vendor cases with an intentionally uneven country mix: India 38, United States 24, United Kingdom 16, Canada 12, and Australia 10. They are evaluated by the same local completeness, identifier-shape, comparison, duplicate, and decision rules used by the workflow. Each baseline sample has three simulated evidence records, a rule-based Approved decision, and a completed stage history. They are synthetic records, not uploaded files or real vendors; detail views label that evidence clearly.

After the baseline, add four Pending review scenarios (missing bank proof, invalid identifier shape, bank-holder/name mismatch, and possible duplicate) and eight reviewer-rejected examples. Rejections have explicit human override reasons; the automatic rules never reject a vendor. With all demo groups loaded and no other cases, the dashboard shows 100 Approved, 4 Pending, and 8 Rejected cases. Analytics includes a disposition donut, an intake trend line, a country column chart, workflow progress, and the loaded review scenarios. Decision outputs shows the outcome mix and rule-based/override/follow-up counts. Charts and counts use records saved in the current browser.

On a fresh presentation browser with no saved cases, the 100 baseline cases load once automatically. Otherwise open Overview and use **Load 100 baseline cases**, then **Add 4 pending cases** and **Add 8 rejected examples** when ready. When the dataset version changes, existing synthetic samples are replaced with the new baseline while manually entered cases are preserved. **Clear demo data** removes only synthetic samples and preserves manual cases. A hosted link shows the presentation controls only when opened with ?demo=1; a hosted link without that flag does not seed the sample portfolio.

## Public presentation deployment (Render)

`render.yaml` configures a free Render Python web service for this case-study preview. Put this folder in a Git provider repository, connect that repository in Render, and create the service from its Blueprint. The public presentation URL should end in ?demo=1; a clean browser seeds the 100-case baseline, and Overview lets the presenter add four Pending examples and eight reviewer-rejected examples.

The presentation build keeps case records in each visitor's browser; it does not provide shared company analytics or sign-in. Uploaded files sent to the hosted text reader are processed by the demo server and not stored by the app. The intake page warns visitors to use fictional data only. Render Free services can spin down after 15 minutes idle and may take about a minute to wake; local filesystem changes do not persist. This is suitable for a case-study video, not a live company workflow.

For a company deployment, move case records to a shared database, files to protected server-side storage, add employee sign-in and role checks, and configure the hosted API and secrets for the deployment environment. Analytics and Copilot summaries should then read authorized server-side records rather than one browser's local history. Keep the local reference library available without external service calls and refresh its entries and source dates through an owner-reviewed update process. The copilot remains rule-based unless a model service is deliberately selected and configured.

## Stage 2 document reading

The local reader can extract selectable text from PDF, DOCX, TXT, and CSV files. It looks for labelled vendor fields and returns the matching source line and PDF page number. Scanned PDFs and image files are identified as needing OCR; this prototype does not include OCR yet. The extraction uses explicit text patterns, not an AI model, and the reviewer should confirm each result against its source.

## Stage 3 completeness and format checks

The checks cover the required intake fields, basic email syntax, whether registration/tax/bank-proof files are attached, and whether readable document text is available. Basic tax-ID shapes are driven by the local reference library for India, the United States, the United Kingdom, Canada, and Australia; Singapore UENs and other locations go to manual review. These checks do not verify an ID with a government registry and do not approve or reject a vendor.

## Stage 4 comparison

The comparison checks extracted legal name, bank account holder, tax ID, and country values against the intake form and checks disagreements between extracted documents. Duplicate hints are limited to the current browser's saved runs: same-country tax ID, same-country legal name, or matching contact email. Every mismatch and possible duplicate is a review signal, not an automatic rejection.

## Stages 5–7 decision, follow-up, and history

The rule-based decision approves only when the saved Stage 3 and Stage 4 checks all pass; otherwise it sets Pending. Rejected is available as a reviewer override and requires a reason. A Pending or Rejected outcome can generate an editable follow-up draft; the app never sends it. Stage 7 records a final result and an audit timeline in the browser. Re-running an earlier stage clears later results from the active decision while preserving the previous events in the timeline.
