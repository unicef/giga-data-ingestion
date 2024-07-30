import { useFormContext } from "react-hook-form";

import {
  CodeInput,
  FreeTextInput,
  NumberInput,
  PasswordInput,
  SelectFromArray,
  SelectFromEnum,
  SelectFromObjectArray,
  Switch,
  TextInputWithAction,
} from "@/components/ingest-api/IngestApiInputs.tsx";
import type {
  SchoolConnectivityFormSchema,
  SchoolListFormSchema,
} from "@/forms/ingestApi.ts";
import type { IngestApiFormMapping } from "@/types/ingestApi.ts";

interface IngestApiFormInputsProps {
  formMappings: Record<
    string,
    | IngestApiFormMapping<SchoolListFormSchema>[]
    | IngestApiFormMapping<SchoolConnectivityFormSchema>[]
  >;
}

interface FormItemProps {
  mapping:
    | IngestApiFormMapping<SchoolListFormSchema>
    | IngestApiFormMapping<SchoolConnectivityFormSchema>;
}

function FormItem({ mapping }: FormItemProps) {
  const hookForm = useFormContext<
    SchoolListFormSchema | SchoolConnectivityFormSchema
  >();

  switch (mapping.type) {
    case "text": {
      return <FreeTextInput mapping={mapping} hookForm={hookForm} />;
    }
    case "number": {
      return <NumberInput mapping={mapping} hookForm={hookForm} />;
    }
    case "select":
    case "select-user": {
      return <SelectFromArray mapping={mapping} hookForm={hookForm} />;
    }
    case "select-object": {
      return <SelectFromObjectArray mapping={mapping} hookForm={hookForm} />;
    }
    case "enum": {
      return <SelectFromEnum mapping={mapping} hookForm={hookForm} />;
    }
    case "text-action": {
      return (
        <TextInputWithAction
          onAction={mapping.action}
          actionLabel="Test"
          isActionLoading={mapping.isActionLoading}
          mapping={mapping}
          hookForm={hookForm}
        />
      );
    }
    case "password": {
      return <PasswordInput mapping={mapping} hookForm={hookForm} />;
    }
    case "code": {
      return <CodeInput mapping={mapping} hookForm={hookForm} />;
    }
    case "toggle": {
      return <Switch mapping={mapping} hookForm={hookForm} />;
    }
    default: {
      return null;
    }
  }
}

export function IngestApiFormInputs({ formMappings }: IngestApiFormInputsProps) {
  const { watch } = useFormContext<
    SchoolListFormSchema | SchoolConnectivityFormSchema
  >();

  return (
    <>
      {Object.entries(formMappings).map(([group, formItems]) => (
        <section className="flex flex-col gap-6" key={group}>
          <header className="text-2xl">{group}</header>
          {formItems.map(mapping => {
            const checkDependencies =
              mapping.dependsOnValue === true
                ? !!watch(
                    mapping.dependsOnName as keyof (
                      | SchoolListFormSchema
                      | SchoolConnectivityFormSchema
                    ),
                  )
                : mapping.dependsOnValue != null
                  ? mapping.dependsOnValue.includes(
                      watch(
                        mapping.dependsOnName as keyof (
                          | SchoolListFormSchema
                          | SchoolConnectivityFormSchema
                        ),
                      ) as string,
                    )
                  : true;

            return (
              checkDependencies && <FormItem mapping={mapping} key={mapping.name} />
            );
          })}
        </section>
      ))}
    </>
  );
}

export default IngestApiFormInputs;
