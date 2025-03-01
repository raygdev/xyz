import type { Project, Token } from "@prisma/client";
import { useNavigate } from "@remix-run/react";
import { BigNumber } from "ethers";
import { useCallback, useEffect, useState } from "react";
import type { DefaultValues } from "react-hook-form";
import { TxModal } from "~/components/tx-modal/tx-modal";
import type { EvmAddress } from "~/domain/address";
import { useContracts } from "~/hooks/use-root-data";
import { configureWrite, useTransactor } from "~/hooks/use-transactor";
import { claimDate, parseDatetime, unixTimestamp } from "~/utils/date";
import { postNewEvent } from "~/utils/fetch";
import { toTokenAmount, getEventFromLogs } from "~/utils/helpers";
import { OverviewForm } from "./overview-form";
import type { ServiceRequestForm } from "./schema";
import { LaborMarket__factory } from "~/contracts";
import { useAllowlistAllowances } from "~/hooks/use-allowlist-allowances";

type SequenceState =
  | { state: "initial" }
  | { state: "approve-reward"; data: ServiceRequestForm; approveAmount: BigNumber; skipApproveReviewerReward: boolean }
  | { state: "approve-reviewer-reward"; data: ServiceRequestForm }
  | { state: "create-service-request"; data: ServiceRequestForm };

interface ServiceRequestFormProps {
  projects: Project[];
  tokens: Token[];
  defaultValues?: DefaultValues<ServiceRequestForm>;
  laborMarketAddress: EvmAddress;
}

