import { Fragment, Suspense } from "react";
import { Control, FieldValues, UseFormReturn } from "react-hook-form";

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
import { ReactHookFormDevTools } from "@/components/utils/DevTools.tsx";
import {
  SchoolConnectivityFormSchema,
  SchoolListFormSchema,
} from "@/forms/ingestApi.ts";
import { IngestApiFormMapping } from "@/types/ingestApi.ts";

interface IngestApiFormInputsProps {
  hookForm: UseFormReturn<SchoolListFormSchema | SchoolConnectivityFormSchema>;
  formMappings: Record<
    string,
    | IngestApiFormMapping<SchoolListFormSchema>[]
    | IngestApiFormMapping<SchoolConnectivityFormSchema>[]
  >;
}

export function IngestApiFormInputs({
  hookForm: {
    control,
    register,
    watch,
    formState: { errors },
  },
  formMappings,
}: IngestApiFormInputsProps) {
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
                : mapping.dependsOnName != null &&
                  mapping.dependsOnValue != null
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
                <Fragment key={mapping.name}>
                  {mapping.type === "text" ? (
                    <FreeTextInput
                      mapping={mapping}
                      register={register(mapping.name, {
                        required: mapping.required,
                        onChange: mapping.onChange,
                      })}
                      errors={errors}
                    />
                  ) : mapping.type === "number" ? (
                    <NumberInput
                      mapping={mapping}
                      errors={errors}
                      register={register(mapping.name, {
                        required: mapping.required,
                        valueAsNumber: true,
                      })}
                    />
                  ) : ["select", "select-user"].includes(mapping.type) ? (
                    <SelectFromArray
                      mapping={mapping}
                      errors={errors}
                      register={register(mapping.name, {
                        required: mapping.required,
                        onChange: mapping.onChange,
                      })}
                    />
                  ) : mapping.type === "enum" ? (
                    <SelectFromEnum
                      mapping={mapping}
                      errors={errors}
                      register={register(mapping.name, {
                        required: mapping.required,
                        onChange: mapping.onChange,
                      })}
                    />
                  ) : mapping.type === "text-action" ? (
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
                  ) : mapping.type === "password" ? (
                    <PasswordInput
                      mapping={mapping}
                      register={register(mapping.name, {
                        required: mapping.required,
                        onChange: mapping.onChange,
                      })}
                      errors={errors}
                    />
                  ) : mapping.type === "code" ? (
                    <CodeInput
                      mapping={mapping}
                      register={register(mapping.name, {
                        required: mapping.required,
                        onChange: mapping.onChange,
                      })}
                      errors={errors}
                    />
                  ) : mapping.type === "toggle" ? (
                    <Switch
                      mapping={mapping}
                      errors={errors}
                      register={register(mapping.name, {
                        required: mapping.required,
                      })}
                    />
                  ) : null}
                </Fragment>
              )
            );
          })}
        </section>
      ))}

      <Suspense>
        <ReactHookFormDevTools
          control={
            control as unknown as Control<
              FieldValues,
              SchoolListFormSchema | SchoolConnectivityFormSchema
            >
          }
        />
      </Suspense>
    </>
  );
}

export default IngestApiFormInputs;
