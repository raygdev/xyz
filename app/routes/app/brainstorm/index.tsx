import { ChevronSort16, ChevronSortDown16, ChevronSortUp16, Search16 } from "@carbon/icons-react";
import { Link, useSearchParams } from "@remix-run/react";
import { typedjson, useTypedLoaderData } from "remix-typedjson";

import { countLaborMarkets, searchLaborMarkets } from "~/services/labor-market.server";
import type { DataFunctionArgs } from "@remix-run/server-runtime";
import type { UseDataFunctionReturn } from "remix-typedjson/dist/remix";
import { getParamsOrFail } from "remix-params-helper";
import { LaborMarketSearchSchema } from "~/domain/labor-market";
import { ProjectBadge, TextWithIcon } from "~/components/ProjectBadge";
import { Button } from "~/components/Button";
import { Input } from "~/components/Input";
import { Select } from "~/components/Select";
import { MultiSelect } from "~/components/MultiSelect";
import { ValidatedForm } from "remix-validated-form";
import { z } from "zod";
import { withZod } from "@remix-validated-form/with-zod";

export const loader = async (data: DataFunctionArgs) => {
  const url = new URL(data.request.url);
  url.searchParams.set("type", "brainstorm");
  const params = getParamsOrFail(url.searchParams, LaborMarketSearchSchema);
  const marketplaces = await searchLaborMarkets(params);
  const totalResults = await countLaborMarkets(params);
  return typedjson({ marketplaces, totalResults, params }, { status: 200 });
};

export default function Brainstorm() {
  const { marketplaces, totalResults, params } = useTypedLoaderData<typeof loader>();
  // const [searchParams, setSearchParams] = useSearchParams();

  // const onPaginationChange = (page: number) => {
  //   searchParams.set("page", page.toString());
  //   setSearchParams(searchParams);
  // };

  return (
    <div className="mx-auto container space-y-7 px-3 mb-10">
      <section className="flex flex-col md:flex-row space-y-7 md:space-y-0 space-x-0 md:space-x-5">
        <main className="flex-1">
          <div className="space-y-3 max-w-3xl">
            <h1 className="text-3xl font-semibold">Challenge Marketplaces</h1>
            <p className="text-lg text-[#16ABDD]">
              Crowdsource the best questions for crypto analysts to answer about any web3 topic
            </p>
            <p className="text-[#666666]">
              Jump into challenge marketplaces to launch or discover brainstorm challenges. Join challenges to submit
              your best question ideas or review peers' submissions to surface and reward winners
            </p>
          </div>
        </main>
        <aside className="md:w-1/4">
          <Link to="/app/brainstorm/new">
            <Button className="mx-auto">Create Marketplace</Button>
          </Link>
        </aside>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">
          Challenge Marketplaces <span className="text-[#A5A5A5]">({totalResults})</span>
        </h2>
        {/* TODO: Divider */}
        <div className="border-b-2 border-b-[#EDEDED]" />
      </section>

      <section className="flex flex-col-reverse md:flex-row space-y-reverse gap-y-7 gap-x-5">
        <main className="flex-1">
          <div className="space-y-5">
            <MarketplacesTable marketplaces={marketplaces} />
            <div className="w-fit m-auto">
              {/* TODO <Pagination
                page={params.page}
                hidden={totalResults === 0}
                total={Math.ceil(totalResults / params.first)}
                onChange={onPaginationChange}
              /> */}
            </div>
          </div>
        </main>
        <aside className="md:w-1/4">
          <SearchAndFilter />
        </aside>
      </section>
    </div>
  );
}

