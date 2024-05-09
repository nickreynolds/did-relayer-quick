import { IAgentContext, ICredentialIssuer, ICredentialPlugin, IDataStore, TAgent } from '@veramo/core-types'
import { ICredentialIssuerEIP712 } from '@veramo/credential-eip712'
import { ICredentialIssuerLD } from '@veramo/credential-ld'
import Debug from 'debug'
const debug = Debug('veramo:did-provider-quick:saveDIDQuickUpdate')

// type IContext = IAgentContext<IDataStore & ICredentialPlugin & ICredentialIssuerEIP712 & ICredentialIssuerLD>

export async function saveDIDQuickUpdate(message: any, agent: TAgent<IDataStore & ICredentialPlugin & ICredentialIssuerEIP712 & ICredentialIssuerLD>): Promise<any> {
    console.log("saveDIDQuickUpdate 1")
    if (message.type === 'did-quick-update' && message.media_type === 'credential+ld+json') {
        console.log("saveDIDQuickUpdate 2")
        const credential = message.data
        const verification = await agent.verifyCredential({ credential: credential })
        if (verification.verified) {
            const credentialHash = await agent.dataStoreSaveVerifiableCredential({ verifiableCredential: credential })
            console.log("saved DIDQuickUpdate credentialHash: ", credentialHash)
        }
        return { success: true }
    } else {
        throw Error('Message not of type did-quick-update')
    }
//   console.log("saveDIDQuickUpdate 3")
//   return message
}