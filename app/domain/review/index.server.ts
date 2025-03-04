import { BigNumber } from "ethers";
import { getAddress } from "ethers/lib/utils.js";
import type { TracerEvent } from "pinekit/types";
import invariant from "tiny-invariant";
import type { ReviewAppData } from "~/domain/review/schemas";
import { ReviewAppDataSchema, ReviewEventSchema } from "~/domain/review/schemas";
import { mongo } from "../../services/mongo.server";
import { listTokens } from "~/services/tokens.server";
import { fetchIpfsJson } from "~/services/ipfs.server";
import { logger } from "~/services/logger.server";

export const indexerRequestReviewedEvent = async (event: TracerEvent) => {
  const contractAddress = getAddress(event.contract.address);
  const blockTimestamp = new Date(event.block.timestamp);
  const { submissionId, reviewer, reviewScore, requestId, reviewId, uri } = ReviewEventSchema.parse(
    event.decoded.inputs
  );

  let appData;
  try {
    appData = await getIndexedReviewAppData(uri);
  } catch (e) {
    logger.warn("Failed to parse review app data. Skipping indexing", e);
    return;
  }

  const submission = await mongo.submissions.findOne({
    laborMarketAddress: contractAddress,
    serviceRequestId: requestId,
    id: submissionId,
  });

  invariant(submission, "Submission not found when indexing review");

  const serviceRequest = await mongo.serviceRequests.findOne({
    laborMarketAddress: contractAddress,
    id: requestId,
  });

  invariant(serviceRequest, "Service request not found when indexing review");

  await mongo.submissions.updateOne(
    { laborMarketAddress: contractAddress, serviceRequestId: requestId, id: submissionId },
    {
      $set: {
        score: {
          reviewCount: (submission.score?.reviewCount ?? 0) + 1,
          reviewSum: BigNumber.from(submission.score?.reviewSum ?? 0)
            .add(reviewScore)
            .toNumber(),
          avg: Math.floor(
            ((submission.score?.reviewSum ?? 0) + parseInt(reviewScore)) / ((submission.score?.reviewCount ?? 0) + 1)
          ),
        },
      },
    }
  );

  const tokens = await listTokens();
  const token = tokens.find((t) => t.contractAddress === serviceRequest.configuration.pTokenReviewer);

  await mongo.reviews.insertOne({
    id: reviewId,
    laborMarketAddress: contractAddress,
    submissionId: submissionId,
    serviceRequestId: requestId,
    score: reviewScore,
    appData,
    reviewer: reviewer,
    indexedAt: new Date(),
    blockTimestamp,
    reward: {
      tokenAmount: BigNumber.from(serviceRequest.configuration.pTokenReviewerTotal)
        .div(serviceRequest.configuration.reviewerLimit)
        .toString(),
      tokenAddress: serviceRequest.configuration.pTokenReviewer,
      isIou: token?.isIou,
    },
  });

  //log this event in user activity collection
  await mongo.userActivity.insertOne({
    groupType: "Review",
    eventType: {
      eventType: "RequestReviewed",
      config: {
        laborMarketAddress: contractAddress,
        requestId: requestId,
        submissionId: submissionId,
        title: submission?.appData?.title ?? "",
      },
    },
    iconType: "submission",
    actionName: "Submission",
    userAddress: reviewer,
    blockTimestamp,
    indexedAt: new Date(),
  });
};

async function getIndexedReviewAppData(marketUri: string): Promise<ReviewAppData> {
  const data = await fetchIpfsJson(marketUri);
  return ReviewAppDataSchema.parse(data);
}
