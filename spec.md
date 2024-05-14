# Authors

- [Nick Reynolds](https://github.com/nickreynolds)

# Status

**Version**: 0.1.0

:warning: This specification is still work in progress and the specification is subject to change. Don't use this for production use case cases. :warning:

# DID QUICK Specification

`did:quick` is a DID method that supports key & service updates in a decentralized way, without requiring on chain transactions from end-users.

It makes use of Ethereum, Arweave, Witness Protocol and optional relayers to provide permisionless DID updates at a scale acceptable for real world applications.

DID updates are made by signing a Verifiable Credential from the "root DID" that specifies the changes (e.g. adding a key, updating service endpoint). These VCreds are then submitted to Witness Protocol (as a hash) to timestamp them, and then added to Arweave to preserve them, and a simple Ethereum TX is made to broadcast the Arweave content address.

This system can make use of "relayers" to reduce cost and eliminate it for end-users.

An end-user signs the VCred, submits it to a relayer which submits it to Witness, adds it to a blob of updates and periodically submits blobs of updates to Arweave & Ethereum. 

This architecture means that different relayers may resolve the same DID differently for small periods of time (until the relayer the update was submitted to publishes the update on Arweave+Ethereum). If this is a concern, the user can always bypass the relayer and submit the update to Arweave+Ethereum directly.

Resolvers (which may also be relayers) must listen to Ethereum events and download update data from Arweave when a new event is heard. When resolving a DID, the resolver takes all known updates associated with a DID, and applies them in order (by witness timestamp).


## DID Method Name

The name string that shall identify this DID method is: `quick`.

A DID that uses this method MUST begin with the following prefix: did:quick. Per the DID specification, this string MUST be in lowercase. The remainder of the DID, after the prefix, is specified below.

## Method Specific Identifier

Quick DIDs have the following format:

```
  DID     := did:quick:<rootDID>
  rootDID    := <any supported DID>
```


### Examples

```
- did:quick:did:ethr:0x1234...
- did:quick:did:ethr:4:0x1234
- did:quick:did:pkh:0x4444...
- ...
```

## CRUD Operations


### CREATE
Like did:ethr and did:pkh, a did:quick does not need to be explicitly created. It can be resolved so long as the rootDID is resolvable.

### READ


#### Example

For `did:quick:did:ethr:`, the DID Document would look as follows:

```json
{
  "didDocumentMetadata": {},
  "didResolutionMetadata": {},
  "didDocument": {
    "id": "did:quick:did:ethr:0x033ee37509aaf2c4d7a4aa32adef5307492477904117ba3236656031e51246c10a",
    "verificationMethod": [
      {
        "id": "did:ethr:0x033ee37509aaf2c4d7a4aa32adef5307492477904117ba3236656031e51246c10a#controller",
        "type": "EcdsaSecp256k1RecoveryMethod2020",
        "controller": "did:ethr:0x033ee37509aaf2c4d7a4aa32adef5307492477904117ba3236656031e51246c10a",
        "blockchainAccountId": "eip155:1:0xa3A36F4fa2C98D5a3849FbcFD04bA55287E9FB19"
      },
      {
        "id": "did:ethr:0x033ee37509aaf2c4d7a4aa32adef5307492477904117ba3236656031e51246c10a#controllerKey",
        "type": "EcdsaSecp256k1VerificationKey2019",
        "controller": "did:ethr:0x033ee37509aaf2c4d7a4aa32adef5307492477904117ba3236656031e51246c10a",
        "publicKeyHex": "033ee37509aaf2c4d7a4aa32adef5307492477904117ba3236656031e51246c10a"
      }
    ],
    "authentication": [
      "did:ethr:0x033ee37509aaf2c4d7a4aa32adef5307492477904117ba3236656031e51246c10a#controller",
      "did:ethr:0x033ee37509aaf2c4d7a4aa32adef5307492477904117ba3236656031e51246c10a#controllerKey"
    ],
    "assertionMethod": [
      "did:ethr:0x033ee37509aaf2c4d7a4aa32adef5307492477904117ba3236656031e51246c10a#controller",
      "did:ethr:0x033ee37509aaf2c4d7a4aa32adef5307492477904117ba3236656031e51246c10a#controllerKey"
    ],
    "@context": [
      "https://www.w3.org/ns/did/v1",
      "https://w3id.org/security/suites/secp256k1recovery-2020/v2",
      "https://w3id.org/security/v3-unstable"
    ],
    "keyAgreement": [],
    "service": []
  }
}
```


### UPDATE


### DELETE


## Privacy Considerations


## Security Considerations

