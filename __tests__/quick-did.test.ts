import { jest } from '@jest/globals'
import { createAgent, ICredentialPlugin, IDataStore, IDataStoreORM, IDIDManager, IIdentifier, IKey, IKeyManager, IResolver, MinimalImportableKey, TAgent } from '@veramo/core'
import { KeyManager, MemoryKeyStore, MemoryPrivateKeyStore } from '@veramo/key-manager'
import { KeyManagementSystem, SecretBox } from '@veramo/kms-local'
import { DIDManager, MemoryDIDStore } from '@veramo/did-manager'
import { QuickDIDProvider } from '../src/quick-did-provider'
import { createGanacheProvider } from './utils/ganache-providers'
import { createEthersProvider } from './utils/ethers-provider'
import { EthrDIDProvider } from '@veramo/did-provider-ethr'
import { CredentialIssuerEIP712, ICredentialIssuerEIP712 } from '@veramo/credential-eip712'
import { CredentialPlugin } from '@veramo/credential-w3c'
import { CredentialIssuerLD } from '@veramo/credential-ld'
import {
    ICredentialIssuerLD,
    LdDefaultContexts,
    VeramoEcdsaSecp256k1RecoverySignature2020,
    VeramoEd25519Signature2018,
    VeramoEd25519Signature2020,
    VeramoJsonWebSignature2020,
  } from '@veramo/credential-ld'
  import { contexts as credential_contexts } from '@transmute/credentials-context'
  import express from 'express'
import { saveDIDQuickUpdate } from '../src/saveDIDQuickUpdate'
import { resolveDID } from '../src/resolveDID'
import { DataSource } from 'typeorm'
import { DataStore, DataStoreORM, DIDStore, Entities, KeyStore, migrations, PrivateKeyStore } from '@veramo/data-store'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { getResolver as quickDidResolver } from '../src/quick-did-resolver'
import { getResolver as ethrDidResolver } from 'ethr-did-resolver'
import { Web3KeyManagementSystem } from '@veramo/kms-web3'


jest.setTimeout(10000)

const { provider, registry } = await createGanacheProvider()
const ethersProvider = createEthersProvider()

const quickDIDProvider = new QuickDIDProvider({
  defaultKms: 'local',
  relayerUrl: 'http://localhost:3131',
})

const databaseFile = ':memory:'
const infuraProjectId = '3586660d179141e3801c3895de1c2eba'
const secretKey = '29739248cad1bd1a0fc4d9b75cd4d2990de535baf5caadfdf8d8f86664aa830c'

const dbConnection = new DataSource({
  name: 'test',
  type: 'sqlite',
  database: databaseFile,
  synchronize: false,
  migrations: migrations,
  migrationsRun: true,
  logging: false,
  entities: Entities,
  // allow shared tests to override connection options
//   ...options?.context?.dbConnectionOptions,
}).initialize()

let agent: TAgent<
  IDIDManager &
    IKeyManager &
    IDataStore &
    IDataStoreORM &
    IResolver &
    ICredentialPlugin &
    ICredentialIssuerLD &
    ICredentialIssuerEIP712
>

agent = createAgent<  
            IDIDManager &
            IKeyManager &
            IDataStore &
            IDataStoreORM &
            IResolver &
            ICredentialPlugin &
            ICredentialIssuerLD &
            ICredentialIssuerEIP712
>({
    plugins: [
        new KeyManager({
            store: new KeyStore(dbConnection),
            kms: {
                local: new KeyManagementSystem(new PrivateKeyStore(dbConnection, new SecretBox(secretKey))),
                web3: new Web3KeyManagementSystem({
                    ethers: ethersProvider as any, // different versions of ethers complain about a type mismatch here
                  }),
            },
        }),
        new DIDManager({
            store: new MemoryDIDStore(),
            providers: {
                'did:quick': quickDIDProvider,
                'did:ethr': new EthrDIDProvider({
                    defaultKms: 'local',
                    ttl: 60 * 60 * 24 * 30 * 12 + 1,
                    networks: [
                    {
                        chainId: 1337,
                        name: 'ganache',
                        provider: provider as any, // different versions of ethers complain about a type mismatch here
                        registry,
                    },
                    ],
                }),
            },
            defaultProvider: 'did:quick',
        }),
        new DIDResolverPlugin({
            ...ethrDidResolver({
            infuraProjectId,
            networks: [
                {
                name: 'ganache',
                chainId: 1337,
                provider: provider as any,
                registry,
                },
            ],
            }),
            ...quickDidResolver({ nodeEndpoint: 'http://localhost:3131/resolveDIDQuick' }),
        }),
        new DataStore(dbConnection),
        new DataStoreORM(dbConnection),
        new CredentialPlugin(),
        new CredentialIssuerEIP712(),
        new CredentialIssuerLD({
            contextMaps: [LdDefaultContexts, credential_contexts as any],
            suites: [
                new VeramoEcdsaSecp256k1RecoverySignature2020(),
                new VeramoEd25519Signature2018(),
                new VeramoJsonWebSignature2020(),
                new VeramoEd25519Signature2020(),
            ],
        }),
    ],
})

