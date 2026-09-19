import React, { useState } from "react";
import { Camera, Sparkles, CheckCircle2, AlertTriangle, Info } from "lucide-react";

export default function AddDonationModal({ onAuditComplete }: { onAuditComplete?: (data: any) => void }) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [prepTime, setPrepTime] = useState("< 2 hrs ago");
  const [storageCondition, setStorageCondition] = useState("Room Temperature (Buffet Counter)");
  const [packagingStatus, setPackagingStatus] = useState("In Large Vessels (Bring Boxes/Containers)");
  const [isSelfDeclared, setIsSelfDeclared] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [auditResult, setAuditResult] = useState<any | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
      setErrorMessage(null);
    }
  };

  const handleRunAudit = async () => {
    if (!selectedFile || !isSelfDeclared) return;
    setIsLoading(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("foodImage", selectedFile);
    formData.append("image", selectedFile);
    formData.append("prepTime", prepTime);
    formData.append("storageCondition", storageCondition);
    formData.append("packagingStatus", packagingStatus);
    formData.append("foodName", "Open Leftover Meal (Buffet Vessel)");
    formData.append("foodCategory", "Cooked Meal");

    try {
      // Send request to Node backend endpoint /api/food-audit without manually setting Content-Type
      const res = await fetch("/api/food-audit", {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      setAuditResult(data);
      if (onAuditComplete) onAuditComplete(data);
    } catch (err: any) {
      console.error("Audit request failed:", err);
      setErrorMessage(err.message || "Failed to execute AI Audit. Please check backend server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-card">
      <div className="modal-header">
        <h2 className="modal-title">ADD DONATION</h2>
        <p className="modal-subtitle">Upload open food visual for automated safety and triage verification.</p>
      </div>

      <div className="modal-grid">
        {/* Upload Zone */}
        <div className={`upload-zone ${imagePreview ? "has-image" : ""}`}>
          {imagePreview ? (
            <div className="image-preview-wrapper">
              <img src={imagePreview} alt="Open Food Preview" className="preview-img" />
              <button
                type="button"
                onClick={() => {
                  setImagePreview(null);
                  setSelectedFile(null);
                  setAuditResult(null);
                }}
                className="retake-btn"
              >
                ✕ Retake
              </button>
            </div>
          ) : (
            <label className="upload-label">
              <div className="camera-icon-wrap">
                <Camera className="camera-icon" />
              </div>
              <span className="upload-btn">UPLOAD FOOD IMAGE</span>
              <p className="upload-hint">Scan Open Food Vessel (Buffet / Kitchen Pan)</p>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden-input"
                onChange={handleImageChange}
              />
            </label>
          )}
        </div>

        {/* Triage Column */}
        <div className="triage-col">
          <div className="field-group">
            <label className="field-label">Preparation Time (Cooking Window)</label>
            <div className="chip-grid">
              {["< 2 hrs ago", "2-4 hrs ago", "4+ hrs ago"].map((chip) => (
                <button
                  type="button"
                  key={chip}
                  onClick={() => setPrepTime(chip)}
                  className={`chip ${prepTime === chip ? "chip-active" : ""}`}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">Storage Condition</label>
            <select
              value={storageCondition}
              onChange={(e) => setStorageCondition(e.target.value)}
              className="select-input"
            >
              <option>Room Temperature (Buffet Counter)</option>
              <option>Hot Kept (&gt;65&deg;C / Bain-Marie)</option>
              <option>Refrigerated / Chilled (&lt;5&deg;C)</option>
            </select>
          </div>

          <div className="field-group">
            <label className="field-label">Packaging Status</label>
            <select
              value={packagingStatus}
              onChange={(e) => setPackagingStatus(e.target.value)}
              className="select-input"
            >
              <option>In Large Vessels (Bring Boxes/Containers)</option>
              <option>Pre-Packed in Individual Foil/Meal Boxes</option>
              <option>Sealed Bulk Containers (Ready to Load)</option>
            </select>
          </div>

          <div className="declaration-wrap">
            <label className="declaration-label">
              <input
                type="checkbox"
                checked={isSelfDeclared}
                onChange={(e) => setIsSelfDeclared(e.target.checked)}
                className="declaration-checkbox"
              />
              <span className="declaration-text">
                I certify this food is unconsumed leftover (not customer plate scraps) and has been handled under hygienic FSSAI standards.
              </span>
            </label>
          </div>

          <button
            type="button"
            disabled={!selectedFile || !isSelfDeclared || isLoading}
            onClick={handleRunAudit}
            className="audit-btn"
          >
            <Sparkles className="audit-icon" />
            {isLoading ? "Analyzing food image..." : "RUN AI AUDIT"}
          </button>

          {errorMessage && (
            <div className="error-alert">
              <AlertTriangle width={16} height={16} />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* AI Food Audit Result Section (Populated ONLY when audit completes) */}
      {auditResult && (
        <div className="audit-result-wrapper">
          <div className="result-card-header">
            <div className="result-card-title">
              <CheckCircle2 width={20} height={20} color="#059669" />
              <span>AI FOOD AUDIT RESULT</span>
            </div>

            <div
              className={`confidence-badge ${
                auditResult.confidence_score >= 85
                  ? "high"
                  : auditResult.confidence_score >= 60
                  ? "medium"
                  : "low"
              }`}
            >
              {auditResult.confidence_score >= 85
                ? `High Confidence (${auditResult.confidence_score}%)`
                : auditResult.confidence_score >= 60
                ? `Medium Confidence (${auditResult.confidence_score}%)`
                : `Low Confidence (${auditResult.confidence_score}%)`}
            </div>
          </div>

          <div className="result-metrics-grid">
            <div className="metric-box">
              <div className="metric-label">Food Type</div>
              <div className="metric-val highlight">{auditResult.food_type || "Unclear"}</div>
            </div>

            <div className="metric-box">
              <div className="metric-label">Food Category</div>
              <div className="metric-val">{auditResult.food_category || "Unclear"}</div>
            </div>

            <div className="metric-box">
              <div className="metric-label">Quantity Verification</div>
              <div className="metric-val">{auditResult.quantity_verification || "Cannot be determined from image"}</div>
            </div>

            <div className="metric-box">
              <div className="metric-label">Container / Packaging</div>
              <div className="metric-val">{auditResult.container_description || "Unclear"}</div>
            </div>

            <div className="metric-box">
              <div className="metric-label">Visual Condition</div>
              <div className="metric-val">{auditResult.visual_condition || "Appears normal"}</div>
            </div>

            <div className="metric-box">
              <div className="metric-label">Visible Issues</div>
              <div className="metric-val">
                {Array.isArray(auditResult.visible_issues) && auditResult.visible_issues.length > 0
                  ? auditResult.visible_issues.join(", ")
                  : "None obvious"}
              </div>
            </div>
          </div>

          <div className="safety-disclaimer-notice">
            <Info width={16} height={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>
              <strong>AI Visual Disclaimer:</strong> AI visual verification does not certify food safety or microbiological quality.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
