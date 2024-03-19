interface SummaryChecksProps {
  name: string;
  uploadTimestamp: string;
  checkTimestamp: string;
}

const SummaryChecks = ({
  name,
  uploadTimestamp,
  checkTimestamp,
}: SummaryChecksProps) => {
  return (
    <div className="flex flex-col gap-1">
      <span>
        Filename: <span className="font-bold">{name}</span>
      </span>
      <span>File uploaded at {uploadTimestamp}</span>
      <span>Checks performed at {checkTimestamp}</span>
    </div>
  );
};

export default SummaryChecks;
