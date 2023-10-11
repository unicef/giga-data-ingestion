import { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button, Input, Select } from "antd";

import rawCountries from "@/mocks/countries.json";
import {
  dataSensitivityOptions as rawDataSensitivityOptions,
  licenseOptions as rawLicenseOptions,
} from "@/mocks/uploadMetadata.tsx";

const countries = rawCountries.map(c => ({ value: c.name, label: c.name }));

const dataSensitivityOptions = rawDataSensitivityOptions.map(s => ({
  value: s,
  label: s,
}));

const licenseOptions = rawLicenseOptions.map(l => ({ value: l, label: l }));

export default function UploadMetadata() {
  const navigate = useNavigate();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    navigate("../success");
  }

  return (
    <>
      <h4 className="text-base text-gray-3">Step 1: Upload</h4>
      <h3 className="text-[23px]">Step 2: Metadata</h3>
      <p>Please provide more information about your upload and yourself.</p>

      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        <fieldset className="flex items-center gap-4">
          <label
            htmlFor="dataOwner"
            className="w-2/12 whitespace-nowrap text-right"
          >
            <span className="text-error">*</span> Data Owner:
          </label>
          <Input
            id="dataOwner"
            name="dataOwner"
            placeholder="The main person or organization responsible for this dataset"
            required
            size="large"
          />
        </fieldset>

        <fieldset className="flex items-center gap-4">
          <label
            htmlFor="country"
            className="w-2/12 whitespace-nowrap text-right"
          >
            <span className="text-error">*</span> Country:
          </label>
          <Select
            id="country"
            placeholder="What country is covered by this dataset?"
            size="large"
            className="w-full"
            options={countries}
          />
        </fieldset>

        <fieldset className="flex items-center gap-4">
          <label
            htmlFor="dataSensitivity"
            className="w-2/12 whitespace-nowrap text-right"
          >
            <span className="text-error">*</span> Data Sensitivity:
          </label>
          <Select
            id="dataSensitivity"
            placeholder="Who should be able to access this dataset?"
            size="large"
            className="w-full"
            options={dataSensitivityOptions}
          />
        </fieldset>

        <fieldset className="flex items-center gap-4">
          <label
            htmlFor="license"
            className="w-2/12 whitespace-nowrap text-right"
          >
            <span className="text-error">*</span> License:
          </label>
          <Select
            id="license"
            placeholder="Are there any licenses that the team should be aware of?"
            size="large"
            className="w-full"
            options={licenseOptions}
          />
        </fieldset>

        <fieldset className="flex items-center gap-4">
          <label
            htmlFor="email"
            className="w-2/12 whitespace-nowrap text-right"
          >
            <span className="text-error">*</span> Email Address:
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Are there any licenses that the team should be aware of?"
            required
            size="large"
          />
        </fieldset>

        <fieldset className="flex items-start gap-4">
          <label
            htmlFor="comments"
            className="w-2/12 whitespace-nowrap text-right"
          >
            <span className="text-error">*</span> Comments:
          </label>
          <Input.TextArea
            id="comments"
            name="comments"
            placeholder="Are there any other details you’d like to mention or clarify?"
            required
            size="large"
            rows={6}
          />
        </fieldset>

        <div className="flex justify-end gap-2">
          <Link to="..">
            <Button className="border-primary text-primary">Cancel</Button>
          </Link>
          <Button type="primary" htmlType="submit" className="bg-primary">
            Proceed
          </Button>
        </div>
      </form>
    </>
  );
}