function SearchAndFilter() {
  return (
    <ValidatedForm
      noValidate
      validator={withZod(z.any())}
      className="space-y-3 p-3 border-[1px] border-solid border-[#EDEDED] rounded-md bg-brand-400 bg-opacity-5"
    >
      <Input placeholder="Search" name="q" rightSection={<Search16 />} />
      <h3 className="md:hidden font-semibold text-lg">Sort:</h3>
      <div className="md:hidden">
        <Select
          placeholder="Select option"
          name="sortBy"
          options={[
            { label: "None", value: "none" },
            { label: "Chain/Project", value: "project" },
          ]}
        />
      </div>
      <h3 className="font-semibold text-lg">Filter:</h3>
      <MultiSelect
        radius="md"
        label="I am able to"
        placeholder="Select option"
        name="filter"
        clearable
        data={[
          { value: "launch", label: "Launch" },
          { value: "submit", label: "Submit" },
          { value: "review", label: "Review" },
        ]}
      />
      <MultiSelect
        radius="md"
        label="Reward Token"
        placeholder="Select option"
        name="rewardToken"
        clearable
        data={[
          { label: "Solana", value: "Solana" },
          { label: "Ethereum", value: "Ethereum" },
          { label: "USD", value: "USD" },
        ]}
      />
      <MultiSelect
        radius="md"
        label="Chain/Project"
        placeholder="Select option"
        name="chainProject"
        clearable
        data={[
          { label: "Solana", value: "Solana" },
          { label: "Ethereum", value: "Ethereum" },
        ]}
      />
      <Button>Apply Filters</Button>
    </ValidatedForm>
  );
}

type MarketplaceTableProps = {
  marketplaces: UseDataFunctionReturn<typeof loader>["marketplaces"];
};

// Responsive layout for displaying marketplaces. On desktop, takes on a pseudo-table layout. On mobile, hide the header and become a list of self-contained cards.
function MarketplacesTable({ marketplaces }: MarketplaceTableProps) {
  if (marketplaces.length === 0) {
    return <p>No results. Try changing search and filter options.</p>;
  }
  return (
    <>
      {/* Header (hide on mobile) */}
      <div className="hidden lg:grid grid-cols-6 gap-x-1 items-end px-2">
        <div className="col-span-2">
          <SortButton label="title" title="Challenge Marketplace" />
        </div>
        <p>Chain/Project</p>
        <p>Challenge Pool Totals</p>
        <p>Avg. Challenge Pool</p>
        <SortButton label="serviceRequests" title="# Challenges" />
      </div>
      {/* Rows */}
      <div className="space-y-3">
        {marketplaces.map((m) => {
          return (
            <Link
              to={`/app/brainstorm/${m.address}/challenges`}
              // On mobile, two column grid with "labels". On desktop hide the "labels".
              className="grid grid-cols-2 lg:grid-cols-6 gap-y-3 gap-x-1 items-center border-solid border-2 border-[#EDEDED] px-2 py-5 rounded-lg hover:border-brand-400 hover:shadow-md shadow-sm"
              key={m.address}
            >
              <div className="lg:hidden">Challenge Marketplaces</div>
              <div className="lg:col-span-2">{m.title}</div>

              <div className="lg:hidden">Chain/Project</div>
              <div>
                {m.projects.map((p) => (
                  <ProjectBadge key={p.slug} slug={p.slug} />
                ))}
              </div>

              <div className="lg:hidden">Challenge Pool Totals</div>
              <TextWithIcon text={`42000 USD`} iconUrl="/img/icons/dollar.svg" />

              <div className="lg:hidden">Avg. Challenge Pool</div>
              <TextWithIcon text={`42000 USD`} iconUrl="/img/icons/dollar.svg" />

              <div className="lg:hidden"># Challenges</div>
              <div>{m._count.serviceRequests.toLocaleString()}</div>
            </Link>
          );
        })}
      </div>
    </>
  );
}

function SortButton({ label, title }: { label: string; title: string }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const onSort = (header: string) => {
    searchParams.set("sortBy", header);
    if (searchParams.get("order") === "asc") {
      searchParams.set("order", "desc");
    } else {
      searchParams.set("order", "asc");
    }
    setSearchParams(searchParams);
  };

  return (
    <button onClick={() => onSort(label)} className="flex">
      <p>{title}</p>
      {searchParams.get("sortBy") === label ? (
        searchParams.get("order") === "asc" ? (
          <ChevronSortUp16 className="mt-2" />
        ) : (
          <ChevronSortDown16 />
        )
      ) : (
        <ChevronSort16 className="mt-1" />
      )}
    </button>
  );
}
