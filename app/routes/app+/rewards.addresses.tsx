import { ClipboardDocumentIcon, ExclamationTriangleIcon } from "@heroicons/react/20/solid";
import type { Network, Wallet } from "@prisma/client";
import type { ActionArgs, DataFunctionArgs } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import { withZod } from "@remix-validated-form/with-zod";
import { useCallback, useEffect, useState } from "react";
import { typedjson, useTypedLoaderData } from "remix-typedjson";
import { namedAction } from "remix-utils";
import type { ValidationErrorResponseData } from "remix-validated-form";
import { ValidatedForm, validationError } from "remix-validated-form";
import { Tooltip, ValidatedInput } from "~/components";
import { Button } from "~/components/button";
import { Card } from "~/components/card";
import { Container } from "~/components/container";
import { CopyToClipboard } from "~/components/copy-to-clipboard";
import { Modal } from "~/components/modal";
import { Header, Row, Table } from "~/components/table";
import type { EvmAddress } from "~/domain/address";
import { countReviews } from "~/domain/review/functions.server";
import { countSubmissionsWithRewards } from "~/domain/reward-submissions/functions.server";
import { WalletAddSchema, WalletDeleteSchema } from "~/domain/wallet";
import { AddPaymentAddressForm } from "~/features/add-payment-address-form";
import RewardsTab from "~/features/my-rewards/rewards-tab";
import { listNetworks } from "~/services/network.server";
import { requireUser } from "~/services/session.server";
import { addWalletAddress, deleteWalletAddress, findAllWalletsForUser } from "~/services/wallet.server";
import { fromNow } from "~/utils/date";
import { truncateAddress } from "~/utils/helpers";
import { isValidationError } from "~/utils/utils";
export const addWalletValidator = withZod(WalletAddSchema);
export const deleteWalletValidator = withZod(WalletDeleteSchema);

type WalletWithChain = Wallet & { chain: Network };

type ActionResponse = { wallet: Wallet } | ValidationErrorResponseData;

export async function action({ request }: ActionArgs) {
  const user = await requireUser(request, "/app/login?redirectto=app/rewards/addresses");

  return namedAction(request, {
    async create() {
      const formData = await addWalletValidator.validate(await request.formData());
      if (formData.error) return validationError(formData.error);
      const wallet = await addWalletAddress(user.id, formData.data);
      return typedjson({ wallet });
    },
    async delete() {
      const formData = await deleteWalletValidator.validate(await request.formData());
      if (formData.error) return validationError(formData.error);
      await deleteWalletAddress(formData.data);
      return typedjson(null, 200);
    },
  });
}

export const loader = async (data: DataFunctionArgs) => {
  const user = await requireUser(data.request, "/app/login?redirectto=app/rewards/addresses");
  const wallets = await findAllWalletsForUser(user.id);
  const submissionCount = await countSubmissionsWithRewards({
    fulfiller: user.address as EvmAddress,
    isPastEnforcementExpiration: true,
  });
  const userNetworks = wallets.map((w) => w.chain.name);
  const networks = await listNetworks();
  const newNetworks = networks.filter((n) => !userNetworks.includes(n.name));
  const reviewCount = await countReviews({ reviewer: user.address as EvmAddress });
  return typedjson({
    newNetworks,
    wallets,
    submissionCount,
    reviewCount,
    user,
  });
};

export default function PayoutAddresses() {
  const { wallets, submissionCount, reviewCount } = useTypedLoaderData<typeof loader>();

  return (
    <Container className="py-16 px-10">
      <div className="mb-16">
        <section className="flex flex-wrap gap-5 justify-between pb-2">
          <h1 className="text-3xl font-semibold">Manage Addresses</h1>
          <div className="flex flex-wrap gap-5 items-center">
            <AddAddressButton />
          </div>
        </section>
        <section className="max-w-3xl">
          <p className="text-lg text-cyan-500">Manage all your payout addresses to receive reward tokens</p>
          <p className="text-gray-500 text-sm">
            Reward tokens will automatically be sent to these wallets when you claim rewards
          </p>
          <div className="bg-amber-200/10 flex items-center rounded-md p-2 mt-2 w-fit">
            <ExclamationTriangleIcon className="text-yellow-700 mx-2 h-5 w-5 hidden md:block" />
            <p className="text-yellow-700 mr-2">
              Do not use CEX wallets to claim rewards. Only use self custody wallets.
            </p>
          </div>
        </section>
      </div>
      <RewardsTab submissionCount={submissionCount} reviewCount={reviewCount} addressesNum={wallets.length} />
      {wallets.length === 0 ? (
        <div className="flex">
          <p className="text-gray-500 mx-auto py-12">Add payout addresses and begin earning!</p>
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden lg:block">
            <AddressTable wallets={wallets} />
          </div>
          {/* Mobile */}
          <div className="block lg:hidden">
            <AddressCards wallets={wallets} />
          </div>
        </>
      )}
    </Container>
  );
}

