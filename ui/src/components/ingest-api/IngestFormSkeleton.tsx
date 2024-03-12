import { Stack, TextAreaSkeleton } from "@carbon/react";

function IngestFormSkeleton() {
  return (
    <Stack orientation="horizontal">
      <section className="flex flex-col gap-4">
        <TextAreaSkeleton />
        <TextAreaSkeleton />
        <TextAreaSkeleton />
        <TextAreaSkeleton />
      </section>
      <section className="flex flex-col gap-4">
        <TextAreaSkeleton />
      </section>
    </Stack>
  );
}

export default IngestFormSkeleton;
