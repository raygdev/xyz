import { useRouteData } from "remix-utils";
import { CountdownCard } from "~/components/countdown-card";
import type { findServiceRequest } from "~/domain/service-request/functions.server";
import { dateHasPassed } from "~/utils/date";
import { claimToReviewDeadline } from "~/utils/helpers";

export default function ServiceIdTimeline() {
  const data = useRouteData<{ serviceRequest: Awaited<ReturnType<typeof findServiceRequest>> }>(
    "routes/app+/market_.$address.request.$requestId"
  );
  if (!data) {
    throw new Error("ServiceIdTimeline must be rendered under a ServiceId route");
  }
  const { serviceRequest } = data;
  if (!serviceRequest) {
    throw new Error("ServiceRequest not found");
  }

  const times = [
    { label: "claim to submit deadline", time: serviceRequest.configuration?.signalExp },
    { label: "submission deadline", time: serviceRequest.configuration?.submissionExp },
    {
      label: "claim to review deadline",
      time: claimToReviewDeadline(serviceRequest),
    },
    { label: "review deadline & winners", time: serviceRequest.configuration?.enforcementExp },
  ];

  const upcoming = times.filter((t) => t.time && !dateHasPassed(t.time));
  const passed = times.filter((t) => t.time && dateHasPassed(t.time));

  return (
    <section className="w-full border-spacing-4 border-separate space-y-14">
      {upcoming.length === 0 ? (
        <></>
      ) : (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Upcoming</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {upcoming.map((u) => (
              <CountdownCard start={serviceRequest.blockTimestamp} end={u.time} key={u.label}>
                {u.label}
              </CountdownCard>
            ))}
          </div>
        </div>
      )}
      {passed.length === 0 ? (
        <></>
      ) : (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Passed</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {passed.map((p) => (
              <CountdownCard start={serviceRequest.blockTimestamp} end={p.time} key={p.label}>
                {p.label}
              </CountdownCard>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
