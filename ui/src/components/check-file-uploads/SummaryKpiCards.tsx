import { Download } from "@carbon/icons-react";
import { Button } from "@carbon/react";

import { DQ_ENTITY_TEXT, DqEntity } from "@/constants/dqReportSections";
import { cn } from "@/lib/utils";
import { DqReport } from "@/utils/dq-summary";
import { commaNumber } from "@/utils/number";

interface SummaryKpiCardsProps {
  report: DqReport;
  entity: DqEntity;
  onDownloadApproved: () => void;
  onDownloadRejected: () => void;
}

function percentOf(value: number, total: number) {
  if (total <= 0) return "0%";
  const pct = (value / total) * 100;
  return `${pct > 0 && pct < 1 ? pct.toFixed(1) : Math.round(pct)}%`;
}

const SummaryKpiCards = ({
  report,
  entity,
  onDownloadApproved,
  onDownloadRejected,
}: SummaryKpiCardsProps) => {
  const text = DQ_ENTITY_TEXT[entity];
  const cards = [
    {
      key: "approved",
      label: text.approved,
      value: report.approved,
      color: "text-green-600",
      download: {
        label: `Download ${text.approved.toLowerCase()}`,
        onClick: onDownloadApproved,
      },
    },
    {
      key: "warnings",
      label: "Approved with warnings",
      value: report.approvedWithWarnings,
      color: "text-amber-500",
    },
    {
      key: "rejected",
      label: text.rejected,
      value: report.rejected,
      color: "text-red-600",
      download: {
        label: `Download ${text.rejected.toLowerCase()}`,
        onClick: onDownloadRejected,
      },
    },
  ];

  return (
    <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
      {cards.map(card => (
        <div
          key={card.key}
          className="flex flex-col rounded border border-gray-200 bg-white p-6"
        >
          <p className="text-sm">{card.label}</p>
          <p className={cn("mt-2 text-3xl", card.color)}>
            {commaNumber(card.value)}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {percentOf(card.value, report.uploaded)}
          </p>
          {card.download && (
            <div className="mt-auto flex justify-end pt-4">
              <Button
                kind="ghost"
                size="sm"
                renderIcon={Download}
                disabled={card.value === 0}
                onClick={card.download.onClick}
              >
                {card.download.label}
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default SummaryKpiCards;
