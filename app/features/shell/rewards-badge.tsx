// import { useQuery } from "@tanstack/react-query";
// import { useOptionalUser } from "~/hooks/use-user";

export function RewardsBadge() {
  // TODO: Reward badge count
  // const user = useOptionalUser();
  // const { data } = useQuery({
  //   enabled: !!user,
  //   queryKey: ["rewardBadge", user?.id],
  //   queryFn: () => fetch("/api/rewards/count").then((res) => res.json()),
  // });
  const data = 0;

  return (
    <span>
      Rewards {data && data > 0 ? <span className="bg-gray-400 rounded-md py-1 px-2 text-white">{data}</span> : null}
    </span>
  );
}
