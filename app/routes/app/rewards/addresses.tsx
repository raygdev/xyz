import { CheckCircleIcon, ClipboardDocumentIcon, XCircleIcon } from "@heroicons/react/20/solid";
import type { Network, Wallet } from "@prisma/client";
import type { DataFunctionArgs } from "@remix-run/node";
import { withZod } from "@remix-validated-form/with-zod";
import { useEffect, useState } from "react";
import { typedjson, useTypedLoaderData } from "remix-typedjson";
import { ValidatedForm } from "remix-validated-form";
import { z } from "zod";
import { ValidatedInput } from "~/components";
import { Button } from "~/components/button";
import { Card } from "~/components/card";
import { Container } from "~/components/container";
import { CopyToClipboard } from "~/components/copy-to-clipboard";
import { Modal } from "~/components/modal";
import { Header, Row, Table } from "~/components/table";
import { EthAddressSchema, SolAddressSchema } from "~/domain/address";
import { AddPaymentAddressForm } from "~/features/add-payment-address-form";
import RewardsTab from "~/features/rewards-tab";
import { listNetworks } from "~/services/network.server";
import { getUserId } from "~/services/session.server";
import { listTokens } from "~/services/tokens.server";
import { findAllWalletsForUser } from "~/services/wallet.server";
import { fromNow } from "~/utils/date";
import { getNetworkByTokenSymbol, NETWORK_SYMBOLS, truncateAddress, VALIDATORS } from "~/utils/helpers";

export const loader = async (data: DataFunctionArgs) => {
  const user = await getUserId(data.request);
  const wallets = user ? await findAllWalletsForUser(user) : [];
  const tokens = await listTokens();
  const networks = await listNetworks();

  return typedjson({
    tokens,
    networks,
    wallets,
    user,
  });
};

export default function PayoutAddresses() {
  const { wallets } = useTypedLoaderData<typeof loader>();

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
        </section>
      </div>
      <RewardsTab rewardsNum={10} addressesNum={wallets ? wallets?.length : 0} />
      <AddressListView wallets={wallets} />
    </Container>
  );
}

function AddressListView({ wallets }: { wallets: any }) {
  if (wallets?.length === 0) {
    return (
      <div className="flex">
        <p className="text-gray-500 mx-auto py-12">Add payout addresses and begin earning!</p>
      </div>
    );
  }

  return (
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
  );
}

function AddressTable({
  wallets,
}: {
  wallets: (Wallet & {
    chain: Network;
  })[];
}) {
  return (
    <Table>
      <Header columns={12}>
        <Header.Column span={2}>Chain/Project</Header.Column>
        <Header.Column span={5}>Address</Header.Column>
        <Header.Column span={2}>Last Updated</Header.Column>
      </Header>
      {wallets.map((wallet) => {
        return (
          <Row columns={12} key={wallet.address}>
            <Row.Column span={2}>project</Row.Column>
            <Row.Column span={5} className="flex flex-row items-center gap-x-2">
              {validateAddress(wallet.address, wallet.chain.name) ? (
                <CheckCircleIcon className="text-lime-500 h-5 w-5" />
              ) : (
                <XCircleIcon className="text-rose-500 h-5 w-5" />
              )}
              <CopyToClipboard
                className="text-black"
                content={wallet.address}
                iconRight={<ClipboardDocumentIcon className="ml-0.5 h-5 w-5" />}
              />
            </Row.Column>
            <Row.Column span={2} className="text-black">
              {fromNow(wallet.createdAt)}
            </Row.Column>
            <Row.Column span={3} className="flex flex-wrap gap-2">
              <RemoveAddressButton wallet={wallet} />
              <UpdateAddressButton wallet={wallet} />
            </Row.Column>
          </Row>
        );
      })}
    </Table>
  );
}

