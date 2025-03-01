import { mongo } from "~/services/mongo.server";
import type { ActivityFilter, ActivitySearch, ParticipantSearch } from "./schemas";

/**
 * Counts the number of LaborMarkets that match a given LaborMarketSearch.
 */
export function countUserActivity(filter: ActivityFilter) {
  return mongo.userActivity.countDocuments(filterToMongo(filter));
}

/**
 * Returns an array of LaborMarketsWithIndexData for a given LaborMarketSearch.
 */
export function searchUserActivity(userAddress: string, search: ActivitySearch) {
  return mongo.userActivity
    .find({ userAddress, ...filterToMongo(search) })
    .sort({ [search.sortBy]: search.order === "asc" ? 1 : -1 })
    .skip(search.first * (search.page - 1))
    .limit(search.first)
    .toArray();
}

/**
 * Convenience function to share the search parameters between search and count.
 * @returns criteria to find labor market in MongoDb
 */
function filterToMongo(filter: ActivityFilter): Parameters<typeof mongo.userActivity.find>[0] {
  return {
    groupType: filter.groupType,
    ...(filter.q ? { $text: { $search: filter.q, $language: "english" } } : {}),
    ...(filter.groupType ? { groupType: { $in: filter.groupType } } : {}),
  };
}

export function findParticipants({
  requestId,
  laborMarketAddress,
  params,
}: {
  requestId: string;
  laborMarketAddress: `0x${string}`;
  params: ParticipantSearch;
}) {
  return mongo.userActivity
    .find({
      $and: [
        { groupType: { $in: ["Submission", "Review"] } },
        { "eventType.config.requestId": requestId },
        { "eventType.config.laborMarketAddress": laborMarketAddress },
        params.eventType ? { "eventType.eventType": { $in: params.eventType } } : {},
      ],
    })
    .sort({ [params.sortBy]: params.order === "asc" ? 1 : -1 })
    .toArray();
}

export function uniqueParticipants({
  requestId,
  laborMarketAddress,
}: {
  requestId: string;
  laborMarketAddress: `0x${string}`;
}) {
  return mongo.userActivity.distinct("userAddress", {
    groupType: { $in: ["Submission", "Review"] },
    "eventType.config.requestId": requestId,
    "eventType.config.laborMarketAddress": laborMarketAddress,
  });
}
