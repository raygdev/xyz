import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { Link } from "@remix-run/react";
import { Card, Score, UserBadge } from "~/components";
import type { SubmissionWithReviewsDoc } from "~/domain";
import { useOptionalUser } from "~/hooks/use-user";
import { fromNow } from "~/utils/date";
import { submissionCreatedDate } from "~/utils/helpers";

export function SubmissionCard({ submission }: { submission: SubmissionWithReviewsDoc }) {
  const user = useOptionalUser();
  const reviewedByUser = user && submission.reviews.find((review) => review.reviewer === user.address);

  return (
    <Card className="text-sm p-6 space-y-4">
      <Link
        to={`/app/market/${submission.laborMarketAddress}/request/${submission.serviceRequestId}/submission/${submission.id}`}
        className="flex flex-col-reverse md:flex-row space-y-reverse space-y-4"
      >
        <main className="text-blue-600 text-sm flex flex-row items-center flex-1">
          {submission.appData?.title} <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-1" />
        </main>
        <div className="flex flex-col items-center gap-2 md:mr-7 md:ml-24">
          {submission.score !== undefined && <Score score={submission.score?.avg} />}
          <div className="flex text-xs text-gray-500 items-center">
            {reviewedByUser ? (
              <>
                <img src="/img/review-avatar.png" alt="" className="h-4 w-4 mr-1" />
                <p className="text-zinc-800">You</p>
                <p>{" + "}</p>
              </>
            ) : (
              <></>
            )}
            <p>{submission.score?.reviewCount ?? 0} reviews</p>
          </div>
        </div>
      </Link>
      <div className="flex flex-wrap items-center text-xs">
        <span className="mr-1">{fromNow(submissionCreatedDate(submission))} by </span>
        <UserBadge address={submission.configuration.fulfiller} />
      </div>
    </Card>
  );
}
