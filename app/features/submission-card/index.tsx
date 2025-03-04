import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { Link } from "@remix-run/react";
import { Card, Score, UserBadge } from "~/components";
import type { SubmissionWithReviewsDoc } from "~/domain";
import { useOptionalUser } from "~/hooks/use-user";
import { fromNow } from "~/utils/date";

export function SubmissionCard({
  submission,
  selected,
  setSelected,
}: {
  submission: SubmissionWithReviewsDoc;
  selected: boolean;
  setSelected: (submission: SubmissionWithReviewsDoc) => void;
}) {
  const user = useOptionalUser();
  const reviewedByUser = user && submission.reviews.find((review) => review.reviewer === user.address);

  const handleClick = () => {
    setSelected(submission);
  };

  const reviewCount = submission.score?.reviewCount ? submission.score.reviewCount - (reviewedByUser ? 1 : 0) : 0;
  return (
    <div onClick={handleClick}>
      <Card className={`text-sm p-6 space-y-4 hover:cursor-pointer ${selected ? "border border-blue-600" : ""}`}>
        <div tabIndex={0} onClick={handleClick} className="flex flex-col-reverse md:flex-row space-y-reverse space-y-4">
          <main className="text-blue-600 text-sm flex flex-row items-center flex-1">
            <Link className="flex flex-row" target="_blank" to={submission.appData?.submissionUrl ?? ""}>
              {submission.appData?.title} <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-1" />{" "}
            </Link>
          </main>
          <div onClick={handleClick} className="flex flex-col items-center gap-2 md:mr-7 md:ml-24">
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
              <p>
                {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center text-xs">
          <span className="mr-1">{fromNow(submission.blockTimestamp)} by </span>
          <UserBadge address={submission.configuration.fulfiller} />
        </div>
      </Card>
    </div>
  );
}
