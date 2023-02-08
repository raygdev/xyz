import { z } from "zod";
import { EvmAddressSchema } from "./address";

export const SubmissionSearchSchema = z.object({
  q: z.string().optional().describe("Search query."),
  sortBy: z.enum(["title", "description", "createdAt", "reviews", "creatorId"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("asc"),
  score: z.number().optional(),
  first: z.number().default(10),
  page: z.number().default(1),
  serviceRequestId: z.string().optional(),
  laborMarketAddress: EvmAddressSchema.optional(),
});

export const SubmissionContractSchema = z.object({
  laborMarketAddress: EvmAddressSchema,
  serviceRequestId: z.string(),
  uri: z.string(),
});

export const SubmissionFormSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  submissionUrl: z.string().optional(),
});

export const SubmissionIndexerSchema = z.object({
  id: z.string(),
  contractId: z.string(),
  score: z.number(),
  serviceRequestId: z.string(),
  laborMarketAddress: EvmAddressSchema,
  creatorId: z.string(),
  title: z.string(),
  description: z.string(),
});

const SubmissionDocSchema = z.object({
  id: z.string(),
  laborMarketAddress: EvmAddressSchema,
  serviceRequestId: z.string(),
  valid: z.boolean(),
  reviewed: z.boolean(),
  submissionUrl: z.string().nullable(),
  blockTimestamp: z.date(),
  configuration: z.object({
    serviceProvider: EvmAddressSchema,
    uri: z.string(),
  }),
  reviewCount: z.number(),
  appData: SubmissionFormSchema.nullable(),
});

export const SubmissionEventSchema = z.object({
  requestId: z.string(),
  submissionId: z.string(),
});

export type SubmissionSearch = z.infer<typeof SubmissionSearchSchema>;
export type SubmissionContract = z.infer<typeof SubmissionContractSchema>;
export type SubmissionForm = z.infer<typeof SubmissionFormSchema>;
export type SubmissionIndexer = z.infer<typeof SubmissionIndexerSchema>;
export type SubmissionDoc = z.infer<typeof SubmissionDocSchema>;
