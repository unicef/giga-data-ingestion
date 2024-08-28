interface SummaryChecksProps {
  name: string;
  uploadTimestamp: string;
  checkTimestamp: string;
  rows?: number;
  rowsPassed?: number;
  rowsFailed?: number;
}

const SummaryChecks = ({
  name,
  uploadTimestamp,
  checkTimestamp,
  rows,
  rowsPassed,
  rowsFailed,
}: SummaryChecksProps) => {
  return (
    <div className="flex flex-col gap-1">
      <span>
        Filename: <span className="font-bold">{name}</span>
      </span>
      <span>File uploaded at {uploadTimestamp}</span>
      <span>Checks performed at {checkTimestamp}</span>
      {rows && (
        <span>
          Count of schools in raw file:{" "}
          <span className="font-bold">{rows}</span>
        </span>
      )}
      {rowsPassed && (
        <span>
          Count of schools for approval (Uploaded Schools):{" "}
          <span className="font-bold">{rowsPassed}</span>
        </span>
      )}
      {rowsFailed && (
        <span>
          Count of schools dropped (Not Uploaded):{" "}
          <span className="font-bold">{rowsFailed}</span>
        </span>
      )}
    </div>
  );
};

export default SummaryChecks;
