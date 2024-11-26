import { IAgentContext, IAgentPlugin, ICredentialPlugin, IDIDManager, IIdentifier, IKey, IKeyManager, IService, VerifiableCredential } from '@veramo/core-types'
import { AbstractIdentifierProvider } from '@veramo/did-manager'
import Debug from 'debug'
import { ICredentialIssuerEIP712 } from '@veramo/credential-eip712'
// import { EthrDID } from 'ethr-did'
import { KeyValueStore } from '@veramo/kv-store'
import { IQuickDIDRelayer, IRequiredContext } from './IQuickDIDRelayer.js'
import { saveDIDQuickUpdate } from './saveDIDQuickUpdate.js'
import { postPendingDIDQuickUpdates } from './postPendingDIDQuickUpdates.js'

const debug = Debug('veramo:did-relayer-quick')

export interface CreateDidQuickOptions {

}

/**
 * {@link @veramo/did-manager#DIDManager} identifier provider for `did:quick` identifiers
 * @public
 */
export class QuickDIDRelayer implements IAgentPlugin {
  readonly methods: IQuickDIDRelayer

  private readonly saveToArweaveStore: KeyValueStore<boolean>

  constructor(options: {
    saveToArweaveStore: KeyValueStore<boolean>

  }) {
    this.saveToArweaveStore = options.saveToArweaveStore
    this.methods = {
      saveCredential: this.saveCredential.bind(this),
      postPendingUpdates: this.postPendingUpdates.bind(this),
    }
  }

  async saveCredential(
    credential: VerifiableCredential,
    context: IRequiredContext,
  ): Promise<boolean> {
    const { success, credentialHash } = await saveDIDQuickUpdate(credential, context.agent);
    if (success) {
      console.log("saveCredential credentialHash: ", credentialHash)
      await this.saveToArweaveStore.set(credentialHash, true);
      console.log("return true")
      return true;
    }
    console.log("return false")
    return false;
  }

  async postPendingUpdates(
    batchSize: number,
    context: IRequiredContext,
  ): Promise<boolean> {

    console.log("postPendingUpdates 1.")
    // const batchSize = 10;
    // async function processInBatches(
    //   asyncIterator: AsyncIterator<[key: string, value: boolean], void, any>,
    //   batchSize: number
    // ): Promise<void> {
    //   while (true) {
    //     const batch: string[] = [];
    //     for (let i = 0; i < batchSize; i++) {
    //       const result = await asyncIterator.next();
    //       if (result.done) break;
    //       batch.push(result.value[0]);
    //     }


    //     console.log("batch: ", batch)
    //     if (batch.length === 0) break; // No more items


    //     // Process the batch
    //     await processBatch(batch);
    //   }
    // }

    // async function processBatch(batch: string[]) {
    //   return postPendingDIDQuickUpdates(batch, context.agent)
    // }

    const updates = this.saveToArweaveStore.getIterator();
    const batch: string[] = [];
    for (let i = 0; i < 10; i++) {
      const result = await updates.next();
      if (result.done) break;
      batch.push(result.value[0]);
    }

    console.log("context: ", context)
    console.log("context.agent: ", context.agent)
    console.log("batch: ", batch)
    await postPendingDIDQuickUpdates(batch, context.agent);

    return true;

  }

}
