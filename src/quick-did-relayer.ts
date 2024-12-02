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
      return true;
    }
    return false;
  }

  async postPendingUpdates(
    batchSize: number,
    context: IRequiredContext,
  ): Promise<boolean> {
    const updates = this.saveToArweaveStore.getIterator();
    const batch: string[] = [];
    for (let i = 0; i < 10; i++) {
      const result = await updates.next();
      if (result.done) break;
      batch.push(result.value[0]);
    }
    await postPendingDIDQuickUpdates(batch, context.agent);

    return true;

  }

}
