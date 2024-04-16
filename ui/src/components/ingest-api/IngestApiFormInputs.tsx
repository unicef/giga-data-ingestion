import { Fragment, Suspense } from "react";
import { Control, FieldValues, UseFormReturn } from "react-hook-form";

import {
  CodeInput,
  FreeTextInput,
  PasswordInput,
  SelectFromArray,
  SelectFromEnum,
  TextInputWithAction,
} from "@/components/ingest-api/IngestApiInputs.tsx";
import { ReactHookFormDevTools } from "@/components/utils/DevTools.tsx";
import { IngestApiFormMapping } from "@/types/ingestApi.ts";

interface IngestApiFormInputsProps<T extends FieldValues> {
  hookForm: UseFormReturn<T>;
  formMappings: Record<string, IngestApiFormMapping<T>[]>;
}

export function IngestApiFormInputs<T extends FieldValues>({
  hookForm: {
    control,
    register,
    watch,
    formState: { errors },
  },
  formMappings,
}: IngestApiFormInputsProps<T>) {
  return (
    <>
      {Object.entries(formMappings).map(([group, formItems]) => (
        <section className="flex flex-col gap-6" key={group}>
          <header className="text-2xl">{group}</header>
          {formItems.map(mapping => {
            const checkDependencies =
              mapping.dependsOnName != null && mapping.dependsOnValue != null
                ? mapping.dependsOnValue.includes(watch(mapping.dependsOnName))
                : true;

            return (
              <Fragment key={mapping.name}>
                {mapping.type === "text" ? (
                  checkDependencies && (
                    <FreeTextInput
                      mapping={mapping}
                      register={register(mapping.name, {
                        required: mapping.required,
                        onChange: mapping.onChange,
                      })}
                      errors={errors}
                    />
                  )
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
                  checkDependencies && (
                    <PasswordInput
                      mapping={mapping}
                      register={register(mapping.name, {
                        required: mapping.required,
                        onChange: mapping.onChange,
                      })}
                      errors={errors}
                    />
                  )
                ) : mapping.type === "code" ? (
                  checkDependencies && (
                    <CodeInput
                      mapping={mapping}
                      register={register(mapping.name, {
                        required: mapping.required,
                        onChange: mapping.onChange,
                      })}
                      errors={errors}
                    />
                  )
                ) : null}
              </Fragment>
            );
          })}
        </section>
      ))}

      <Suspense>
        <ReactHookFormDevTools
          control={control as unknown as Control<FieldValues, T>}
        />
      </Suspense>
    </>
  );
}

export default IngestApiFormInputs;
