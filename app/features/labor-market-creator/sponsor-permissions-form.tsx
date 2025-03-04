import { zodResolver } from "@hookform/resolvers/zod";
import type { DefaultValues } from "react-hook-form";
import { FormProvider, useForm } from "react-hook-form";
import { FormProgress } from "~/components";
import { GatingFormFields } from "./gating-form-fields";
import type { GatingData } from "./schema";
import { GatingSchema } from "./schema";

export function SponsorPermissionsForm({
  defaultValues,
  onNext,
  onPrevious,
}: {
  defaultValues?: DefaultValues<GatingData>;
  onNext: (values: GatingData) => void;
  onPrevious: (values: GatingData) => void;
}) {
  const methods = useForm<GatingData>({
    defaultValues,
    resolver: zodResolver(GatingSchema),
  });

  const formData = methods.watch();

  const onGoBack = () => {
    onPrevious(formData);
  };

  return (
    <div className="w-full justify-between flex flex-col">
      <div className="max-w-2xl mx-auto px-5 my-16 space-y-10">
        <section className="space-y-1">
          <h1 className="text-3xl font-semibold antialiased">Sponsor Permissions</h1>
          <p className="text-cyan-500 text-lg">
            Define who has permission to launch challenges in this Marketplace. Sponsors launch time-bound challenges
            and fund tokens to reward Analysts.
          </p>
        </section>
        <FormProvider {...methods}>
          <GatingFormFields hint="Can launch challenges in this marketplace." />
        </FormProvider>
      </div>
      <FormProgress
        percent={40}
        onGoBack={onGoBack}
        onNext={methods.handleSubmit(onNext)}
        cancelLink={"/app/analyze"}
      />
    </div>
  );
}
