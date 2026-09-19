// FoodOPS Frontend Logic

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const donationForm = document.getElementById('donationForm');
  const dropZone = document.getElementById('dropZone');
  const dropZoneContent = document.getElementById('dropZoneContent');
  const imageInput = document.getElementById('imageInput');
  const previewWrapper = document.getElementById('previewWrapper');
  const imagePreview = document.getElementById('imagePreview');
  const changeImageBtn = document.getElementById('changeImageBtn');
  const removeImageBtn = document.getElementById('removeImageBtn');
  const imageError = document.getElementById('imageError');
  const runAuditBtn = document.getElementById('runAuditBtn');
  const loadingOverlay = document.getElementById('loadingOverlay');
  const auditResultSection = document.getElementById('auditResultSection');

  // Form Input Elements
  const foodNameInput = document.getElementById('foodName');
  const foodCategorySelect = document.getElementById('foodCategory');
  const quantityInput = document.getElementById('quantity');
  const quantityUnitSelect = document.getElementById('quantityUnit');
  const preparedDateInput = document.getElementById('preparedDate');
  const preparedTimeInput = document.getElementById('preparedTime');
  const availableDateInput = document.getElementById('availableDate');
  const availableTimeInput = document.getElementById('availableTime');
  const locationInput = document.getElementById('location');
  const foodTypeSelect = document.getElementById('foodType');
  const containerTypeSelect = document.getElementById('containerType');
  const notesInput = document.getElementById('notes');

  // Result Elements — 4-Step Audit
  const resultImage          = document.getElementById('resultImage');
  // Step 1
  const resDonorFoodName     = document.getElementById('resDonorFoodName');
  const resFoodTypeObserved  = document.getElementById('resFoodTypeObserved');
  const resFoodTypeMatchBadge= document.getElementById('resFoodTypeMatchBadge');
  const resFoodTypeMessage   = document.getElementById('resFoodTypeMessage');
  // Step 2
  const resQualityMessage    = document.getElementById('resQualityMessage');
  const resVisibleIssues     = document.getElementById('resVisibleIssues');
  const resInvestigationAlert= document.getElementById('resInvestigationAlert');
  // Step 3
  const resProvidedQty       = document.getElementById('resProvidedQty');
  const resQuantityStatus    = document.getElementById('resQuantityStatus');
  const resQuantityMessage   = document.getElementById('resQuantityMessage');
  // Step 4
  const resStatusBanner      = document.getElementById('resStatusBanner');
  const resStatusIcon        = document.getElementById('resStatusIcon');
  const resStatusText        = document.getElementById('resStatusText');
  const resFinalConclusion   = document.getElementById('resFinalConclusion');

  let selectedFile = null;

  // Initialize Default Dates & Times
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const formatDate = (dateObj) => dateObj.toISOString().split('T')[0];
  const formatTime = (dateObj) => dateObj.toTimeString().split(' ')[0].substring(0, 5);

  preparedDateInput.value = formatDate(now);
  preparedTimeInput.value = formatTime(now);
  availableDateInput.value = formatDate(tomorrow);
  availableTimeInput.value = formatTime(tomorrow);

  // File Upload & Drag & Drop Handling
  dropZone.addEventListener('click', (e) => {
    if (e.target !== changeImageBtn && e.target !== removeImageBtn && !changeImageBtn.contains(e.target) && !removeImageBtn.contains(e.target)) {
      imageInput.click();
    }
  });

  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('dragover');
    }, false);
  });

  dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files && files.length > 0) {
      handleSelectedFile(files[0]);
    }
  });

  imageInput.addEventListener('change', (e) => {
    if (imageInput.files && imageInput.files.length > 0) {
      handleSelectedFile(imageInput.files[0]);
    }
  });

  function handleSelectedFile(file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPG, PNG, JPEG, or WEBP).');
      return;
    }

    selectedFile = file;
    imageError.classList.remove('visible');

    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.src = e.target.result;
      previewWrapper.style.display = 'block';
      dropZoneContent.style.display = 'none';
    };
    reader.readAsDataURL(file);
  }

  changeImageBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    imageInput.click();
  });

  removeImageBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    selectedFile = null;
    imageInput.value = '';
    imagePreview.src = '';
    previewWrapper.style.display = 'none';
    dropZoneContent.style.display = 'block';
  });

  // Form Validation & Submission
  donationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (validateForm()) {
      await runAIAudit();
    }
  });

  function validateForm() {
    let isValid = true;

    // Reset error states
    document.querySelectorAll('.error-msg').forEach(el => el.classList.remove('visible'));
    document.querySelectorAll('.form-control').forEach(el => el.classList.remove('invalid'));

    if (!foodNameInput.value.trim()) {
      foodNameInput.classList.add('invalid');
      document.getElementById('foodNameError').classList.add('visible');
      isValid = false;
    }

    if (!foodCategorySelect.value) {
      foodCategorySelect.classList.add('invalid');
      document.getElementById('foodCategoryError').classList.add('visible');
      isValid = false;
    }

    if (!quantityInput.value || parseFloat(quantityInput.value) <= 0) {
      quantityInput.classList.add('invalid');
      document.getElementById('quantityError').classList.add('visible');
      isValid = false;
    }

    if (!locationInput.value.trim()) {
      locationInput.classList.add('invalid');
      document.getElementById('locationError').classList.add('visible');
      isValid = false;
    }

    if (!selectedFile) {
      imageError.classList.add('visible');
      isValid = false;
    }

    return isValid;
  }

  // Main Audit Execution Function
  async function runAIAudit() {
    // Show Loading state
    loadingOverlay.style.display = 'block';
    auditResultSection.style.display = 'none';
    runAuditBtn.disabled = true;
    loadingOverlay.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const formData = new FormData();
    formData.append('foodName', foodNameInput.value.trim());
    formData.append('foodCategory', foodCategorySelect.value);
    formData.append('quantity', quantityInput.value);
    formData.append('quantityUnit', quantityUnitSelect.value);
    formData.append('preparedAt', `${preparedDateInput.value} ${preparedTimeInput.value}`);
    formData.append('availableUntil', `${availableDateInput.value} ${availableTimeInput.value}`);
    formData.append('location', locationInput.value.trim());
    formData.append('foodType', foodTypeSelect.value);
    formData.append('containerType', containerTypeSelect.value);
    formData.append('notes', notesInput.value.trim());
    formData.append('foodImage', selectedFile);

    try {
      const response = await fetch('/api/food-audit', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson.error || `Server error (${response.status})`);
      }

      const resultData = await response.json();
      if (resultData.error) {
        throw new Error(resultData.error);
      }
      
      renderAuditResult(resultData);

    } catch (err) {
      console.error('Audit API call error:', err);
      alert(`AI Audit Error: ${err.message || 'Request failed'}`);
    } finally {
      loadingOverlay.style.display = 'none';
      runAuditBtn.disabled = false;
    }
  }

  function renderAuditResult(data) {
    // Update image preview in result card
    const imagePreviewEl = document.getElementById('imagePreview');
    if (imagePreviewEl && imagePreviewEl.src) {
      resultImage.src = imagePreviewEl.src;
    }

    const qtyText = `${quantityInput.value || '?'} ${quantityUnitSelect.value || 'kg'}`;

    // ── STEP 1: Food Type Verification ──────────────────────────────
    resDonorFoodName.textContent    = foodNameInput.value.trim() || '—';
    resFoodTypeObserved.textContent = data.food_type_observed || 'Unclear';
    resFoodTypeMessage.textContent  = data.food_type_message  || '';

    // Match badge — class and label driven by Gemini's food_type_match
    resFoodTypeMatchBadge.className = 'match-badge';
    const matchMap = {
      'MATCHED':         { cls: 'matched',        label: '✓ MATCHED' },
      'PARTIAL_MATCH':   { cls: 'partial',         label: '~ PARTIAL MATCH' },
      'MISMATCH':        { cls: 'mismatch',        label: '✗ MISMATCH' },
      'NOT_VERIFIABLE':  { cls: 'not-verifiable',  label: '? NOT VERIFIABLE' }
    };
    const matchInfo = matchMap[data.food_type_match] || { cls: 'not-verifiable', label: '? NOT VERIFIABLE' };
    resFoodTypeMatchBadge.classList.add(matchInfo.cls);
    resFoodTypeMatchBadge.textContent = matchInfo.label;

    // ── STEP 2: Visual Quality Check ────────────────────────────────
    resQualityMessage.textContent = data.quality_message || '—';

    const issues = Array.isArray(data.visible_issues) && data.visible_issues.length > 0
      ? data.visible_issues.join('; ')
      : 'None obvious';
    resVisibleIssues.textContent = issues;

    // Show investigation alert driven entirely by Gemini's investigation_needed field
    // (VISIBLE_CONCERN → red alert, UNCLEAR → amber alert, NO_OBVIOUS_VISUAL_CONCERN → hide both)
    const investigationAlert = document.getElementById('resInvestigationAlert');
    const unclearAlert       = document.getElementById('resUnclearAlert');

    if (data.quality_status === 'VISIBLE_CONCERN') {
      if (investigationAlert) {
        investigationAlert.style.display = 'flex';
        investigationAlert.querySelector('span').textContent =
          '🚨 INVESTIGATION NEEDED — ' + (data.visible_issues && data.visible_issues.length > 0
            ? data.visible_issues[0]
            : 'A visible concern was detected in the image.');
      }
      if (unclearAlert) unclearAlert.style.display = 'none';
    } else if (data.quality_status === 'UNCLEAR') {
      if (investigationAlert) investigationAlert.style.display = 'none';
      if (unclearAlert) unclearAlert.style.display = 'flex';
    } else {
      if (investigationAlert) investigationAlert.style.display = 'none';
      if (unclearAlert) unclearAlert.style.display = 'none';
    }


    // ── STEP 3: Quantity Check ───────────────────────────────────────
    resProvidedQty.textContent     = qtyText;
    resQuantityMessage.textContent = data.quantity_message || 'Exact quantity cannot be verified from the image.';

    // Quantity status label — from Gemini's quantity_status
    const qtyStatusMap = {
      'CONSISTENT_WITH_INPUT':    '✓ Broadly consistent with entered quantity',
      'POSSIBLY_LESS_THAN_INPUT': '⚠ Possibly less than entered quantity',
      'POSSIBLY_MORE_THAN_INPUT': '⚠ Possibly more than entered quantity',
      'CANNOT_DETERMINE':         '— Cannot be determined from image'
    };
    resQuantityStatus.textContent = qtyStatusMap[data.quantity_status] || '— Cannot be determined from image';

    // Visible quantity evidence — show only when Gemini provided it
    const evidenceBox = document.getElementById('resQuantityEvidenceBox');
    const evidenceSpan = document.getElementById('resQuantityEvidence');
    if (data.visible_quantity_evidence && data.visible_quantity_evidence.trim()) {
      if (evidenceSpan) evidenceSpan.textContent = data.visible_quantity_evidence;
      if (evidenceBox) evidenceBox.style.display = 'flex';
    } else {
      if (evidenceBox) evidenceBox.style.display = 'none';
    }

    // Quantity review alert — driven entirely by Gemini's quantity_review_needed
    const qtyReviewAlert = document.getElementById('resQuantityReviewAlert');
    if (qtyReviewAlert) {
      qtyReviewAlert.style.display = data.quantity_review_needed ? 'flex' : 'none';
    }

    // ── STEP 4: Final AI Audit ─────────────────────────────────────────
    // Driven entirely by Gemini's final_status — no hardcoded frontend rules
    const finalStatusMap = {
      'VERIFIED':             { cls: 'verified',        icon: '✓',     text: 'VERIFIED' },
      'QUANTITY_REVIEW':      { cls: 'quantity-review', icon: '⚠️',   text: 'QUANTITY REVIEW' },
      'FOOD_TYPE_MISMATCH':   { cls: 'mismatch-status', icon: '⚠️',   text: 'FOOD TYPE MISMATCH' },
      'INVESTIGATION_NEEDED': { cls: 'investigation',   icon: '🚨', text: 'INVESTIGATION NEEDED' },
      'MANUAL_VERIFICATION':  { cls: 'manual',          icon: '⚠️',   text: 'MANUAL VERIFICATION REQUIRED' }
    };

    resStatusBanner.className = 'status-banner';
    const finalInfo = finalStatusMap[data.final_status] || finalStatusMap['MANUAL_VERIFICATION'];
    resStatusBanner.classList.add(finalInfo.cls);
    if (resStatusIcon) resStatusIcon.textContent = finalInfo.icon;
    resStatusText.textContent = finalInfo.text;

    if (resFinalConclusion) {
      resFinalConclusion.textContent = data.final_conclusion || '';
    }

    const actionBox  = document.getElementById('resFinalActionBox');
    const actionSpan = document.getElementById('resRecommendedAction');
    if (data.recommended_action && data.recommended_action.trim()) {
      if (actionSpan) actionSpan.textContent = data.recommended_action;
      if (actionBox)  actionBox.style.display = 'flex';
    } else {
      if (actionBox)  actionBox.style.display = 'none';
    }

    // Reveal Audit Result Section Smoothly
    auditResultSection.style.display = 'block';
    auditResultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});
