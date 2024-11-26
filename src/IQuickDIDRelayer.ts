import { IAgentContext, ICredentialPlugin, IDataStore, IDataStoreORM, IPluginMethodMap, VerifiableCredential } from "@veramo/core-types";

export type IRequiredContext = IAgentContext<IDataStore & IDataStoreORM & ICredentialPlugin>

export interface IQuickDIDRelayer extends IPluginMethodMap {
  saveCredential: (credential: VerifiableCredential,
    context: IRequiredContext) => Promise<boolean>;
  postPendingUpdates: (
    batchSize: number,
    context: IRequiredContext) => Promise<boolean>;
}