function AddressCards({
  wallets,
}: {
  wallets: (Wallet & {
    chain: Network;
  })[];
}) {
  return (
    <div className="space-y-3">
      {wallets.map((wallet) => {
        return (
          <Card
            // On mobile, two column grid with "labels". On desktop hide the "labels".
            className="grid grid-cols-2 lg:grid-cols-5 gap-y-3 gap-x-1 items-center px-2 py-5"
            key={wallet.address}
          >
            <div className="lg:hidden">Chain/Project</div>
            <p>project</p>
            <div className="lg:hidden">Address</div>
            <div className="lg:col-span-2 flex flex-row items-center gap-x-2">
              {validateAddress(wallet.address, wallet.chain.name) ? (
                <CheckCircleIcon className="text-lime-500 h-5 w-5" />
              ) : (
                <XCircleIcon className="text-rose-500 h-5 w-5" />
              )}
              <p className="text-black">{truncateAddress(wallet.address)}</p>
              <ClipboardDocumentIcon className="ml-0.5 h-5 w-5" />
            </div>
            <div className="lg:hidden">Last Updated</div>
            <p className="text-black">{fromNow(wallet.createdAt)} </p>
            <div className="flex flex-wrap gap-2">
              <RemoveAddressButton wallet={wallet} />
              <UpdateAddressButton wallet={wallet} />
            </div>
          </Card>
        );
      })}
    </div>
  );
}

const addWalletSchema = z.object({
  payment: z.discriminatedUnion("networkName", [
    z.object({ networkName: z.literal("Ethereum"), address: EthAddressSchema }),
    z.object({ networkName: z.literal("Solana"), address: SolAddressSchema }),
  ]),
  userId: z.string({ description: "The ID of the user the wallet belongs to." }),
});

const updateWalletSchema = z.object({
  userId: z.string({ description: "The ID of the user the wallet belongs to." }),
  currentAddress: z.string({ description: "The current address of the wallet." }),
  newAddress: z.string({ description: "The new address of the wallet." }),
});

const deleteWalletSchema = z.object({
  currentAddress: z.string({ description: "The current address of the wallet." }),
});

export const addWalletValidator = withZod(addWalletSchema);
export const deleteWalletValidator = withZod(deleteWalletSchema);
export const updateWalletValidator = withZod(updateWalletSchema);

