import { Link } from "@remix-run/react";
import clsx from "clsx";
import { Card, Countdown, Header, Row, Table } from "~/components";
import { TokenBadgeByAddress } from "~/components/token-badge/token-badge";
import type { ServiceRequestDoc } from "~/domain/service-request/schemas";
import { ProjectBadgesBySlugs } from "~/features/project-badges";
import { dateHasPassed } from "~/utils/date";

export function ListChallenges(props: { serviceRequests: ServiceRequestDoc[] }) {
  return (
    <div>
      <div className="hidden lg:block">
        <ChallengeTable {...props} />
      </div>
      {/* Mobile */}
      <div className="block lg:hidden">
        <ChallengeGrid {...props} />
      </div>
    </div>
  );
}

function ChallengeTable({ serviceRequests }: { serviceRequests: ServiceRequestDoc[] }) {
  return (
    <Table>
      <Header columns={6} className="text-xs text-gray-500 font-medium mb-2">
        <Header.Column span={2}>Challenge</Header.Column>
        <Header.Column>Chain/Project</Header.Column>
        <Header.Column>Reward Pool</Header.Column>
        <Header.Column>Submit Deadline</Header.Column>
        <Header.Column>Review Deadline</Header.Column>
      </Header>
      {serviceRequests.map((sr) => {
        return (
          <Row asChild columns={6} key={sr.laborMarketAddress + sr.id}>
            <Link
              to={`/app/market/${sr.laborMarketAddress}/request/${sr.id}`}
              className={clsx("text-sm font-medium", { "opacity-60": dateHasPassed(sr.configuration.enforcementExp) })}
            >
              <Row.Column span={2}>
                <div className="flex gap-2">
                  {!dateHasPassed(sr.configuration.enforcementExp) ? (
                    <img src="/img/active-icon.svg" alt="" />
                  ) : (
                    <div className="w-2" />
                  )}
                  <p>{sr.appData?.title}</p>
                </div>
              </Row.Column>
              <Row.Column>
                <div className="flex">
                  <ProjectBadgesBySlugs slugs={sr.appData!.projectSlugs} />
                </div>
              </Row.Column>
              <Row.Column>
                <TokenBadgeByAddress
                  address={sr.configuration.pTokenProvider}
                  quantity={sr.configuration.pTokenProviderTotal}
                />
              </Row.Column>
              <Row.Column>
                <Countdown date={sr.configuration?.submissionExp} />
              </Row.Column>
              <Row.Column>
                <Countdown date={sr.configuration?.enforcementExp} />
              </Row.Column>
            </Link>
          </Row>
        );
      })}
    </Table>
  );
}

function ChallengeGrid({ serviceRequests }: { serviceRequests: ServiceRequestDoc[] }) {
  return (
    <div className="space-y-4">
      {serviceRequests.map((sr) => {
        return (
          <Card asChild key={sr.laborMarketAddress + sr.id}>
            <Link
              to={`/app/market/${sr.laborMarketAddress}/request/${sr.id}`}
              className={clsx("grid grid-cols-2 gap-y-3 gap-x-1 items-center px-4 py-5", {
                "opacity-60": dateHasPassed(sr.configuration.enforcementExp),
              })}
            >
              <div>Challenge</div>
              <div className="text-sm font-medium flex gap-2">
                {!dateHasPassed(sr.configuration.enforcementExp) ? (
                  <img src="/img/active-icon.svg" alt="" />
                ) : (
                  <div className="w-2"></div>
                )}
                <p>{sr.appData?.title}</p>
              </div>

              <div>Chain/Project</div>
              <div className="flex">
                <ProjectBadgesBySlugs slugs={sr.appData!.projectSlugs} />
              </div>

              <div>Reward Pool</div>
              <div>
                <TokenBadgeByAddress
                  address={sr.configuration.pTokenProvider}
                  quantity={sr.configuration.pTokenProviderTotal}
                />
              </div>
              <div>Submit Deadline</div>
              <div className="text-gray-500 text-sm">
                <Countdown date={sr.configuration?.submissionExp} />
              </div>
              <div>Review Deadline</div>
              <div className="text-gray-500 text-sm">
                <Countdown date={sr.configuration?.submissionExp} />
              </div>
            </Link>
          </Card>
        );
      })}
    </div>
  );
}
