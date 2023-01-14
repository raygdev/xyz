import { assign, createMachine } from "xstate";

export const createChainTransactionMachine = <T>() => {
  return createMachine(
    {
      predictableActionArguments: true, //recommended
      id: "chain-write",
      initial: "idle",
      context: {
        contractData: undefined,
      },
      schema: {
        context: {} as { contractData?: T },
        events: {} as
          | { type: "TRANSACTION_PREPARE" }
          | { type: "TRANSACTION_READY"; data: T }
          | { type: "TRANSACTION_CANCEL" }
          | { type: "TRANSACTION_WRITE" }
          | { type: "TRANSACTION_SUCCESS" },
      },
      states: {
        idle: {
          on: {
            TRANSACTION_PREPARE: { target: "transactionPrepare" },
          },
        },
        transactionPrepare: {
          initial: "loading",
          on: {
            TRANSACTION_READY: {
              target: "transactionReady",
              actions: "setContractData",
            },
          },
          states: {
            loading: {},
            failure: {
              entry: "notifyTransactionPrepareFailure",
            },
          },
        },
        transactionReady: {
          on: {
            TRANSACTION_CANCEL: { target: "idle" }, //start over
            TRANSACTION_WRITE: { target: "transactionWrite" },
          },
        },
        transactionWrite: {
          entry: "notifyTransactionWrite",
          on: {
            TRANSACTION_SUCCESS: { target: "transactionComplete" },
          },
        },
        transactionComplete: {
          entry: "notifyTransactionSuccess",
        },
      },
    },
    {
      actions: {
        setContractData: assign({
          contractData: (context, event) => {
            if (event.type === "TRANSACTION_READY") {
              return event.data;
            }
            return context.contractData;
          },
        }),
      },
    }
  );
};
