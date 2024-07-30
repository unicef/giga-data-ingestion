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
      <span className="px-2 text-2xl">{title}</span>
      <Hr className="mx-0 my-2 w-full border border-giga-light-gray border-solid" />
      <ul className=" list-decimal gap-4 px-20">
        {failedChecks.map(check => (
          <li>
            {check.description}
            <ul className="list-disc">
              {check.column && (
                <li>
                  Column:{" "}
                  <span className="font-mono font-semibold text-md">
                    {check.column}
                  </span>
                </li>
              )}
              <li>
                Check:{" "}
                <span className="font-mono font-semibold text-md">
                  {check.assertion}
                </span>
              </li>
              <li>
                Failures:{" "}
                <span className="font-semibold text-md">
                  {check.count_failed}/{check.count_overall}
                </span>
              </li>
              <li>
                Failure Rate:{" "}
                <span className="font-semibold text-md">{check.percent_failed}%</span>
              </li>
            </ul>
          </li>
        ))}
      </ul>
    </Section>
  );
};

export default CheckWithError;
