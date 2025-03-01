import { useNavigate, useOutletContext } from "@remix-run/react";
import { LaborMarketCreator } from "~/features/labor-market-creator/labor-market-creator";
import type { OutletContext } from "./market_.new";
import { FormStepper } from "~/components";
import { BadgerLinks } from "~/features/labor-market-creator/badger-links";

export default function NewMarketplaceReviewPage() {
  const [formData] = useOutletContext<OutletContext>();
  const navigate = useNavigate();

  const onPrevious = () => {
    // TODO: update values?
    navigate(`/app/market/new/reviewer-permissions`);
  };

  return (
    <div className="flex relative min-h-screen">
      <LaborMarketCreator onPrevious={onPrevious} defaultValues={formData} />
      <aside className="w-1/4 py-28 ml-2 md:block hidden">
        <FormStepper
          step={5}
          labels={["Create", "Sponsor Permissions", "Author Permissions", "Reviewer Permissios", "Overview"]}
        />
        <BadgerLinks />
      </aside>
    </div>
  );
}
