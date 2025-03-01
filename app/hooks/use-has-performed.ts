import { BigNumber, ethers } from "ethers";
import { useAccount, useContractRead } from "wagmi";
import type { EvmAddress } from "~/domain/address";
import { useContracts } from "./use-root-data";

// These constants should be the same as the internals on the contract
export const ACTIONS = {
  HAS_SIGNALED: ethers.utils.id("hasSignaled"),
  HAS_SUBMITTED: ethers.utils.id("hasSubmitted"),
  HAS_CLAIMED: ethers.utils.id("hasClaimed"),
} as const;

type Props = {
  laborMarketAddress: EvmAddress;
  id: string; // Could be a service request id or submissionid
  action: "HAS_SIGNALED" | "HAS_SUBMITTED" | "HAS_CLAIMED";
};

/**
 * * Hook to call the labor market contract and determine which actions a signed in user has performed on a service request.
 * @returns {boolean | undefined} Undefined if not logged in or during loading.
 */
export function useHasPerformed({ laborMarketAddress, id, action }: Props) {
  const contracts = useContracts();
  const { address: userAddress } = useAccount();

  const { data } = useContractRead({
    enabled: !!userAddress,
    address: laborMarketAddress,
    abi: contracts.LaborMarket.abi,
    functionName: "requestIdToAddressToPerformance",
    args: [BigNumber.from(id), userAddress as `0x${string}`],
  });

  return data;
}
