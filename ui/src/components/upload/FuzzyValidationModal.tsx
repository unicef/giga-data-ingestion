import { useEffect, useMemo, useState } from "react";

import {
  Accordion,
  AccordionItem,
  InlineLoading,
  InlineNotification,
  Modal,
  Select,
  SelectItem,
  Stack,
} from "@carbon/react";

import {
  FuzzyCorrection,
  FuzzyValidationColumn,
  FuzzyValidationResponse,
} from "@/types/upload";

interface FuzzyValidationModalProps {
  errorMessage: string | null;
  isLoading: boolean;
  onClose: () => void;
  onConfirmApply: (corrections: FuzzyCorrection[]) => void;
  open: boolean;
  validationResult: FuzzyValidationResponse | null;
}

interface ConfirmationState {
  columns: number;
  values: number;
}

const getInitialCorrections = (columns: FuzzyValidationColumn[]) =>
  Object.fromEntries(
    columns.flatMap(column =>
      column.value_mappings
        .filter(valueMapping => !valueMapping.is_valid)
        .map(valueMapping => [
          `${column.file_column}::${valueMapping.value_found}`,
          valueMapping.replace_with ?? "",
        ]),
    ),
  );

const getColumnsWithUnknownValues = (columns: FuzzyValidationColumn[]) =>
  columns.filter(
    column =>
      column.unknown_count > 0 &&
      column.value_mappings.some(valueMapping => !valueMapping.is_valid),
  );

function FuzzyValidationModal({
  errorMessage,
  isLoading,
  onClose,
  onConfirmApply,
  open,
  validationResult,
}: FuzzyValidationModalProps) {
  const [selectedReplacements, setSelectedReplacements] = useState<
    Record<string, string>
  >({});
  const [confirmationState, setConfirmationState] =
    useState<ConfirmationState | null>(null);

  const columnsWithUnknownValues = useMemo(
    () => getColumnsWithUnknownValues(validationResult?.columns ?? []),
    [validationResult],
  );

  useEffect(() => {
    if (!validationResult) {
      setSelectedReplacements({});
      setConfirmationState(null);
      return;
    }

    setSelectedReplacements(getInitialCorrections(columnsWithUnknownValues));
  }, [columnsWithUnknownValues, validationResult]);

  const corrections = useMemo(
    () =>
      columnsWithUnknownValues.flatMap(column =>
        column.value_mappings
          .filter(valueMapping => !valueMapping.is_valid)
          .map(valueMapping => ({
            column_name: column.file_column,
            value_found: valueMapping.value_found,
            replace_with:
              selectedReplacements[
                `${column.file_column}::${valueMapping.value_found}`
              ] || null,
          })),
      ),
    [columnsWithUnknownValues, selectedReplacements],
  );

  const appliedCorrections = useMemo(
    () => corrections.filter(correction => correction.replace_with),
    [corrections],
  );

  const appliedCorrectionSummary = useMemo(
    () => ({
      columns: new Set(appliedCorrections.map(item => item.column_name)).size,
      values: columnsWithUnknownValues.reduce(
        (total, column) =>
          total +
          column.value_mappings.reduce((columnTotal, valueMapping) => {
            const replacement =
              selectedReplacements[
                `${column.file_column}::${valueMapping.value_found}`
              ] ?? "";

            if (valueMapping.is_valid || !replacement) {
              return columnTotal;
            }

            return columnTotal + valueMapping.count;
          }, 0),
        0,
      ),
    }),
    [appliedCorrections, columnsWithUnknownValues, selectedReplacements],
  );

  useEffect(() => {
    if (!isLoading || !open) return;

    const timeoutId = window.setTimeout(() => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isLoading, open]);

  if (isLoading) {
    return (
      <Modal
        className="fuzzy-validation-modal fuzzy-validation-modal--loading"
        modalHeading="Checking your mapped values"
        open={open}
        passiveModal
        preventCloseOnClickOutside
        onRequestClose={() => undefined}
      >
        <Stack gap={5}>
          <InlineLoading
            description="Validating your file..."
            status="active"
          />
        </Stack>
      </Modal>
    );
  }

  if (confirmationState) {
    return (
      <Modal
        className="fuzzy-validation-modal"
        modalHeading="Apply corrections to your data?"
        open={open}
        primaryButtonText="Confirm and apply"
        secondaryButtonText="Back"
        onRequestClose={onClose}
        onRequestSubmit={() => onConfirmApply(appliedCorrections)}
        onSecondarySubmit={() => setConfirmationState(null)}
      >
        <p>
          This will update {confirmationState.values} values across{" "}
          {confirmationState.columns} columns in your uploaded file. Values left
          unmatched will set as default. This action cannot be undone within
          this process.
        </p>
      </Modal>
    );
  }

  return (
    <Modal
      className="fuzzy-validation-modal"
      modalHeading={`Match expected data values for ${columnsWithUnknownValues.length} columns`}
      open={open}
      passiveModal={false}
      primaryButtonText="Apply Corrections"
      primaryButtonDisabled={appliedCorrectionSummary.values === 0}
      secondaryButtonText="Close"
      size="lg"
      onRequestClose={onClose}
      onRequestSubmit={() => setConfirmationState(appliedCorrectionSummary)}
      onSecondarySubmit={onClose}
      modalLabel="Please review the suggestions and match the values in the data to the
          expected valid values below."
    >
      <Stack gap={4} className="pb-0">
        {errorMessage && (
          <InlineNotification
            aria-label="fuzzy validation error notification"
            kind="error"
            subtitle={errorMessage}
            title=""
          />
        )}

        <Accordion>
          {columnsWithUnknownValues.map(column => (
            <AccordionItem
              key={column.file_column}
              open={column.unknown_count > 0}
              title={
                <div className="flex items-center justify-between gap-4 pr-6">
                  <span className="font-semibold">{column.header_title}</span>
                  <span className="rounded-full bg-red-100 px-3 py-1 text-xs text-red-700">
                    {column.unknown_count} unknown values
                  </span>
                </div>
              }
            >
              <div className="grid grid-cols-[2fr_1fr_2fr] gap-4 border-b border-gray-200 bg-gray-200 px-4 py-2 text-sm font-semibold">
                <div>Value Found</div>
                <div>Count</div>
                <div>Replace with</div>
              </div>

              {column.value_mappings.map(valueMapping => {
                const fieldKey = `${column.file_column}::${valueMapping.value_found}`;
                const selectedValue = selectedReplacements[fieldKey] ?? "";

                return (
                  <div
                    key={fieldKey}
                    className="grid grid-cols-[2fr_1fr_2fr] items-center gap-4 border-b border-gray-100 px-4 py-2"
                  >
                    <div
                      className={
                        valueMapping.is_valid
                          ? "text-green-700"
                          : "text-red-600"
                      }
                    >
                      {valueMapping.value_found}
                    </div>
                    <div>{valueMapping.count}</div>
                    <div>
                      <Select
                        id={fieldKey}
                        labelText=""
                        disabled={valueMapping.is_valid}
                        value={selectedValue}
                        onChange={event =>
                          setSelectedReplacements(current => ({
                            ...current,
                            [fieldKey]: event.target.value,
                          }))
                        }
                      >
                        {!valueMapping.is_valid && (
                          <SelectItem text="Select a value" value="" />
                        )}
                        {column.dropdown_options.map(option => (
                          <SelectItem
                            key={option}
                            text={option}
                            value={option}
                          />
                        ))}
                      </Select>
                    </div>
                  </div>
                );
              })}
            </AccordionItem>
          ))}
        </Accordion>
      </Stack>
    </Modal>
  );
}

export default FuzzyValidationModal;
