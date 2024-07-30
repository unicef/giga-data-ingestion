import { Hr, Section } from "@react-email/components";
import type { Check } from "../types/data-quality-checks";
import { getChecksWithFailures } from "../utils/dq-report";
interface CheckWithErrorProps {
  checks: Check[];
  title: string;
}

const CheckWithError = ({ checks, title }: CheckWithErrorProps) => {
  const failedChecks = getChecksWithFailures(checks);

  if (!failedChecks.length) return null;

  return (
    <Section>
      <span className="text-2xl px-2">{title}</span>
      <Hr className="border border-solid border-giga-light-gray my-2 mx-0 w-full" />
      <ul className=" list-decimal gap-4 px-20">
        {failedChecks.map(check => (
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
                <span className="text-md font-semibold">{check.percent_failed}%</span>
              </li>
            </ul>
          </li>
        ))}
      </ul>
    </Section>
  );
};

export default CheckWithError;
