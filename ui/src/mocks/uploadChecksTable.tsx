import { ColumnsType } from "antd/es/table";

import infoIcon from "@/assets/info-icon.svg";
import CheckStatusIndicator from "@/components/common/CheckStatusIndicator.tsx";
import { CheckStatusSeverity, UploadCheck } from "@/types/upload";

export const columns: ColumnsType<UploadCheck> = [
  {
    title: "Column Name",
    dataIndex: "columnName",
    key: "columnName",
    render: text => (
      <span className="flex gap-2">
        {text} <img src={infoIcon} alt="Info" className="cursor-pointer" />
      </span>
    ),
  },
  {
    title: "Expected data type",
    dataIndex: "expectedType",
    key: "expectedType",
  },
  {
    title: "Check 1:\nExpected columns",
    dataIndex: "expectedColumns",
    key: "expectedColumns",
    render: column => <CheckStatusIndicator checkStatus={column} />,
  },
  {
    title: "Check 2:\nFill rate",
    dataIndex: "fillRate",
    key: "fillRate",
    render: rate => <CheckStatusIndicator checkStatus={rate} />,
  },
  {
    title: "Check 3:\nAcceptable values",
    dataIndex: "acceptableValues",
    key: "acceptableValues",
    render: values => <CheckStatusIndicator checkStatus={values} />,
  },
  {
    title: "Remarks",
    dataIndex: "remarks",
    key: "remarks",
    render: remarks => <CheckStatusIndicator checkStatus={remarks} />,
  },
];

export const data: UploadCheck[] = [
  {
    key: 1,
    columnName: "school_id",
    expectedType: "string",
    expectedColumns: {
      message: "Correct",
      severity: CheckStatusSeverity.PASS,
    },
    fillRate: {
      message: "100.0%",
      severity: CheckStatusSeverity.PASS,
    },
    acceptableValues: {
      message: "No checks",
      severity: CheckStatusSeverity.NO_CHECK,
    },
    remarks: {
      message: "Pass",
      severity: CheckStatusSeverity.PASS,
    },
  },
  {
    key: 2,
    columnName: "school_name",
    expectedType: "string",
    expectedColumns: {
      message: "Correct",
      severity: CheckStatusSeverity.PASS,
    },
    fillRate: {
      message: "100.0%",
      severity: CheckStatusSeverity.PASS,
    },
    acceptableValues: {
      message: "No checks",
      severity: CheckStatusSeverity.NO_CHECK,
    },
    remarks: {
      message: "Pass",
      severity: CheckStatusSeverity.PASS,
    },
  },
  {
    key: 3,
    columnName: "education_level",
    expectedType: "string",
    expectedColumns: {
      message: "Correct",
      severity: CheckStatusSeverity.PASS,
    },
    fillRate: {
      message: "66.7%",
      severity: CheckStatusSeverity.WARNING,
    },
    acceptableValues: {
      message: 'Unexpected value "college" detected',
      severity: CheckStatusSeverity.FAIL,
    },
    remarks: {
      message: "Fail: check acceptable values\nWarning: check fill rate",
      severity: CheckStatusSeverity.FAIL,
    },
  },
  {
    key: 4,
    columnName: "school_funding_type",
    expectedType: "string",
    expectedColumns: {
      message: "Correct",
      severity: CheckStatusSeverity.PASS,
    },
    fillRate: {
      message: "43.2%",
      severity: CheckStatusSeverity.WARNING,
    },
    acceptableValues: {
      message: "No checks",
      severity: CheckStatusSeverity.NO_CHECK,
    },
    remarks: {
      message: "Warning: check fill rate",
      severity: CheckStatusSeverity.WARNING,
    },
  },
  {
    key: 5,
    columnName: "school_established_yr",
    expectedType: "integer",
    expectedColumns: {
      message: "Can't parse",
      severity: CheckStatusSeverity.FAIL,
    },
    fillRate: {
      message: "90.1%",
      severity: CheckStatusSeverity.PASS,
    },
    acceptableValues: {
      message: "No checks",
      severity: CheckStatusSeverity.NO_CHECK,
    },
    remarks: {
      message: "Fail: wrong data type",
      severity: CheckStatusSeverity.FAIL,
    },
  },
  {
    key: 6,
    columnName: "computer_availability",
    expectedType: "string",
    expectedColumns: {
      message: "Not found",
      severity: CheckStatusSeverity.FAIL,
    },
    fillRate: {
      message: "Not checked",
      severity: CheckStatusSeverity.NO_CHECK,
    },
    acceptableValues: {
      message: "Not checked",
      severity: CheckStatusSeverity.NO_CHECK,
    },
    remarks: {
      message: "Fail: column not detected",
      severity: CheckStatusSeverity.FAIL,
    },
  },
];
