import { ChangeEvent, useEffect, useState } from "react";

import {
  Button,
  ComposedModal,
  DatePicker,
  DatePickerInput,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
} from "@carbon/react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

import { api } from "@/api";
import { listCountriesQueryOptions } from "@/api/queryOptions.ts";
import { DEFAULT_DATE_FORMAT } from "@/constants/datetime.ts";
import useRoles from "@/hooks/useRoles.ts";
import { DQStatus } from "@/types/upload.ts";

export interface UploadFilters {
  uploaderEmail: string;
  country: string;
  dqStatus: string;
  createdFrom: string;
  createdTo: string;
}

interface FilterModalProps {
  open: boolean;
  onClose: () => void;
  onApply: (filters: UploadFilters) => void;
  initialFilters: UploadFilters;
}

const EMPTY_FILTERS: UploadFilters = {
  uploaderEmail: "",
  country: "",
  dqStatus: "",
  createdFrom: "",
  createdTo: "",
};

function FilterModal({
  open,
  onClose,
  onApply,
  initialFilters,
}: FilterModalProps) {
  const [filters, setFilters] = useState<UploadFilters>(initialFilters);
  const { isPrivileged } = useRoles();

  useEffect(() => {
    if (open) setFilters(initialFilters);
    if (!open) closeDatePickers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const { data: usersData } = useQuery({
    queryKey: ["users"],
    queryFn: api.users.list,
    enabled: isPrivileged,
  });

  const { data: countriesData } = useQuery(listCountriesQueryOptions);

  const users = usersData?.data ?? [];
  const countryList = countriesData?.data ?? [];

  function handleChange(field: keyof UploadFilters, value: string) {
    setFilters(prev => ({ ...prev, [field]: value }));
  }

  function handleDateChange(field: keyof UploadFilters, selectedDates: Date[]) {
    handleChange(
      field,
      selectedDates[0] ? format(selectedDates[0], DEFAULT_DATE_FORMAT) : "",
    );
  }

  function handleDateInputChange(
    field: keyof UploadFilters,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    if (!event.target.value) handleChange(field, "");
  }

  function closeDatePickers() {
    ["filter-created-from", "filter-created-to"].forEach(id => {
      const input = document.getElementById(id) as
        | (HTMLInputElement & { _flatpickr?: { close: () => void } })
        | null;
      input?._flatpickr?.close();
    });
  }

  function handleClose() {
    closeDatePickers();
    onClose();
  }

  function handleApply() {
    onApply(filters);
    handleClose();
  }

  function handleClear() {
    const cleared = { ...EMPTY_FILTERS };
    setFilters(cleared);
    onApply(cleared);
    handleClose();
  }

  return (
    <ComposedModal
      open={open}
      onClose={handleClose}
      className="filter-side-panel"
    >
      <ModalHeader title="Filters" />
      <ModalBody hasForm>
        <div className="flex flex-col gap-4">
          {isPrivileged && (
            <Select
              id="filter-uploader"
              labelText="Uploaded by"
              value={filters.uploaderEmail}
              onChange={e => handleChange("uploaderEmail", e.target.value)}
            >
              <SelectItem value="" text="Choose an option" />
              {users.map(user => (
                <SelectItem
                  key={user.id}
                  value={user.email}
                  text={
                    user.given_name || user.surname
                      ? `${user.given_name} ${user.surname}`.trim()
                      : user.email
                  }
                />
              ))}
            </Select>
          )}

          <Select
            id="filter-country"
            labelText="Country"
            value={filters.country}
            onChange={e => handleChange("country", e.target.value)}
          >
            <SelectItem value="" text="Choose an option" />
            {countryList.map(c => (
              <SelectItem key={c.ISO3} value={c.ISO3} text={c.name_short} />
            ))}
          </Select>

          <DatePicker
            datePickerType="single"
            dateFormat="Y-m-d"
            value={filters.createdFrom}
            onChange={selectedDates =>
              handleDateChange("createdFrom", selectedDates)
            }
          >
            <DatePickerInput
              id="filter-created-from"
              labelText="Uploaded from"
              placeholder="yyyy-mm-dd"
              onChange={event => handleDateInputChange("createdFrom", event)}
            />
          </DatePicker>

          <DatePicker
            datePickerType="single"
            dateFormat="Y-m-d"
            value={filters.createdTo}
            onChange={selectedDates =>
              handleDateChange("createdTo", selectedDates)
            }
          >
            <DatePickerInput
              id="filter-created-to"
              labelText="Uploaded to"
              placeholder="yyyy-mm-dd"
              onChange={event => handleDateInputChange("createdTo", event)}
            />
          </DatePicker>

          <Select
            id="filter-dq-status"
            labelText="DQ Status"
            value={filters.dqStatus}
            onChange={e => handleChange("dqStatus", e.target.value)}
          >
            <SelectItem value="" text="Choose an option" />
            {Object.values(DQStatus).map(status => (
              <SelectItem
                key={status}
                value={status}
                text={status.replace("_", " ").toLowerCase()}
              />
            ))}
          </Select>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button kind="secondary" onClick={handleClear}>
          Clear
        </Button>
        <Button kind="primary" onClick={handleApply}>
          Apply
        </Button>
      </ModalFooter>
    </ComposedModal>
  );
}

export default FilterModal;
