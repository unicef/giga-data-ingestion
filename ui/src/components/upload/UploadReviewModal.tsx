import { AddAlt, Renew } from "@carbon/icons-react";
import {
  Button,
  InlineLoading,
  InlineNotification,
  Modal,
  Stack,
} from "@carbon/react";

import { FuzzyCorrection, FuzzyValidationResponse } from "@/types/upload";
import { commaNumber } from "@/utils/number";

import FuzzyValidationModal from "./FuzzyValidationModal";

export interface UploadImpactPreview {
  newSchools: number;
  schoolsToUpdate: number;
}

interface UploadReviewModalProps {
  errorMessage: string | null;
  fuzzyErrorMessage: string | null;
  fuzzyValidationResult: FuzzyValidationResponse | null;
  impactPreview: UploadImpactPreview | null;
  isFuzzyLoading: boolean;
  isImpactLoading: boolean;
  onClose: () => void;
  onConfirmApplyCorrections: (corrections: FuzzyCorrection[]) => void;
  onRetryImpactPreview: () => void;
  onStartImport: () => void;
  open: boolean;
  step: "impact" | "fuzzy";
}

function UploadReviewModal({
  errorMessage,
  fuzzyErrorMessage,
  fuzzyValidationResult,
  impactPreview,
  isFuzzyLoading,
  isImpactLoading,
  onClose,
  onConfirmApplyCorrections,
  onRetryImpactPreview,
  onStartImport,
  open,
  step,
}: UploadReviewModalProps) {
  if (step === "fuzzy") {
    return (
      <FuzzyValidationModal
        errorMessage={fuzzyErrorMessage}
        isLoading={isFuzzyLoading}
        modalLabel="STEP 2 OF 2"
        onClose={onClose}
        onConfirmApply={onConfirmApplyCorrections}
        open={open}
        validationResult={fuzzyValidationResult}
      />
    );
  }

  const canStartImport = !!impactPreview || !!errorMessage;

  return (
    <Modal
      modalLabel="STEP 1 OF 2"
      modalHeading="Review"
      open={open}
      passiveModal={false}
      primaryButtonText={errorMessage ? "Continue anyway" : "Start import"}
      primaryButtonDisabled={isImpactLoading || !canStartImport}
      secondaryButtonText="Close"
      size="md"
      onRequestClose={onClose}
      onRequestSubmit={onStartImport}
      onSecondarySubmit={onClose}
    >
      <Stack gap={6}>
        <p>
          Please check the output below and click on "Start import" to begin
        </p>

        {isImpactLoading && (
          <InlineLoading
            description="Checking schools against the master dataset..."
            status="active"
          />
        )}

        {errorMessage && (
          <div className="space-y-3">
            <InlineNotification
              aria-label="upload impact preview error"
              kind="error"
              lowContrast
              title="Unable to check school IDs"
              subtitle={errorMessage}
            />
            <Button kind="tertiary" size="sm" onClick={onRetryImpactPreview}>
              Try again
            </Button>
          </div>
        )}

        {impactPreview && (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-gray-100 px-6 py-5">
              <div className="flex items-center gap-5">
                <AddAlt size={20} />
                <span>New schools</span>
              </div>
              <span className="font-semibold">
                {commaNumber(impactPreview.newSchools)}
              </span>
            </div>
            <div className="flex items-center justify-between bg-gray-100 px-6 py-5">
              <div className="flex items-center gap-5">
                <Renew size={20} />
                <span>Schools to be updated</span>
              </div>
              <span className="font-semibold">
                {commaNumber(impactPreview.schoolsToUpdate)}
              </span>
            </div>
          </div>
        )}
      </Stack>
    </Modal>
  );
}

export default UploadReviewModal;
