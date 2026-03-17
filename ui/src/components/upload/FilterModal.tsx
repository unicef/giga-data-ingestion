import { useEffect, useState } from "react";

import {
  Button,
  ComposedModal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
} from "@carbon/react";
import { useQuery } from "@tanstack/react-query";

import { api } from "@/api";
import { listCountriesQueryOptions } from "@/api/queryOptions.ts";
import useRoles from "@/hooks/useRoles.ts";
import { DQStatus } from "@/types/upload.ts";

export interface UploadFilters {
  uploaderEmail: string;
  dataset: string;
  country: string;
  dqStatus: string;
  source: string;
}

interface FilterModalProps {
  open: boolean;
  onClose: () => void;
  onApply: (filters: UploadFilters) => void;
  initialFilters: UploadFilters;
}

const EMPTY_FILTERS: UploadFilters = {
  uploaderEmail: "",
  dataset: "",
  country: "",
  dqStatus: "",
  source: "",
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

  function handleApply() {
    onApply(filters);
    onClose();
  }

  function handleClear() {
    const cleared = { ...EMPTY_FILTERS };
    setFilters(cleared);
    onApply(cleared);
    onClose();
  }

  return (
    <ComposedModal open={open} onClose={onClose} className="filter-side-panel">
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
            id="filter-dataset"
            labelText="Dataset"
            value={filters.dataset}
            onChange={e => handleChange("dataset", e.target.value)}
          >
            <SelectItem value="" text="Choose an option" />
            <SelectItem value="geolocation" text="Geolocation" />
            <SelectItem value="coverage" text="Coverage" />
            <SelectItem value="structured" text="Structured" />
            <SelectItem value="unstructured" text="Unstructured" />
          </Select>

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

          <Select
            id="filter-source"
            labelText="Source"
            value={filters.source}
            onChange={e => handleChange("source", e.target.value)}
          >
            <SelectItem value="" text="Choose an option" />
            <SelectItem value="fb" text="Facebook" />
            <SelectItem value="itu" text="ITU" />
            <SelectItem value="api" text="API" />
          </Select>

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

export { EMPTY_FILTERS };
export default FilterModal;
