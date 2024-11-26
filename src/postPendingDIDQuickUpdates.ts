import { IAgentContext, ICredentialIssuer, ICredentialPlugin, IDataStore, IDataStoreORM, TAgent } from '@veramo/core-types'
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
import { IKeyValueStore, IKeyValueStoreOptions } from '@veramo/kv-store'

const arweave = Arweave.init({
    host: 'arweave.net',
    port: 443,
    protocol: 'https'
});

// dotenv.config();

export async function postPendingDIDQuickUpdates(batch: string[], agent: TAgent<IDataStore & IDataStoreORM & ICredentialPlugin>): Promise<any> {

    const credentials = await agent.dataStoreORMGetVerifiableCredentials({
        where: [
            {
                column: 'hash',
                value: batch,
                op: 'In',
            },
        ],
    });

    const witnessedCredentials = []

    for (const credential of credentials) {
        const witHash = createWitnessHash(credential.hash)
        try {
            const res = await getProof(witHash)

            witnessedCredentials.push({
                credential,
                proof: { ...res, leafIndex: res.leafIndex.toString() }
            })
        } catch (ex) {
            console.log("witness proof not available.")
        }
    }

    if (witnessedCredentials.length > 0) {
        const jwk = JSON.parse(process.env.ARWEAVE_WALLET_JWK!)
        const turboAuthClient = TurboFactory.authenticated({
            privateKey: jwk,
        });
        const credentialString = JSON.stringify(witnessedCredentials);
        const uploadResult = await turboAuthClient.uploadFile({
            fileStreamFactory: () => Readable.from(Buffer.from(credentialString)),
            fileSizeFactory: () => Buffer.byteLength(credentialString),
            signal: AbortSignal.timeout(10_000),
            dataItemOpts: {
                tags: [
                    {
                        name: 'Content-Type',
                        value: 'application/json',
                    },
                    {
                        name: 'DID-Quick-alpha',
                        value: 'Update',
                    },
                ],
            },
        });

        console.log("uploadResult: ", uploadResult)
    }

    return { success: true }
}