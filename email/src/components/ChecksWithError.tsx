import { Check } from "../types/data-quality-checks";
import { getChecksWithFailures } from "../utils/dq-report";
import { Hr, Section } from "@react-email/components";
interface ChecksWithErrorProps {
  checks: Check[];
  title: string;
}

const ChecksWithError = ({ checks, title }: ChecksWithErrorProps) => {
  const failedChecks = getChecksWithFailures(checks);
  return (
    <Section>
      <span className="text-2xl px-2">{title}</span>
      <Hr className="border-gray-6 mx-0 w-full border border-solid opacity-20" />
      <ul className=" list-decimal gap-4 px-20">
        {failedChecks.map((check) => (
          <li>
            {check.description}
            <ul className="list-disc">
              {check.column && (
                <li>
                  Column:{" "}
                  <span className="font-mono text-md font-semibold">
                    {check.column}
                  </span>
                </li>
              )}
              <li>
                Check:{" "}
                <span className="font-mono text-md font-semibold">
                  {check.assertion}
                </span>
              </li>
              <li>
                Failures:{" "}
                <span className="text-md font-semibold">
                  {check.count_failed}/{check.count_overall}
                </span>
              </li>
              <li>
                Failure Rate:{" "}
                <span className="text-md font-semibold">
                  {check.percent_failed}%
                </span>
              </li>
            </ul>
          </li>
        ))}
      </ul>
    </Section>
  );
};

export default ChecksWithError;
