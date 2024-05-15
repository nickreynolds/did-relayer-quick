import { IAgentContext, ICredentialIssuer, ICredentialPlugin, IDataStore, TAgent } from '@veramo/core-types'
import { ICredentialIssuerEIP712 } from '@veramo/credential-eip712'
import { ICredentialIssuerLD } from '@veramo/credential-ld'
import Debug from 'debug'
import { createWitnessHash, postLeaf } from './utils/witnessApi'
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
            const witHash = createWitnessHash(credentialHash)
            const res = await postLeaf(witHash)
            console.log("witness response: ", res)
            console.log("akord api key: ", process.env.AKORD_API_KEY)
            const response = await fetch('https://api.akord.com/files?tag-file-category=VerifiableCredential&tag-credential-type=QuickDIDUpdate', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Api-Key': process.env.AKORD_API_KEY || '',
                    'Content-Type': 'text/plain'
                },
                body: JSON.stringify(credential)
            })
            if (!response.ok) {
                throw new Error("Failed to save DIDQuickUpdate to Akord. Response: " + JSON.stringify(response))
            }
            console.log("akord response: ", response)
        }
        return { success: true }
    } else {
        throw Error('Message not of type did-quick-update')
    }
//   console.log("saveDIDQuickUpdate 3")
//   return message
}