function AddAddressButton() {
  const { tokens, networks } = useTypedLoaderData<typeof loader>();
  const [openedAdd, setOpenedAdd] = useState(false);

  const { user } = useTypedLoaderData<typeof loader>();
  const [selectedNetwork, setSelectedNetwork] = useState<string>("");
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [validAddress, setValidAddress] = useState(false);

  useEffect(() => {
    if (selectedAddress && selectedNetwork) {
      const isValid = validateAddress(selectedAddress, getNetworkByTokenSymbol(selectedNetwork));
      setValidAddress(isValid);
    }
  }, [selectedAddress, selectedNetwork]);

  return (
    <>
      <Button className="mx-auto" onClick={() => setOpenedAdd(true)}>
        Add Address
      </Button>
      <Modal isOpen={openedAdd} onClose={() => setOpenedAdd(false)} title="Add an address">
        <ValidatedForm
          action="/app/rewards/wallet/add"
          method="post"
          validator={addWalletValidator}
          className="space-y-5 mt-5"
        >
          <div className="pb-44 pt-8">
            <AddPaymentAddressForm networks={networks} />
          </div>
          <div className="invisible h-0 w-0">
            <ValidatedInput type="hidden" id="userId" name="userId" value={user ? user : ""} />
            <ValidatedInput type="hidden" id="action" name="action" value={"add"} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="cancel" onClick={() => setOpenedAdd(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </ValidatedForm>
      </Modal>
    </>
  );
}

function RemoveAddressButton({ wallet }: { wallet: Wallet & { chain: Network } }) {
  const [openedRemove, setOpenedRemove] = useState(false);

  return (
    <>
      <Button variant="cancel" onClick={() => setOpenedRemove(true)}>
        Remove
      </Button>
      <Modal isOpen={openedRemove} onClose={() => setOpenedRemove(false)} title="Are you sure you want to remove?">
        <div className="space-y-5 mt-5">
          <div className="flex border-solid border rounded-md border-trueGray-200 items-center">
            <p className="text-sm font-semibold border-solid border-0 border-r border-trueGray-200 p-3">
              {NETWORK_SYMBOLS[wallet.chain.name as keyof typeof NETWORK_SYMBOLS]}
            </p>
            <p className="pl-2 overflow-clip">{wallet.address}</p>
          </div>
          <ValidatedForm
            action="/app/rewards/wallet/remove"
            method="post"
            validator={deleteWalletValidator}
            className="space-y-5 mt-5"
          >
            <div className="invisible h-0 w-0">
              <ValidatedInput type="hidden" id="currentAddress" name="currentAddress" value={wallet.address} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="cancel" onClick={() => setOpenedRemove(false)}>
                Cancel
              </Button>
              <Button type="submit" onClick={() => setOpenedRemove(false)}>
                Remove
              </Button>
            </div>
          </ValidatedForm>
        </div>
      </Modal>
    </>
  );
}
type ObjectKey = keyof typeof VALIDATORS;

export function validateAddress(address: string, network: string) {
  try {
    const networkName = network.toLowerCase() as ObjectKey;
    if (!networkName) throw new Error("Sorry we don't support this network yet.");
    const networkSchema = VALIDATORS[networkName];
    networkSchema?.parse(address);
  } catch (e) {
    console.log(e, "not a valid address");
    return false;
  }
  return true;
}

function UpdateAddressButton({
  wallet,
}: {
  wallet: Wallet & {
    chain: Network;
  };
}) {
  const [openedUpdate, setOpenedUpdate] = useState(false);
  const { user } = useTypedLoaderData<typeof loader>();
  const [validAddress, setValidAddress] = useState(false);

  return (
    <>
      <Button variant="primary" onClick={() => setOpenedUpdate(true)}>
        Update
      </Button>
      <Modal isOpen={openedUpdate} onClose={() => setOpenedUpdate(false)} title="Update address">
        <ValidatedForm action="/app/rewards/wallet/update" method="post" validator={updateWalletValidator}>
          <div className="space-y-5 mt-5">
            <div className="space-y-2">
              <div className="flex border-solid border rounded-md border-trueGray-200">
                <p className="text-sm font-semibold border-solid border-0 border-r border-trueGray-200 p-3">
                  {NETWORK_SYMBOLS[wallet.chain.name as keyof typeof NETWORK_SYMBOLS]}
                </p>
                <div className="flex items-center ml-2">
                  <div>
                    {validAddress ? (
                      <CheckCircleIcon className="mr-1 text-lime-500 h-5 w-5" />
                    ) : (
                      <XCircleIcon className="mr-1 text-rose-500 h-5 w-5" />
                    )}
                  </div>
                  <input
                    className="border-none w-full focus:outline-none"
                    id="newAddress"
                    name="newAddress"
                    placeholder="Update Address"
                    onChange={(e) => {
                      validateAddress(e.target.value, wallet.chain.name)
                        ? setValidAddress(true)
                        : setValidAddress(false);
                    }}
                  />
                  <div className="invisible h-0">
                    <ValidatedInput type="hidden" id="userId" name="userId" value={user ? user : ""} />
                    <ValidatedInput type="hidden" id="currentAddress" name="currentAddress" value={wallet.address} />
                  </div>
                </div>
              </div>
              {validAddress ? null : (
                <p className="text-xs text-red-500">Please enter a valid address. If you are having issues go here</p>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="reset" variant="cancel" onClick={() => setOpenedUpdate(false)}>
                Cancel
              </Button>
              <Button disabled={!validAddress} onClick={() => setOpenedUpdate(false)} type="submit">
                Save
              </Button>
            </div>
          </div>
        </ValidatedForm>
      </Modal>
    </>
  );
}
