import { Link } from "react-router-dom";

import { Button, Table } from "antd";

import UploadFile from "@/components/upload/UploadFile.tsx";
import { columns, data } from "@/mocks/uploadChecksTable.tsx";
import { CheckStatusSeverity } from "@/types/upload.ts";

export default function Index() {
  return (
    <>
      <h3 className="text-[23px]">Step 1: Upload</h3>
      <UploadFile />

      <Table
        columns={columns}
        dataSource={data}
        pagination={false}
        onHeaderRow={() => ({
          className: "whitespace-pre",
        })}
      />

      <div className="flex items-end justify-between">
        <div>
          <p>Out of {data.length} columns...</p>
          <ul className="list-inside list-disc indent-2">
            <li>
              <b className="text-success">
                {
                  data.filter(
                    d => d.remarks.severity === CheckStatusSeverity.PASS,
                  ).length
                }
              </b>{" "}
              passed
            </li>
            <li>
              <b className="text-warning">
                {
                  data.filter(
                    d => d.remarks.severity === CheckStatusSeverity.WARNING,
                  ).length
                }
              </b>{" "}
              had warnings
            </li>
            <li>
              <b className="text-error">
                {
                  data.filter(
                    d => d.remarks.severity === CheckStatusSeverity.FAIL,
                  ).length
                }
              </b>{" "}
              failed
            </li>
          </ul>
        </div>
        <div className="flex gap-2">
          <Link to="/upload" unstable_viewTransition>
            <Button className="border-primary text-primary">Cancel</Button>
          </Link>
          <Link to="metadata" unstable_viewTransition>
            <Button type="primary" className="bg-primary">
              Proceed
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}