export function ServiceRequestCreator({
  defaultValues,
  laborMarketAddress,
  tokens,
  projects,
}: ServiceRequestFormProps) {
  const contracts = useContracts();
  const [sequence, setSequence] = useState<SequenceState>({ state: "initial" });

  const navigate = useNavigate();

  const { data: allowances } = useAllowlistAllowances({ laborMarketAddress });

  const approveRewardTransactor = useTransactor({
    onSuccess: useCallback(
      (receipt) => {
        if (sequence.state === "approve-reward") {
          if (sequence.skipApproveReviewerReward) {
            // No need to do a separate approval for reviewer reward
            setSequence({ state: "create-service-request", data: sequence.data });
          } else {
            setSequence({ state: "approve-reviewer-reward", data: sequence.data });
          }
        }
      },
      [sequence]
    ),
  });

  const approveReviewerRewardTransactor = useTransactor({
    onSuccess: useCallback(
      (receipt) => {
        if (sequence.state === "approve-reviewer-reward") {
          setSequence({ state: "create-service-request", data: sequence.data });
        }
      },
      [sequence]
    ),
  });

  const submitTransactor = useTransactor({
    onSuccess: useCallback(
      (receipt) => {
        // Parse the requestId from the event logs.
        const iface = LaborMarket__factory.createInterface();
        const event = getEventFromLogs(laborMarketAddress, iface, receipt.logs, "RequestConfigured");
        const requestId = event?.args["requestId"];
        // Navigate back to the market if we were unable to parse the log.
        const redirect = requestId
          ? `/app/market/${laborMarketAddress}/request/${requestId}`
          : `/app/market/${laborMarketAddress}`;
        postNewEvent({
          name: "RequestConfigured",
          address: laborMarketAddress,
          blockNumber: receipt.blockNumber,
          transactionHash: receipt.transactionHash,
        }).then(() => navigate(redirect));
      },
      [laborMarketAddress, navigate]
    ),
  });

  useEffect(() => {
    if (sequence.state === "approve-reward") {
      const values = sequence.data;
      approveRewardTransactor.start({
        config: () =>
          configureWrite({
            address: values.analyst.rewardToken,
            abi: ERC20_APPROVE_PARTIAL_ABI,
            functionName: "approve",
            args: [laborMarketAddress, sequence.approveAmount],
          }),
      });
    } else if (sequence.state === "approve-reviewer-reward") {
      const values = sequence.data;

      // Only approve the necessary amount of tokens
      const reviewerTokenAllowance =
        allowances?.find((a) => a.contractAddress === values.reviewer.rewardToken)?.allowance ?? BigNumber.from(0);
      const reviewerReward = toTokenAmount(values.reviewer.maxReward, values.reviewer.rewardTokenDecimals).mul(
        values.reviewer.reviewLimit
      );
      const approvalAmount = reviewerReward.sub(reviewerTokenAllowance);

      approveReviewerRewardTransactor.start({
        config: () =>
          configureWrite({
            address: values.reviewer.rewardToken,
            abi: ERC20_APPROVE_PARTIAL_ABI,
            functionName: "approve",
            args: [laborMarketAddress, approvalAmount],
          }),
      });
    } else if (sequence.state === "create-service-request") {
      const values = sequence.data;
      submitTransactor.start({
        metadata: values.appData,
        config: ({ cid }) => configureFromValues({ contracts, inputs: { cid, form: values, laborMarketAddress } }),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sequence]);

  const onSubmit = (values: ServiceRequestForm) => {
    const analystReward = toTokenAmount(values.analyst.maxReward, values.analyst.rewardTokenDecimals).mul(
      values.analyst.submitLimit
    );
    const reviewerReward = toTokenAmount(values.reviewer.maxReward, values.reviewer.rewardTokenDecimals).mul(
      values.reviewer.reviewLimit
    );

    // Get the allowances or default to 0
    const analystTokenAllowance =
      allowances?.find((a) => a.contractAddress === values.analyst.rewardToken)?.allowance ?? BigNumber.from(0);
    const reviewerTokenAllowance =
      allowances?.find((a) => a.contractAddress === values.reviewer.rewardToken)?.allowance ?? BigNumber.from(0);

    const isReviewRewardSameAsAnalystReward = values.analyst.rewardToken === values.reviewer.rewardToken;
    // Skip approving review if the tokens are the same or if approvals are greater than the reward
    const skipApproveReviewerReward = isReviewRewardSameAsAnalystReward || reviewerTokenAllowance.gte(reviewerReward);

    // initialize the approve amount to include the uni-token flow.
    let approveAmount = isReviewRewardSameAsAnalystReward ? analystReward.add(reviewerReward) : analystReward;

    // // If we do not have enough allowance for the analyst reward, start the flow to approve the token(s).
    if (analystTokenAllowance.lt(approveAmount))
      setSequence({
        state: "approve-reward",
        data: values,
        approveAmount,
        skipApproveReviewerReward,
      });
    // If we have enough allowance for the analyst reward but cannot skip the reviewer approval.
    else if (!skipApproveReviewerReward)
      setSequence({
        state: "approve-reviewer-reward",
        data: values,
      });
    // Otherwise, we can skip the approvals and go straight to submitting the transaction.
    else
      setSequence({
        state: "create-service-request",
        data: values,
      });
  };

  return (
    <>
      <TxModal
        transactor={approveRewardTransactor}
        title="Approve Analyst Reward"
        confirmationMessage={"Approve the app to transfer the tokens on your behalf"}
      />
      <TxModal
        transactor={approveReviewerRewardTransactor}
        title="Approve Reviewer Reward"
        confirmationMessage={"Approve the app to transfer the tokens on your behalf"}
      />
      <TxModal
        transactor={submitTransactor}
        title="Launch Challenge"
        confirmationMessage={"Confirm that you would like to launch this challenge and transfer the funds"}
        redirectStep={true}
      />

      <OverviewForm
        onSubmit={onSubmit}
        tokens={tokens}
        projects={projects}
        address={laborMarketAddress}
        defaultValues={defaultValues}
      />
    </>
  );
}

function configureFromValues({
  contracts,
  inputs,
}: {
  contracts: ReturnType<typeof useContracts>;
  inputs: {
    cid: string;
    form: ServiceRequestForm;
    laborMarketAddress: EvmAddress;
  };
}) {
  const { form, cid, laborMarketAddress } = inputs;
  const currentDate = new Date();
  const signalDeadline = new Date(claimDate(currentDate, parseDatetime(form.analyst.endDate, form.analyst.endTime)));

  const obj = {
    pTokenProvider: form.analyst.rewardToken,
    pTokenProviderTotal: toTokenAmount(form.analyst.maxReward, form.analyst.rewardTokenDecimals).mul(
      form.analyst.submitLimit
    ),
    pTokenReviewer: form.reviewer.rewardToken,
    pTokenReviewerTotal: toTokenAmount(form.reviewer.maxReward, form.reviewer.rewardTokenDecimals).mul(
      form.reviewer.reviewLimit
    ),
    providerLimit: BigNumber.from(form.analyst.submitLimit),
    reviewerLimit: BigNumber.from(form.reviewer.reviewLimit),
    enforcementExp: unixTimestamp(new Date(parseDatetime(form.reviewer.reviewEndDate, form.reviewer.reviewEndTime))),
    signalExp: unixTimestamp(signalDeadline),
    submissionExp: unixTimestamp(new Date(parseDatetime(form.analyst.endDate, form.analyst.endTime))),
  };

  return configureWrite({
    abi: contracts.LaborMarket.abi,
    address: laborMarketAddress,
    functionName: "submitRequest",
    args: [
      0, // Ok to hardcode here. Nonce is used to prevent duplicate ids in multicall.
      obj,
      cid,
    ],
  });
}

const ERC20_APPROVE_PARTIAL_ABI = [
  {
    constant: false,
    inputs: [
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
