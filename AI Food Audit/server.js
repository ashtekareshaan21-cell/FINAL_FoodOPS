const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { GoogleGenAI } = require('@google/genai');

// Ensure dotenv loads the .env file located next to server.js
dotenv.config({ path: path.join(__dirname, '.env') });

// Safe startup check requested by user
console.log("Backend working directory:", process.cwd());
console.log("GEMINI_API_KEY detected:", !!process.env.GEMINI_API_KEY);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure static file serving
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'add-donation-app/dist')));

// Configure Multer for in-memory file handling
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, JPEG, PNG, and WEBP images are allowed.'));
    }
  }
});

// Audit Handler function - NO MOCK OR FALLBACK DATA ALLOWED
async function handleFoodAudit(req, res) {
  try {
    // Find uploaded file from multer
    const file = req.file || (req.files && req.files[0]);

    // Safe Diagnostic Log: Image Received
    console.log('[FoodOPS Audit Request] Image received:', !!file);
    if (file) {
      console.log('[FoodOPS Audit Request] MIME type:', file.mimetype);
      console.log('[FoodOPS Audit Request] Image size (bytes):', file.size);
    } else {
      return res.status(400).json({ error: 'Food image is required for AI audit.' });
    }

    const fields = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY;

    // Check if API Key is configured
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE' || apiKey.trim() === '') {
      console.error('[FoodOPS Backend Error] GEMINI_API_KEY is not configured in .env file.');
      return res.status(400).json({
        error: 'GEMINI_API_KEY is not configured on the backend. Please add your GEMINI_API_KEY to the .env file.'
      });
    }

    // Call Google GenAI SDK with the exact received file buffer
    console.log('[FoodOPS Audit Request] Gemini request started...');
    
    const ai = new GoogleGenAI({ apiKey: apiKey });

    const foodName = fields.foodName || fields.food_name || 'Unspecified Food';
    const category = fields.foodCategory || fields.food_category || 'Cooked Meal';
    const quantity = fields.quantity ? `${fields.quantity} ${fields.unit || fields.quantityUnit || ''}` : 'Unspecified';
    const prepTime = fields.preparedAt || fields.prepTime || 'Recent';
    const availableUntil = fields.availableUntil || 'Unspecified';
    const location = fields.location || 'Unspecified';
    const foodType = fields.foodType || 'Unspecified';
    const packagingStatus = fields.containerType || fields.packagingStatus || fields.packagingType || 'Unspecified';
    const storageCondition = fields.storageCondition || 'Unspecified';
    const notes = fields.notes || 'None';

    const systemPrompt = `You are the FoodOPS AI Food Audit assistant. Your role is to independently analyze the uploaded food image and produce a structured 4-step audit.

DONOR-PROVIDED CONTEXT (use as reference, do NOT assume these are correct):
- Food Name: ${foodName}
- Food Category: ${category}
- Quantity: ${quantity}
- Food Type: ${foodType}
- Prepared At: ${prepTime}
- Available Until: ${availableUntil}
- Location: ${location}
- Container / Packaging: ${packagingStatus}
- Storage Condition: ${storageCondition}
- Additional Notes: ${notes}

The uploaded image is the PRIMARY EVIDENCE. Donor inputs are context only.

== STEP 1: FOOD TYPE VERIFICATION ==

PHASE A — VISUAL OBSERVATION (do this first, ignoring donor input):
Look at the uploaded image carefully.
Describe what you ACTUALLY SEE in the image, independent of anything the donor has entered.
Ask yourself: "If I had no prior information, what food (if any) would I say is in this image?"

Rules for PHASE A:
- If the image shows food, describe it accurately (e.g. "Chapati and vegetable sabji", "Cooked rice dish with vegetables", "Biryani in a large container").
- If the image shows an EMPTY container with no food, state that explicitly: "Empty container, no food visible."
- If the image is blank, white, black, extremely blurry, very dark, obstructed, or if food cannot be identified with reasonable certainty, state: "No identifiable food visible."
- Do NOT guess. Do NOT use the donor's Food Name as a hint for what you see.
- Do NOT copy the donor's Food Name into food_type_observed.
- If you are uncertain, default to "No identifiable food visible" rather than inventing a description.

Set food_type_observed to the result of PHASE A.

PHASE B — COMPARISON (compare PHASE A result against donor input):
Compare food_type_observed with the donor's Food Name ("${foodName}") and Category ("${category}").

Set food_type_match using EXACTLY one of:
  MATCHED         — The food visually observed in PHASE A is consistent with the donor's entered Food Name.
  PARTIAL_MATCH   — Some of the entered food is visible but the match is incomplete or the image shows additional/different food.
  MISMATCH        — The food visually observed in PHASE A clearly differs from the donor's entered Food Name.
  NOT_VERIFIABLE  — PHASE A could not identify any food (empty container, blank image, blurry, dark, obstructed, insufficient visual evidence).

Critical rules for PHASE B:
- If food_type_observed is "No identifiable food visible" or "Empty container, no food visible" → food_type_match MUST be NOT_VERIFIABLE.
- Never set MATCHED or MISMATCH if food_type_observed could not be determined.
- Never set food_type_match based only on the donor's input without visual confirmation.

Set food_type_message to one short sentence explaining your determination.
Examples:
  MATCHED:        "Uploaded image appears consistent with the entered food type: ${foodName}."
  MISMATCH:       "Entered food is ${foodName}, but the uploaded image appears to show [observed food]."
  NOT_VERIFIABLE: "No identifiable food is visible in the uploaded image."


== STEP 2: VISUAL QUALITY / INVESTIGATION CHECK ==

Inspect ONLY what is visibly observable in the uploaded image.
Your role is visual screening, not scientific testing.

Look for OBVIOUS visible indicators such as:
- Unusual discoloration (unexpected colour changes, unnatural patches)
- Mold-like growth (green, black, white, or fuzzy spots)
- Abnormal spots or patches that appear visibly wrong
- Visible foreign material (hair, insects, debris)
- Severely burnt or heavily charred appearance
- Visually spoiled or rotting appearance
- Leakage or visibly damaged food packaging
- Other clearly abnormal visible conditions

CRITICAL OPEN-CONTAINER RULE:
An open container is NOT a quality problem by itself.
Do NOT mark food as VISIBLE_CONCERN merely because:
- the container is open or uncovered
- the food is not sealed or packaged
- the food is in a large commercial or steel container
- the food appears home-cooked
If the visible food looks normal, return NO_OBVIOUS_VISUAL_CONCERN.

SAFETY LANGUAGE RULES:
- Do NOT claim "Food is safe" or "Food is unsafe"
- Do NOT claim "No bacteria" or "No contamination"
- Do NOT claim food is fresh or spoiled as a scientific fact
- Use wording such as "No obvious visible concern" or "Visible concern detected"

IMAGE UNCERTAINTY RULE:
If the image is blurry, too dark, obstructed, too distant, or otherwise insufficient to judge visible quality:
- Return quality_status = UNCLEAR
- Return investigation_needed = true
- Do NOT guess. Do NOT assume the food is fine.

EVIDENCE REQUIREMENT:
If you return quality_status = VISIBLE_CONCERN, you MUST list at least one specific visible observation in visible_issues.
Do NOT return VISIBLE_CONCERN without observable visual evidence.

Determine:
- quality_status: Use EXACTLY one of:
    NO_OBVIOUS_VISUAL_CONCERN — Food appears visually normal. No obvious visible concern identified.
    VISIBLE_CONCERN           — One or more obvious visible abnormalities are present in the image.
    UNCLEAR                   — Image does not provide enough visual evidence to assess condition.
- quality_message: One short sentence using the safety wording above. Do not claim safety or contamination.
- visible_issues: Array of strings — each item is a specific observable visual issue. EMPTY ARRAY if none.
- investigation_needed: true if quality_status is VISIBLE_CONCERN or UNCLEAR. false if NO_OBVIOUS_VISUAL_CONCERN.


== STEP 3: QUANTITY CHECK ==

Perform a VISUAL CONSISTENCY CHECK.
Compare the donor-entered quantity (${quantity}) with what is actually VISIBLE in the uploaded image.

CRITICAL LIMITATION — EXACT WEIGHT CANNOT BE DETERMINED FROM A PHOTO:
- Do NOT claim "X kg detected" from the image.
- Do NOT claim "quantity verified: ${quantity}".
- Do NOT mathematically calculate food weight from pixels.
- Do NOT treat the donor's entered quantity as confirmed just because the image shows food.
- Do NOT invent a specific quantity.
- ALWAYS note in quantity_message that exact quantity cannot be verified from the image.

VISUAL FACTORS TO OBSERVE:
1. Approximate visible amount and volume of food
2. Size and fullness of the visible container(s)
3. Number of visible containers or plates (if clearly countable)
4. Whether the amount visible appears broadly compatible with the donor's entered quantity

EMPTY CONTAINER RULE:
If the image shows an empty container or no visible food, but the donor entered a quantity:
  Return quantity_status = POSSIBLY_LESS_THAN_INPUT
  Explain that the container appears empty or no food is visible.

CANNOT_DETERMINE PREFERENCE:
If only part of the food is visible, or the container is opaque/closed, or the image is blurry or too distant:
  PREFER CANNOT_DETERMINE rather than guessing.
  Do NOT extrapolate from partial visibility.

EVIDENCE REQUIREMENT:
Whenever quantity_status is POSSIBLY_LESS_THAN_INPUT or POSSIBLY_MORE_THAN_INPUT:
  MUST provide specific visible evidence in visible_quantity_evidence explaining what you see.

STATUS VALUES — use EXACTLY one of:
  CONSISTENT_WITH_INPUT   — Visible amount appears broadly compatible with entered quantity.
                            This does NOT mean exact quantity is verified.
  POSSIBLY_LESS_THAN_INPUT — Visible food appears substantially less than the entered quantity.
  POSSIBLY_MORE_THAN_INPUT — Visible food appears substantially more than the entered quantity.
  CANNOT_DETERMINE         — Image does not provide enough information for comparison.

Determine:
- quantity_status: One of the four values above.
- quantity_message: A short sentence. ALWAYS state that exact quantity cannot be verified from the image.
- visible_quantity_evidence: One sentence describing specifically what you see (container size/fullness, number of plates, etc.).
- quantity_review_needed: true if quantity_status is POSSIBLY_LESS_THAN_INPUT, POSSIBLY_MORE_THAN_INPUT, or CANNOT_DETERMINE. false if CONSISTENT_WITH_INPUT.




== STEP 4: FINAL AI AUDIT CONCLUSION ==

Using the results from Steps 1, 2, and 3, produce a final audit conclusion.

Apply the FIRST matching rule (priority order):

RULE 1 — FOOD TYPE MISMATCH
  Condition: food_type_match = MISMATCH
  final_status = "FOOD_TYPE_MISMATCH"
  final_conclusion = "The uploaded image does not appear to match the entered food type."
  recommended_action = "Review the food details and uploaded image before proceeding."

RULE 2 — VISIBLE QUALITY CONCERN
  Condition: quality_status = VISIBLE_CONCERN
  final_status = "INVESTIGATION_NEEDED"
  final_conclusion = "A visible quality concern was identified in the uploaded image." (append the first visible_issue if present)
  recommended_action = "INVESTIGATION NEEDED — A visual concern was detected. Physical inspection is required before processing."

RULE 3 — IMAGE QUALITY UNCLEAR
  Condition: quality_status = UNCLEAR
  final_status = "MANUAL_VERIFICATION"
  final_conclusion = "The image does not provide enough visual information to reliably assess the food condition."
  recommended_action = "MANUAL VERIFICATION REQUIRED — Image quality is insufficient for visual screening."

RULE 4 — QUANTITY MISMATCH (only when food type is OK and quality is OK)
  Condition: (food_type_match = MATCHED or PARTIAL_MATCH) AND quality_status = NO_OBVIOUS_VISUAL_CONCERN AND (quantity_status = POSSIBLY_LESS_THAN_INPUT or POSSIBLY_MORE_THAN_INPUT)
  final_status = "QUANTITY_REVIEW"
  final_conclusion = Use the actual quantity_message. State exact quantity cannot be verified from the image.
  recommended_action = "QUANTITY REVIEW — The visible quantity may differ from the entered amount. Manual quantity verification recommended."

RULE 5 — QUANTITY CANNOT BE DETERMINED (only when food type is OK and quality is OK)
  Condition: (food_type_match = MATCHED or PARTIAL_MATCH or NOT_VERIFIABLE) AND quality_status = NO_OBVIOUS_VISUAL_CONCERN AND quantity_status = CANNOT_DETERMINE
  final_status = "MANUAL_VERIFICATION"
  final_conclusion = "The food quantity cannot be reliably determined from the uploaded image."
  recommended_action = "MANUAL VERIFICATION REQUIRED — Quantity cannot be assessed from this image."

RULE 6 — VERIFIED (all checks passed)
  Condition: (food_type_match = MATCHED or PARTIAL_MATCH) AND quality_status = NO_OBVIOUS_VISUAL_CONCERN AND quantity_status = CONSISTENT_WITH_INPUT
  final_status = "VERIFIED"
  final_conclusion = "The submitted food appears consistent with the provided food type, shows no obvious visible quality concern, and the visible quantity appears broadly consistent with the entered amount."
  recommended_action = "Proceed with donation processing."

DEFAULT: If no rule matches clearly, use final_status = "MANUAL_VERIFICATION".

SAFETY LANGUAGE RULES FOR FINAL CONCLUSION:
- Do NOT say "food is safe" or "food is unsafe"
- Do NOT say "no bacteria" or "no contamination"
- Do NOT claim food is fresh or spoiled as scientific fact
- Describe only the results of the visual checks

SAFETY RULES:
- Do not certify food safety or claim food is safe to eat.
- Do not claim the absence of bacteria, pathogens, or contamination.
- Do not determine exact weight from an image.
- A visible concern should trigger investigation, not an automatic declaration that food is unsafe.

Return ONLY a valid JSON object with exactly these fields:
{
  "food_type_observed": "string — what you actually see in the image",
  "food_type_match": "MATCHED" | "PARTIAL_MATCH" | "MISMATCH" | "NOT_VERIFIABLE",
  "food_type_message": "string — one short sentence explanation",

  "quality_status": "NO_OBVIOUS_VISUAL_CONCERN" | "VISIBLE_CONCERN" | "UNCLEAR",
  "quality_message": "string — one short sentence, no safety/contamination claims",
  "visible_issues": ["array of strings — specific observable visual issues only, empty if none"],
  "investigation_needed": true | false,

  "quantity_status": "CONSISTENT_WITH_INPUT" | "POSSIBLY_LESS_THAN_INPUT" | "POSSIBLY_MORE_THAN_INPUT" | "CANNOT_DETERMINE",
  "quantity_message": "string — mention entered quantity, describe what you see, always state exact qty cannot be verified",
  "visible_quantity_evidence": "string — one sentence describing specifically what you see (container size, fullness, plate count)",
  "quantity_review_needed": true | false,

  "final_status": "VERIFIED" | "QUANTITY_REVIEW" | "FOOD_TYPE_MISMATCH" | "INVESTIGATION_NEEDED" | "MANUAL_VERIFICATION",
  "final_conclusion": "string — one or two sentences. No safety/contamination claims.",
  "recommended_action": "string — the appropriate next action for the FoodOPS team"
}`;


    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: [
        {
          role: 'user',
          parts: [
            { text: systemPrompt },
            {
              inlineData: {
                mimeType: file.mimetype,
                data: file.buffer.toString('base64')
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json'
      }
    });

    console.log('[FoodOPS Audit Request] Gemini response received.');

    const responseText = response.text || '';
    let cleanedText = responseText.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    try {
      const parsed = JSON.parse(cleanedText);

      // Validate required 4-step fields are present
      const allowedTypeMatch = ['MATCHED', 'PARTIAL_MATCH', 'MISMATCH', 'NOT_VERIFIABLE'];
      const allowedQuality   = ['NO_OBVIOUS_VISUAL_CONCERN', 'VISIBLE_CONCERN', 'UNCLEAR'];
      const allowedQtyStatus = ['CONSISTENT_WITH_INPUT', 'POSSIBLY_LESS_THAN_INPUT', 'POSSIBLY_MORE_THAN_INPUT', 'CANNOT_DETERMINE'];
      const qualityStatus = allowedQuality.includes(parsed.quality_status) ? parsed.quality_status : 'UNCLEAR';
      // Derive investigation_needed from Gemini's value if provided, else infer from quality_status
      const investigationNeeded = (typeof parsed.investigation_needed === 'boolean')
        ? parsed.investigation_needed
        : (qualityStatus === 'VISIBLE_CONCERN' || qualityStatus === 'UNCLEAR');

      const result = {
        // Step 1 — Food Type Verification
        food_type_observed: parsed.food_type_observed || 'Unclear',
        food_type_match:    allowedTypeMatch.includes(parsed.food_type_match) ? parsed.food_type_match : 'NOT_VERIFIABLE',
        food_type_message:  parsed.food_type_message  || '',

        // Step 2 — Quality Check
        quality_status:       qualityStatus,
        quality_message:      parsed.quality_message || '',
        visible_issues:       Array.isArray(parsed.visible_issues) ? parsed.visible_issues : [],
        investigation_needed: investigationNeeded,

        // Step 3 — Quantity Check
        quantity_status:           allowedQtyStatus.includes(parsed.quantity_status) ? parsed.quantity_status : 'CANNOT_DETERMINE',
        quantity_message:          parsed.quantity_message || 'Exact quantity cannot be verified from the image.',
        visible_quantity_evidence: parsed.visible_quantity_evidence || '',
        quantity_review_needed:    (typeof parsed.quantity_review_needed === 'boolean')
          ? parsed.quantity_review_needed
          : (parsed.quantity_status !== 'CONSISTENT_WITH_INPUT')
      };

      // ── Step 4 — Final AI Audit Conclusion ──────────────────────────────
      const allowedFinal = ['VERIFIED', 'QUANTITY_REVIEW', 'FOOD_TYPE_MISMATCH', 'INVESTIGATION_NEEDED', 'MANUAL_VERIFICATION'];
      let finalStatus = allowedFinal.includes(parsed.final_status) ? parsed.final_status : null;

      if (!finalStatus) {
        // Server-side priority fallback mirrors the prompt priority
        const tm  = result.food_type_match;
        const qs  = result.quality_status;
        const qty = result.quantity_status;
        if      (tm === 'MISMATCH')                                                                      finalStatus = 'FOOD_TYPE_MISMATCH';
        else if (qs === 'VISIBLE_CONCERN')                                                               finalStatus = 'INVESTIGATION_NEEDED';
        else if (qs === 'UNCLEAR')                                                                       finalStatus = 'MANUAL_VERIFICATION';
        else if ((qty === 'POSSIBLY_LESS_THAN_INPUT' || qty === 'POSSIBLY_MORE_THAN_INPUT')
                 && (tm === 'MATCHED' || tm === 'PARTIAL_MATCH'))                                        finalStatus = 'QUANTITY_REVIEW';
        else if (qty === 'CANNOT_DETERMINE')                                                             finalStatus = 'MANUAL_VERIFICATION';
        else if (tm === 'MATCHED' && qs === 'NO_OBVIOUS_VISUAL_CONCERN' && qty === 'CONSISTENT_WITH_INPUT') finalStatus = 'VERIFIED';
        else                                                                                              finalStatus = 'MANUAL_VERIFICATION';
      }

      result.final_status       = finalStatus;
      result.final_conclusion   = parsed.final_conclusion   || '';
      result.recommended_action = parsed.recommended_action || '';

      // Safe diagnostic logs
      console.log('[FoodOPS Audit] food_type_observed:', result.food_type_observed);
      console.log('[FoodOPS Audit] food_type_match:', result.food_type_match);
      console.log('[FoodOPS Audit] quality_status:', result.quality_status);
      console.log('[FoodOPS Audit] investigation_needed:', result.investigation_needed);
      console.log('[FoodOPS Audit] quantity_status:', result.quantity_status);
      console.log('[FoodOPS Audit] final_status:', result.final_status);
      return res.json(result);
    } catch (parseError) {
      console.error('[FoodOPS Backend Error] Failed to parse Gemini response as JSON:', parseError.message);
      console.error('[FoodOPS Backend Error] Raw Gemini text (first 300 chars):', cleanedText.substring(0, 300));
      return res.status(500).json({ error: 'Gemini returned an invalid response format. Please try again.' });
    }

  } catch (geminiError) {
    console.error('[FoodOPS Backend Error] Gemini API call error:', geminiError.message || geminiError);
    return res.status(500).json({ error: `Gemini API request failed: ${geminiError.message || 'Unknown error'}` });
  }
}

// Register POST endpoints
app.post('/api/food-audit', upload.any(), handleFoodAudit);
app.post('/api/audit-food', upload.any(), handleFoodAudit);

// Handle multer error middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size too large. Maximum allowed size is 10MB.' });
    }
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

app.listen(PORT, () => {
  console.log(`FoodOPS Backend Server listening on http://localhost:${PORT}`);
});
