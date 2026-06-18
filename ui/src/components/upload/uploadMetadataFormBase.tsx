import type { ReactNode } from "react";
import {
  FieldErrors,
  SubmitHandler,
  UseFormRegister,
  useForm,
} from "react-hook-form";

import { ArrowRight } from "@carbon/icons-react";
import {
  Button,
  ButtonSet,
  Form,
  FormGroup,
  Heading,
  Loading,
  Section,
  Stack,
  Tag,
} from "@carbon/react";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  CountrySelect,
  FreeTextInput,
  MetadataForm,
  SelectFromArray,
  SelectFromEnum,
} from "@/components/upload/MetadataInputs.tsx";
import { yearList } from "@/constants/metadata";
import { MetadataFormMapping } from "@/types/metadata.ts";

export type { MetadataForm };

function getFormRows(
  groupKey: string,
  formItems: MetadataFormMapping[],
  datasetSectionHeading: string,
  nationalPracticesHeading: string,
): (MetadataFormMapping | null)[][] {
  if (groupKey === "") {
    return [[formItems[0], null], [formItems[1]]];
  }
  if (groupKey === datasetSectionHeading) {
    const pairs: MetadataFormMapping[][] = [];
    for (let i = 0; i < 6 && i < formItems.length; i += 2) {
      pairs.push(formItems.slice(i, i + 2));
    }
    if (formItems.length > 6) {
      pairs.push(...formItems.slice(6).map(item => [item]));
    }
    return pairs;
  }
  if (groupKey === nationalPracticesHeading) {
    const pairs: MetadataFormMapping[][] = [];
    for (let i = 0; i < formItems.length; i += 2) {
      pairs.push(formItems.slice(i, i + 2));
    }
    return pairs;
  }
  return formItems.map(item => [item]) as (MetadataFormMapping | null)[][];
}

const RenderFormItem = ({
  formItem,
  errors,
  register,
}: {
  formItem: MetadataFormMapping;
  errors: FieldErrors<MetadataForm>;
  register: UseFormRegister<MetadataForm>;
}) => {
  switch (formItem.type) {
    case "text": {
      return (
        <FreeTextInput
          formItem={formItem}
          errors={errors}
          register={register(formItem.name, {
            required: formItem.required,
          })}
        />
      );
    }
    case "enum": {
      return (
        <SelectFromEnum
          formItem={formItem}
          errors={errors}
          register={register(formItem.name, {
            required: formItem.required,
          })}
        />
      );
    }
    case "year": {
      return (
        <SelectFromArray
          options={yearList}
          formItem={formItem}
          errors={errors}
          register={register(formItem.name, {
            required: formItem.required,
          })}
        />
      );
    }
    default: {
      return null;
    }
  }
};

type BaseProps = {
  mapping: Record<string, MetadataFormMapping[]>;
  datasetSectionHeading: string;
  nationalPracticesHeading: string;
  introTitle: string;
  introParagraphs: string[];
  countryOptions: string[];
  isLoadingCountries: boolean;
  countryRequired: boolean;
  onSubmit: SubmitHandler<MetadataForm>;
  backButton: ReactNode;
  isUploading: boolean;
  isUploadError: boolean;
  isNullFile: boolean;
};

export type UploadMetadataFormProps = Omit<
  BaseProps,
  | "mapping"
  | "introTitle"
  | "introParagraphs"
  | "datasetSectionHeading"
  | "nationalPracticesHeading"
>;

export function BaseUploadMetadataForm({
  mapping,
  datasetSectionHeading,
  nationalPracticesHeading,
  introTitle,
  introParagraphs,
  countryOptions,
  isLoadingCountries,
  countryRequired,
  onSubmit,
  backButton,
  isUploading,
  isUploadError,
  isNullFile,
}: BaseProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MetadataForm>({
    mode: "onSubmit",
    reValidateMode: "onChange",
    resolver: zodResolver(MetadataForm),
  });

  return (
    <Section>
      <Section>
        <Heading>{introTitle}</Heading>
        <div>
          {introParagraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <Tag type="red">*Required</Tag>
        </div>
        <Form className="" onSubmit={handleSubmit(onSubmit)}>
          <Stack gap={8}>
            {Object.entries(mapping).map(([group, formItems]) => {
              const rows = getFormRows(
                group,
                formItems,
                datasetSectionHeading,
                nationalPracticesHeading,
              );
              return (
                <Stack gap={5} key={group || "general"}>
                  <Section>
                    {group && <Heading>{group}</Heading>}
                    <FormGroup legendText="">
                      <Stack gap={6}>
                        {rows.map((row, rowIndex) => (
                          <div
                            key={rowIndex}
                            style={{
                              display: "grid",
                              gridTemplateColumns:
                                row.length === 2 ? "1fr 1fr" : "1fr",
                              gap: "1rem",
                            }}
                          >
                            {row.map((formItem, cellIndex) =>
                              formItem === null ? (
                                <div key={`empty-${rowIndex}-${cellIndex}`} />
                              ) : formItem.name === "country" ? (
                                <div key={formItem.name}>
                                  <CountrySelect
                                    countryOptions={countryOptions}
                                    isLoading={isLoadingCountries}
                                    errors={errors}
                                    register={register("country", {
                                      required: countryRequired,
                                    })}
                                  />
                                </div>
                              ) : (
                                <div key={formItem.name}>
                                  <RenderFormItem
                                    formItem={formItem}
                                    errors={errors}
                                    register={register}
                                  />
                                </div>
                              ),
                            )}
                          </div>
                        ))}
                      </Stack>
                    </FormGroup>
                  </Section>
                </Stack>
              );
            })}

            <ButtonSet>
              {backButton}
              <Button
                disabled={isUploading}
                renderIcon={
                  isUploading
                    ? props => (
                        <Loading small={true} withOverlay={false} {...props} />
                      )
                    : ArrowRight
                }
                type="submit"
                className="w-full"
                isExpressive
              >
                Submit
              </Button>
            </ButtonSet>

            {isUploadError && (
              <div className="text-giga-dark-red">
                Error occurred during file upload. Please try again
              </div>
            )}
            {isNullFile && (
              <div className="text-giga-red">
                File is missing at this step, please upload the file again
              </div>
            )}
          </Stack>
        </Form>
      </Section>
    </Section>
  );
}
