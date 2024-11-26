import { IAgentContext, ICredentialIssuer, ICredentialPlugin, IDataStore, TAgent, VerifiableCredential } from '@veramo/core-types'
import { ICredentialIssuerEIP712 } from '@veramo/credential-eip712'
import { ICredentialIssuerLD } from '@veramo/credential-ld'
import Debug from 'debug'
import { createWitnessHash, getProof, postLeaf } from './utils/witnessApi'
import { Readable } from 'stream';
const debug = Debug('veramo:did-provider-quick:saveDIDQuickUpdate')

import {
    ArweaveSigner,
    TurboFactory,
    USD,
    WinstonToTokenAmount,
    developmentTurboConfiguration,
} from "@ardrive/turbo-sdk";
import Arweave from "arweave";

import * as dotenv from "dotenv";
import open from "open";

const arweave = Arweave.init({
    host: 'arweave.net',
    port: 443,
    protocol: 'https'
});

dotenv.config();

export async function saveDIDQuickUpdate(message: any, agent: TAgent<IDataStore & ICredentialPlugin>): Promise<any> {
    console.log("saveDIDQuickUpdate 1")
    if (message.type === 'did-quick-update' && message.media_type === 'credential+ld+json') {
        console.log("saveDIDQuickUpdate 2")
        const credential = message.data
        const verification = await agent.verifyCredential({ credential: credential })
        if (verification.verified) {
            const verifiableCredential = credential as VerifiableCredential;
            // TODO: check credential  key validity, etc.
            if (verifiableCredential.type?.includes('DIDQuickUpdate')) {
                const credentialHash = await agent.dataStoreSaveVerifiableCredential({ verifiableCredential: credential })
                const witHash = createWitnessHash(credentialHash)
                await postLeaf(witHash)
                return { success: true, credentialHash }
            } else {
                throw Error('Message not of type did-quick-update')
            }
        }
        throw Error('Credential verification failed')
    } else {
        throw Error('unknown error in saveDIDQuickUpdate')
    }
}