import { Download } from "@carbon/icons-react";
import { Button } from "@carbon/react";

import { DQ_ENTITY_TEXT, DqEntity } from "@/constants/dqReportSections";
import { cn } from "@/lib/utils";
import { DqReport } from "@/utils/dq-summary";
import { commaNumber } from "@/utils/number";

interface SummaryKpiCardsProps {
  report: DqReport;
  entity: DqEntity;
  onDownloadUploaded: () => void;
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
  onDownloadUploaded,
  onDownloadApproved,
  onDownloadRejected,
}: SummaryKpiCardsProps) => {
  const text = DQ_ENTITY_TEXT[entity];
  const cards = [
    {
      key: "uploaded",
      label: text.uploaded,
      value: report.uploaded,
      color: "text-giga-black",
      showPercent: false,
      download: {
        label: "Download uploaded dataset",
        onClick: onDownloadUploaded,
      },
    },
    {
      key: "approved",
      label: text.approved,
      value: report.approved,
      color: "text-green-600",
      showPercent: true,
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
      showPercent: true,
    },
    {
      key: "rejected",
      label: text.rejected,
      value: report.rejected,
      color: "text-red-600",
      showPercent: true,
      download: {
        label: `Download ${text.rejected.toLowerCase()}`,
        onClick: onDownloadRejected,
      },
    },
  ];

  return (
    <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map(card => (
        <div
          key={card.key}
          className="flex flex-col rounded border border-gray-200 bg-white p-6"
        >
          <p className="text-sm">{card.label}</p>
          <p className={cn("mb-0 mt-2 text-5xl", card.color)}>
            {commaNumber(card.value)}
          </p>
          {card.showPercent && (
            <p className="mb-0 mt-1 text-lg text-gray-500">
              {percentOf(card.value, report.uploaded)}
            </p>
          )}
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