const app = express()
app.use(express.json())
app.use('/add-did-quick-update', async (req, res) => {
    const message = req.body
    console.log("message: ", message)
    const result = await saveDIDQuickUpdate(message, agent)
    console.log("result: ", result)
    res.send(result)
})

app.use('/resolveDIDQuick', async (req, res) => {
  const message = req.body
  console.log("message: ", message)
  if (!message.didUrl) {
    throw Error('didUrl not found in request')
  }
  const result = await resolveDID(message.didUrl, agent)
  res.send(result)
})

const listener = app.listen(3131, () => {
    console.log("listening on 3131")
})

afterAll(async () => {
    listener.close()
})

describe('did-provider-quick', () => {
  it('should create identifier', async () => {
    // const options: ICreateIdentifierOpts = createIdentifierOpts
    const identifier: IIdentifier = await agent.didManagerCreate({ provider: 'did:quick' })

    // console.log('identifier quick', identifier)
    expect(identifier).toBeDefined()
    
    expect(identifier.keys.length).toBe(1)
    expect(identifier.services.length).toBe(0)
  })

//   it('should create identifier', async () => {
//     // const options: ICreateIdentifierOpts = createIdentifierOpts
//     const identifier: IIdentifier = await agent.didManagerCreate({ provider: 'did:ethr' })

//     // console.log('identifier ethr', identifier)
//     expect(identifier).toBeDefined()
    
//     expect(identifier.keys.length).toBe(1)
//     expect(identifier.services.length).toBe(0)
//   })

//   it('should list signing options for did:ethr with web3 backed keys', async () => {
//     const account = `0x71CB05EE1b1F506fF321Da3dac38f25c0c9ce6E1`
//     const did = `did:ethr:${account}`
//     const controllerKeyId = `ethers-${account}`
//     const iid = await agent.didManagerImport({
//       did,
//       provider: 'did:ethr',
//       controllerKeyId,
//       keys: [
//         {
//           kid: controllerKeyId,
//           type: 'Secp256k1',
//           kms: 'web3',
//           privateKeyHex: '',
//           publicKeyHex: '',
//           meta: {
//             account,
//             provider: 'ethers',
//             algorithms: ['eth_signMessage', 'eth_signTypedData'],
//           },
//         } as MinimalImportableKey,
//       ],
//     })

//     const options = await agent.listUsableProofFormats(iid)
//     expect(options).toEqual(['EthereumEip712Signature2021'])
//   })

//   it('should list signing options for did:ethr with local keys', async () => {
//     // const account = `0x71CB05EE1b1F506fF321Da3dac38f25c0c9ce6E1`
//     // const did = `did:ethr:${account}`
//     // const controllerKeyId = `ethers-${account}`
//     const iid = await agent.didManagerCreate({
//         provider: 'did:ethr:ganache',
//         kms: 'local',
//     })
//     // console.log("iid: ", iid)
//     const options = await agent.listUsableProofFormats(iid)
//     expect(options).toEqual(['jwt', 'lds', 'EthereumEip712Signature2021'])

//     const iid2 = await agent.didManagerGet({
//         did: iid.did
//     })
//     // console.log("iid2: ", iid2)
//     const options2 = await agent.listUsableProofFormats(iid2)
//     expect(options2).toEqual(['jwt', 'lds', 'EthereumEip712Signature2021'])
//   })

  // this fails with TypeError: Failed to parse URL from
  // .../veramo/node_modules/.pnpm/argon2-browser@1.18.0/node_modules/argon2-browser/dist/argon2.wasm
  it('should add key', async () => {
    // const options: ICreateIdentifierOpts = createIdentifierOpts
    const identifier: IIdentifier = await agent.didManagerCreate({ provider: 'did:quick' })

    // console.log('identifier', identifier)
    expect(identifier).toBeDefined()
    
    expect(identifier.keys.length).toBe(1)
    expect(identifier.services.length).toBe(0)

    const rootDID = identifier.did.replace('did:quick:', '')
    console.log("rootDID: ", rootDID)
    const rootIdentifier = await agent.didManagerGet({ did: rootDID })
    console.log("333 rootIdentifier: ", rootIdentifier)

    const newKey = await agent.keyManagerCreate({ kms: 'local', type: 'Ed25519' })
    // const addOpCred = await agent.createVerifiableCredential({
    //     credential: {
    //         issuer: identifier.did,
    //         issuanceDate: new Date().toISOString(),
    //         credentialSubject: {
    //             addOp: {
    //                 keyAgreementKey: newKey,
    //             },
    //         },
    //     },
    //     proofFormat: 'jwt',
    // })
    // console.log("addOpCred: ", addOpCred)

    // expect(addOpCred).toBeDefined()

    const added = await agent.didManagerAddKey({
        did: identifier.did,
        key: newKey,
        options: { },
    })

    console.log("added: ", added)
    expect(added).toBeDefined()

    const resolved = await agent.resolveDid({ didUrl: identifier.did })
    expect(resolved?.didDocument?.verificationMethod?.length).toBe(3)
  })

  it('should add service', async () => {
    // This DID is known in ION, hence no anchoring
    // const identifier: IIdentifier = await agent.didManagerCreate(
    //   existingDidConfig(false, 'test2-kid2', PRIVATE_DID2_KEY_HEX),
    // )
    // expect(identifier.alias).toEqual('did:ion:EiAxehS9OQs5bL00wmnZj6AupzvO5rB5KIobbi3oRtCmiw')
    // expect(identifier.did).toEqual(
    //   'did:ion:EiAxehS9OQs5bL00wmnZj6AupzvO5rB5KIobbi3oRtCmiw:eyJkZWx0YSI6eyJwYXRjaGVzIjpbeyJhY3Rpb24iOiJyZXBsYWNlIiwiZG9jdW1lbnQiOnsicHVibGljS2V5cyI6W3siaWQiOiJ0ZXN0Mi1raWQyIiwicHVibGljS2V5SndrIjp7ImNydiI6InNlY3AyNTZrMSIsImt0eSI6IkVDIiwieCI6ImRXcU81cmFkUDVyRnVVemZ2NE9tOGtQZ3ptdTE4S1RCeHhKWkZ5STR4ZTQiLCJ5IjoiWGI5em9WOWhvRTNqbnNmV0dOYjhGSmlqcjU1WUNHamFKbGtxVGJ6SWdWSSJ9LCJwdXJwb3NlcyI6WyJhdXRoZW50aWNhdGlvbiIsImFzc2VydGlvbk1ldGhvZCJdLCJ0eXBlIjoiRWNkc2FTZWNwMjU2azFWZXJpZmljYXRpb25LZXkyMDE5In1dfX1dLCJ1cGRhdGVDb21taXRtZW50IjoiRWlCenA3WWhOOW1oVWNac0ZkeG5mLWx3a1JVLWhWYkJ0WldzVm9KSFY2amt3QSJ9LCJzdWZmaXhEYXRhIjp7ImRlbHRhSGFzaCI6IkVpQXota1h2SVdsSjFfRElCVGlUSkpWRWo0R0U2eHQyTTZHcnVvRFIxcTNHU2ciLCJyZWNvdmVyeUNvbW1pdG1lbnQiOiJFaURBUVhTaTdIY2pKVkJZQUtkTzJ6ck00SGZ5Ym1CQkNXc2w2UFFQSl9qa2xBIn19',
    // )

    // const service: IService = {
    //   type: 'LinkedDomains',
    //   id: 'test' + Date.now(),
    //   serviceEndpoint: 'https://test-example.com',
    // }

    // const resultPromise = agent.didManagerAddService({
    //   did: identifier.did,
    //   service,
    //   options: { anchor: false },
    // })
    // try {
    //   expect(await resultPromise).toMatchObject({})
    // } catch (error) {
    //   if (error.message.includes('discovery_service.not_found')) {
    //     // MS node is not entirely stable. Sometimes the above error is thrown
    //     return
    //   }
    //   await expect(error.message).toMatch('An operation request already exists in queue for DID')
    // }
  })
})
