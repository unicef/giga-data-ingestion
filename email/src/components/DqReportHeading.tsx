import { Heading, Img } from "@react-email/components";
import { cn } from "../lib/utils";

interface DqReportHeaderProps {
  hasCriticalError: boolean;
  title: string;
}

function DqReportHeading({ hasCriticalError, title }: DqReportHeaderProps) {
  return (
    <Heading className="flex p-0 align-middle font-normal text-2xl ">
      <Img
        className="-mt-1 mr-2 h-10 w-10"
        src={`${
          hasCriticalError
            ? "https://storage.googleapis.com/giga-test-app-static-assets/MisuseOutlineRed.png"
            : "https://storage.googleapis.com/giga-test-app-static-assets/MisuseOutlineYellow.png"
        }`}
      />
      <strong
        className={cn({
          "text-giga-red": hasCriticalError,
          "text-giga-yellow": !hasCriticalError,
        })}
      >
        {title}
      </strong>
    </Heading>
  );
}

export default DqReportHeading;
