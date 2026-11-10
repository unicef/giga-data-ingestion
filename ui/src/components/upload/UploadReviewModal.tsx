import { AddAlt, Renew, RowDelete, WarningAlt } from "@carbon/icons-react";
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
  duplicateSchoolIdRows: number;
  missingSchoolIdRows: number;
  newSchools: number;
  schoolsToUpdate: number;
}

interface UploadReviewModalProps {
  errorMessage: string | null;
  /** Plural facility/entity label, e.g. "Health facilities" or "Schools". */
  entityLabel?: string | null;
  fuzzyErrorMessage: string | null;
  fuzzyValidationResult: FuzzyValidationResponse | null;
  impactPreview: UploadImpactPreview | null;
  missingCreateColumns: boolean;
  isFuzzyLoading: boolean;
  isImpactLoading: boolean;
  onClose: () => void;
  onConfirmApplyCorrections: (corrections: FuzzyCorrection[]) => void;
  onRetryImpactPreview: () => void;
  onStartImport: () => void;
  open: boolean;
  step: "impact" | "fuzzy";
}

function formatEntityLabel(raw: string | null | undefined) {
  const trimmed = raw?.trim();
  if (!trimmed) return "schools";
  return trimmed;
}

interface ImpactPreviewRowProps {
  icon: React.ElementType;
  label: string;
  value: number;
}

function ImpactPreviewRow({ icon: Icon, label, value }: ImpactPreviewRowProps) {
  return (
    <div className="flex items-center justify-between bg-gray-100 px-6 py-5">
      <div className="flex items-center gap-5">
        <Icon size={20} />
        <span>{label}</span>
      </div>
      <span className="font-semibold">{commaNumber(value)}</span>
    </div>
  );
}

function UploadReviewModal({
  errorMessage,
  entityLabel,
  fuzzyErrorMessage,
  fuzzyValidationResult,
  impactPreview,
  missingCreateColumns,
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

  const entity = formatEntityLabel(entityLabel);
  const entityLower = entity.charAt(0).toLowerCase() + entity.slice(1);
  const entityTitle = entity.charAt(0).toUpperCase() + entity.slice(1);
  const idNoun = entityLower === "schools" ? "school ID" : "facility ID";

  const canStartImport = !!impactPreview || !!errorMessage;

  const newSchools = impactPreview?.newSchools ?? 0;
  const schoolsToUpdate = impactPreview?.schoolsToUpdate ?? 0;
  // New entities can't be created (create columns missing): warn when there are
  // also updates, block when the upload is create-only.
  const createColumnsMissing =
    !!impactPreview && missingCreateColumns && newSchools > 0;
  const isCreateOnlyBlocked = createColumnsMissing && schoolsToUpdate === 0;
  const showCreateWarning = createColumnsMissing && schoolsToUpdate > 0;

  return (
    <Modal
      modalLabel="STEP 1 OF 2"
      modalHeading="Review"
      open={open}
      passiveModal={false}
      primaryButtonText={errorMessage ? "Continue anyway" : "Start upload"}
      primaryButtonDisabled={
        isImpactLoading || !canStartImport || isCreateOnlyBlocked
      }
      secondaryButtonText="Close"
      size="md"
      onRequestClose={onClose}
      onRequestSubmit={onStartImport}
      onSecondarySubmit={onClose}
    >
      <Stack gap={6}>
        <p>
          Please check the output below and click on "Start upload" to begin
        </p>

        {isImpactLoading && (
          <InlineLoading
            description={`Checking ${entityLower} against the master dataset...`}
            status="active"
          />
        )}

        {errorMessage && (
          <div className="space-y-3">
            <InlineNotification
              aria-label="upload impact preview error"
              kind="error"
              lowContrast
              title={`Unable to check ${idNoun}s`}
              subtitle={errorMessage}
            />
            <Button kind="tertiary" size="sm" onClick={onRetryImpactPreview}>
              Try again
            </Button>
          </div>
        )}

        {impactPreview && (
          <div className="space-y-3">
            <ImpactPreviewRow
              icon={AddAlt}
              label={`New ${entityLower}`}
              value={impactPreview.newSchools}
            />
            <ImpactPreviewRow
              icon={Renew}
              label={`${entityTitle} to be updated`}
              value={impactPreview.schoolsToUpdate}
            />
            {impactPreview.missingSchoolIdRows > 0 && (
              <ImpactPreviewRow
                icon={WarningAlt}
                label={`Rows missing ${idNoun}`}
                value={impactPreview.missingSchoolIdRows}
              />
            )}
            {impactPreview.duplicateSchoolIdRows > 0 && (
              <ImpactPreviewRow
                icon={RowDelete}
                label={`Rows with duplicated ${idNoun}`}
                value={impactPreview.duplicateSchoolIdRows}
              />
            )}
          </div>
        )}

        {showCreateWarning && (
          <InlineNotification
            aria-label="entities will not be created warning"
            kind="warning"
            lowContrast
            title={`Some ${entityLower} won't be created`}
            subtitle={`${commaNumber(
              newSchools,
            )} ${entityLower} in your file don't exist yet and won't be created, because the columns required to create them aren't mapped. Only the ${commaNumber(
              schoolsToUpdate,
            )} existing ${entityLower} will be updated.`}
          />
        )}

        {isCreateOnlyBlocked && (
          <InlineNotification
            aria-label="nothing to upload error"
            kind="error"
            lowContrast
            title="Nothing to upload"
            subtitle={`All ${commaNumber(
              newSchools,
            )} ${entityLower} in your file are new, but the columns required to create them aren't mapped. Map them to create these ${entityLower}, or upload a file with existing ${entityLower} to update.`}
          />
        )}
      </Stack>
    </Modal>
  );
}

export default UploadReviewModal;
