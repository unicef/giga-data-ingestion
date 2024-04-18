import { useFormContext, useFormState } from "react-hook-form";

import {
  CodeInput,
  FreeTextInput,
  NumberInput,
  PasswordInput,
  SelectFromArray,
  SelectFromEnum,
  Switch,
  TextInputWithAction,
} from "@/components/ingest-api/IngestApiInputs.tsx";
import {
  SchoolConnectivityFormSchema,
  SchoolListFormSchema,
} from "@/forms/ingestApi.ts";
import { IngestApiFormMapping } from "@/types/ingestApi.ts";

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
  const { register, control } = useFormContext<
    SchoolListFormSchema | SchoolConnectivityFormSchema
  >();
  const { errors } = useFormState({ control });

  switch (mapping.type) {
    case "text": {
      return (
        <FreeTextInput
          mapping={mapping}
          register={register(mapping.name, {
            required: mapping.required,
            onChange: mapping.onChange,
          })}
          errors={errors}
        />
      );
    }
    case "number": {
      return (
        <NumberInput
          mapping={mapping}
          errors={errors}
          register={register(mapping.name, {
            required: mapping.required,
            valueAsNumber: true,
          })}
        />
      );
    }
    case "select":
    case "select-user": {
      return (
        <SelectFromArray
          mapping={mapping}
          errors={errors}
          register={register(mapping.name, {
            required: mapping.required,
            onChange: mapping.onChange,
          })}
        />
      );
    }
    case "enum": {
      return (
        <SelectFromEnum
          mapping={mapping}
          errors={errors}
          register={register(mapping.name, {
            required: mapping.required,
            onChange: mapping.onChange,
          })}
        />
      );
    }
    case "text-action": {
      return (
        <TextInputWithAction
          onAction={mapping.action}
          actionLabel="Test"
          isActionLoading={mapping.isActionLoading}
          mapping={mapping}
          errors={errors}
          register={register(mapping.name, {
            required: mapping.required,
            onChange: mapping.onChange,
          })}
        />
      );
    }
    case "password": {
      return (
        <PasswordInput
          mapping={mapping}
          register={register(mapping.name, {
            required: mapping.required,
            onChange: mapping.onChange,
          })}
          errors={errors}
        />
      );
    }
    case "code": {
      return (
        <CodeInput
          mapping={mapping}
          register={register(mapping.name, {
            required: mapping.required,
            onChange: mapping.onChange,
          })}
          errors={errors}
        />
      );
    }
    case "toggle": {
      return (
        <Switch
          mapping={mapping}
          errors={errors}
          register={register(mapping.name, {
            required: mapping.required,
          })}
        />
      );
    }
    default: {
      return null;
    }
  }
}

export function IngestApiFormInputs({
  formMappings,
}: IngestApiFormInputsProps) {
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
              checkDependencies && (
                <FormItem mapping={mapping} key={mapping.name} />
              )
            );
          })}
        </section>
      ))}
    </>
  );
}

export default IngestApiFormInputs;