function AddressTable({ wallets }: { wallets: WalletWithChain[] }) {
  return (
    <Table>
      <Header columns={12} className="text-xs text-gray-500 font-medium mb-2">
        <Header.Column span={2}>Chain</Header.Column>
        <Header.Column span={5}>Address</Header.Column>
        <Header.Column span={2}>Last Updated</Header.Column>
      </Header>
      {wallets.map((wallet) => {
        return (
          <Row columns={12} key={wallet.address}>
            <Row.Column span={2}>{wallet.chain.name}</Row.Column>
            <Row.Column span={5} className="flex flex-row items-center gap-x-2">
              <CopyToClipboard
                className="text-black"
                content={wallet.address}
                displayContent={truncateAddress(wallet.address)}
                iconRight={<ClipboardDocumentIcon className="ml-0.5 h-5 w-5" />}
              />
            </Row.Column>
            <Row.Column span={2} className="text-black">
              {fromNow(wallet.createdAt)}
            </Row.Column>
            <Row.Column span={3} className="flex flex-wrap gap-2">
              <RemoveAddressButton wallet={wallet} />
            </Row.Column>
          </Row>
        );
      })}
    </Table>
  );
}

function AddressCards({ wallets }: { wallets: WalletWithChain[] }) {
  return (
    <div className="space-y-3">
      {wallets.map((wallet) => {
        return (
          <Card
            // On mobile, two column grid with "labels". On desktop hide the "labels".
            className="grid grid-cols-2 lg:grid-cols-5 gap-y-3 gap-x-1 items-center px-2 py-5"
            key={wallet.address}
          >
            <div className="lg:hidden">Chain</div>
            <p>{wallet.chain.name}</p>
            <div className="lg:hidden">Address</div>
            <div className="lg:col-span-2 flex flex-row items-center gap-x-2">
              <p className="text-black">{truncateAddress(wallet.address)}</p>
              <ClipboardDocumentIcon className="ml-0.5 h-5 w-5" />
            </div>
            <div className="lg:hidden">Last Updated</div>
            <p className="text-black">{fromNow(wallet.createdAt)} </p>
            <div className="flex flex-wrap gap-2">
              <RemoveAddressButton wallet={wallet} />
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function AddAddressButton() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), [setOpen]);
  const { newNetworks } = useTypedLoaderData<typeof loader>();
  const fetcher = useFetcher<ActionResponse>();
  useEffect(() => {
    if (fetcher.data && !isValidationError(fetcher.data)) {
      close();
    }
  }, [fetcher.data, close]);

  return (
    <>
      <Tooltip content={"Wallets exist for all available chains"} hide={newNetworks.length > 0}>
        <Button className="mx-auto" onClick={() => setOpen(true)} disabled={newNetworks.length == 0}>
          Add Address
        </Button>
      </Tooltip>
      <Modal isOpen={open} onClose={close} title="Add an address" unmount>
        <ValidatedForm
          fetcher={fetcher}
          defaultValues={{
            payment: {
              networkName: "Polygon",
              address: "" as `0x${string}`,
            },
          }}
          method="post"
          action="?/create"
          name="create"
          subaction="create"
          validator={addWalletValidator}
          className="space-y-5 mt-5"
        >
          <div className="pb-44 pt-8">
            <AddPaymentAddressForm networks={newNetworks} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="cancel" onClick={close} type="button">
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </ValidatedForm>
      </Modal>
    </>
  );
}

function RemoveAddressButton({ wallet }: { wallet: WalletWithChain }) {
  const [openedRemove, setOpenedRemove] = useState(false);

  return (
    <>
      <Button variant="cancel" onClick={() => setOpenedRemove(true)}>
        Remove
      </Button>
      <Modal
        isOpen={openedRemove}
        onClose={() => setOpenedRemove(false)}
        title="Are you sure you want to remove?"
        unmount
      >
        <div className="space-y-5 mt-5">
          <div className="flex border-solid border rounded-md border-trueGray-200 items-center">
            <p className="text-sm font-semibold border-solid border-0 border-r border-trueGray-200 p-3 mr-2">
              {wallet.networkName}
            </p>
            <p className="overflow-x-auto">{wallet.address}</p>
          </div>
          <ValidatedForm method="post" action="?/delete" validator={deleteWalletValidator} className="space-y-5 mt-5">
            <div className="invisible h-0 w-0">
              <ValidatedInput type="hidden" id="id" name="id" value={wallet.id} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="cancel" onClick={() => setOpenedRemove(false)}>
                Cancel
              </Button>
              <Button type="submit">Remove</Button>
            </div>
          </ValidatedForm>
        </div>
      </Modal>
    </>
  );
}
