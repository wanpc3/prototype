import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Sidenav from './Components/Sidenav/Sidenav';
import PartnerDetails from './Components/Partner/PartnerDetails';
import AddPartner from './Components/Partner/AddPartner';
import LoadingOverlay from './Components/Common/LoadingOverlay';
import Review from './Components/Review/Review';
import AuditLog from './Components/AuditLog/AuditLog';
import './App.css';

// Define your backend API base URL
const API_BASE_URL = 'http://localhost:5000/api';

function App() {
  //Partners state - will be fetched from backend
  const [partners, setPartners] = useState([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState(null);
  const [isAddPartnerModalOpen, setIsAddPartnerModalOpen] = useState(false);

  //Loading Screen Indicator
  const [isAnalyzing, setIsAnalyzing] = useState(false); // For file upload/anonymization process
  const [loadingPartners, setLoadingPartners] = useState(true); // For initial partners fetch
  const [error, setError] = useState(null); // For general fetch errors

  // Human Review
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewData, setReviewData] = useState(null); // Detected PII for review
  const [currentFileBeingReviewed, setCurrentFileBeingReviewed] = useState(null); // The file object currently in review

  // Audit
  const [isAuditLogModalOpen, setIsAuditLogModalOpen] = useState(false);
  const [auditLogData, setAuditLogData] = useState(null); // Audit log data for display

  // Helper function to determine file type based on extension (still useful for sending to backend)
  const getFileTypeFromExtension = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (['txt'].includes(ext)) {
      return 'Text file';
    } else if (['jpg', 'jpeg', 'png', 'bmp'].includes(ext)) {
      return 'Image file';
    } else if (['csv', 'xlsx', 'xlsm', 'xls'].includes(ext)) {
      return 'Tabular file';
    } else if (['doc', 'docx', 'pdf'].includes(ext)) {
      return 'Document file';
    }
    return 'Unknown file';
  };

  // Function to fetch partners from the backend
  const fetchPartners = useCallback(async () => {
    setLoadingPartners(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/partners`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setPartners(data);
      // If no partner is selected, and there are partners, select the first one
      if (!selectedPartnerId && data.length > 0) {
        setSelectedPartnerId(data[0].id);
      } else if (selectedPartnerId && !data.some(p => p.id === selectedPartnerId)) {
        // If previously selected partner was removed, clear selection or select new first
        setSelectedPartnerId(data.length > 0 ? data[0].id : null);
      }
    } catch (err) {
      console.error("Failed to fetch partners:", err);
      setError("Failed to load partners. Please ensure the backend is running and accessible.");
    } finally {
      setLoadingPartners(false);
    }
  }, [selectedPartnerId]); // Dependency on selectedPartnerId to re-fetch if it changes outside this component

  // Initial data fetch on component mount
  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]); // `fetchPartners` is in dependency array because it's a useCallback

  const selectedPartner = partners.find(p => p.id === selectedPartnerId);

  // Handle adding a new partner via backend API
  const handleAddPartner = async (newPartnerData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/partners`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPartnerData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const addedPartner = await response.json();
      await fetchPartners(); // Re-fetch all partners to update UI
      setIsAddPartnerModalOpen(false);
      setSelectedPartnerId(addedPartner.id); // Select the newly added partner
      alert(`Partner "${addedPartner.name}" added successfully!`);
    } catch (err) {
      console.error("Failed to add partner:", err);
      alert(`Error adding partner: ${err.message}`);
    }
  };

  // Handle file upload and initial PII analysis via backend API
  const handleFileUpload = async (filesToUpload) => {
    if (!selectedPartner) return;

    setIsAnalyzing(true); // Show analyzing overlay

    // For simplicity, we'll only process the first file if multiple are selected.
    // In a real app, you might iterate or queue them.
    const file = filesToUpload[0];
    const fileType = getFileTypeFromExtension(file.name);

    // Prepare metadata to send to backend
    const fileMetadata = {
      filename: file.name,
      type: fileType,
      // You might need to send the actual file data here using FormData
      // For this example, we're just sending metadata. Your backend needs to handle actual file upload.
    };

    try {
      // Assuming backend has an endpoint for initial upload and PII detection
      const response = await fetch(`${API_BASE_URL}/partners/${selectedPartner.id}/upload_and_analyze_file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fileMetadata),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const { fileId, detectedPii } = await response.json(); // Backend returns fileId and detected PII

      // Store data for review modal
      setReviewData(detectedPii);
      setCurrentFileBeingReviewed({
        id: fileId,
        filename: file.name,
        type: fileType,
        state: 'Pending Review', // Set to pending review
        downloadLink: '#', // Placeholder, backend would provide
        detectedPii: detectedPii, // Store original detectedPii for reference
      });
      setIsReviewModalOpen(true); // Open the review modal

    } catch (err) {
      console.error("Failed to upload and analyze file:", err);
      alert(`Error uploading and analyzing file: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  //Handle proceeding with anonymization after human review
  const handleProceedAnonymization = async (updatedDetectedPii) => {
    setIsReviewModalOpen(false); // Close review modal
    setIsAnalyzing(true); // Show analyzing for actual anonymization

    // Prepare data for backend: send the file ID and the reviewed PII data
    const anonymizationData = {
      fileId: currentFileBeingReviewed.id,
      reviewedPii: updatedDetectedPii,
      partnerId: selectedPartnerId, // Send partnerId for backend context
    };

    try {
      // Assuming backend has an endpoint to finalize anonymization
      const response = await fetch(`${API_BASE_URL}/files/${currentFileBeingReviewed.id}/anonymize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(anonymizationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // Backend should return the updated file object (with state: 'Anonymized' and auditLog)
      const { message, updatedFile } = await response.json();

      // Re-fetch all partners to update the UI with the anonymized file and its audit log
      await fetchPartners();

      alert(message || `${currentFileBeingReviewed.filename} has been anonymized!`);
      setReviewData(null); // Clear review data
      setCurrentFileBeingReviewed(null); // Clear current file being reviewed

    } catch (err) {
      console.error("Failed to proceed with anonymization:", err);
      alert(`Error anonymizing file: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle toggling file anonymization state (De-anonymize/Anonymize)
  const handleToggleFileAnonymization = async (partnerId, fileId) => {
    const partnerToUpdate = partners.find(p => p.id === partnerId);
    const fileToToggle = partnerToUpdate?.files.find(f => f.id === fileId);

    if (!fileToToggle) return;

    const newState = fileToToggle.state === 'Anonymized' ? 'De-anonymized' : 'Anonymized';

    try {
      const response = await fetch(`${API_BASE_URL}/files/${fileId}/state`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: newState }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      await fetchPartners(); // Re-fetch partners to ensure UI is in sync
      alert(`File state updated to ${newState} for ${fileToToggle.filename}.`);
    } catch (err) {
      console.error("Failed to toggle file anonymization:", err);
      alert(`Error toggling anonymization: ${err.message}`);
    }
  };

  //Handle cancelling the review process
  const handleCancelReview = () => {
    setIsReviewModalOpen(false);
    setReviewData(null);
    setCurrentFileBeingReviewed(null);
    alert('Review cancelled. File not anonymized.');
  };

  // Handle viewing the audit log for a file
  const handleViewAuditLog = async (file) => {
    if (!file.id) {
        alert('Cannot view audit log: File ID is missing.');
        return;
    }
    try {
        // Assuming backend has an endpoint to get audit log for a file
        const response = await fetch(`${API_BASE_URL}/files/${file.id}/auditlog`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const auditData = await response.json();
        setAuditLogData({
            filename: file.filename, // Use filename from current file object
            fileType: file.type,     // Use fileType from current file object
            ...auditData // Merge backend audit data (intendedFor, anonymizedMethod, detectedEntitiesSummary)
        });
        setIsAuditLogModalOpen(true);
    } catch (err) {
        console.error("Failed to fetch audit log:", err);
        alert(`Audit log not available for this file: ${err.message}`);
    }
  };

  // Handle closing the audit log modal
  const handleCloseAuditLog = () => {
    setIsAuditLogModalOpen(false);
    setAuditLogData(null);
  };

  // --- Initial Loading State for Partners ---
  if (loadingPartners) {
    return <LoadingOverlay message="Loading partners..." />;
  }

  // --- Error State for Partners ---
  if (error) {
    return (
      <div className="app-container error-container">
        <p className="error-message">{error}</p>
        <button onClick={fetchPartners} className="retry-button">Retry</button>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Sidenav */}
      <Sidenav
        partners={partners}
        selectedPartnerId={selectedPartnerId}
        onSelectPartner={setSelectedPartnerId}
        onAddPartnerClick={() => setIsAddPartnerModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="main-content">
        {selectedPartner ? (
          <PartnerDetails
            partner={selectedPartner}
            onFileUpload={handleFileUpload}
            onToggleFileAnonymization={handleToggleFileAnonymization}
            onViewAuditLog={handleViewAuditLog}
          />
        ) : (
          <div className="no-partner-selected">
            {partners.length === 0 ? "No partners found. Add a new partner to begin!" : "Select a partner to view details."}
          </div>
        )}
      </div>

      {/* Add Partner Modal */}
      {isAddPartnerModalOpen && (
        <AddPartner
          onClose={() => setIsAddPartnerModalOpen(false)}
          onCreatePartner={handleAddPartner}
        />
      )}

      {/* Review Before Anonymization Modal */}
      {isReviewModalOpen && currentFileBeingReviewed && (
        <Review
          fileName={currentFileBeingReviewed.filename}
          fileType={currentFileBeingReviewed.type}
          detectedPii={reviewData}
          onProceed={handleProceedAnonymization}
          onCancel={handleCancelReview}
        />
      )}

      {/* Audit Log Modal */}
      {isAuditLogModalOpen && auditLogData && (
        <AuditLog
          auditData={auditLogData}
          onClose={handleCloseAuditLog}
        />
      )}

      {/* Analyzing Overlay (for file upload/anonymization) */}
      {isAnalyzing && <LoadingOverlay message="Processing..." />}
    </div>
  );
}

export default App;