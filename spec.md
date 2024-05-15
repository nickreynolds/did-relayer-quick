# Authors

- [Nick Reynolds](https://github.com/nickreynolds)

# Status

**Version**: 0.1.0

:warning: This specification is still work in progress and the specification is subject to change. Don't use this for production use case cases. :warning:

# DID QUICK Specification

`did:quick` is a DID method that supports key & service updates in a decentralized way, without requiring on chain transactions from end-users.

It makes use of Ethereum, Arweave, Witness Protocol and optional relayers to provide permisionless DID updates at a scale acceptable for real world applications.

DID updates are made by signing a Verifiable Credential from the "root DID" that specifies the changes (e.g. adding a key, updating service endpoint). These VCreds are then submitted to Witness Protocol (as a hash) to timestamp them, and then added, along with the Witness proof, to Arweave (in a JSON Array) to preserve them, and a simple Ethereum TX is made to broadcast the Arweave content address.

TODO: specify hashing system

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
  DID     := `did:quick:<rootDID>`
  `rootDID`    := `<any supported DID>`
```


### Examples

```
- did:quick:did:ethr:0x1234...
- did:quick:did:ethr:4:0x1234
- did:quick:did:pkh:0x4444...
- ...
```

### Supported Root DID Methods:

* `did:ethr`
* `did:pkh`
* TODO: more?

## CRUD Operations


### CREATE
Like did:ethr and did:pkh, a did:quick does not need to be explicitly created. It can be resolved so long as the `rootDID` is resolvable.

### READ

To read a `did:quick`, a resolver must have all of the Verifiable Credential Updates associated with it (issued by the `rootDID`).

These Verifiable Credentials are stored on Arweave, and their existence is published/distributed via Ethereum Events.

Each event contains a reference to a piece of data stored on Arweave. This data MUST be an Array of WitnessedCredential JSON objects. (note: because publishing on the Ethereum Smart Contract is permissionless, it is possible that improper data is included. Any improperly formed data MUST be ignored.)

A `WitnessedCredential` JSON object contains 2 fields:
```
{
  witnessProof: <witness proof data associated with Verifiable Credential>
  verifiableCredential: <a Verifiable Credential>
}
```

By iterating over all emitted events, all Arweave data blobs can be retrieved. 

To resolve a `did:quick`, filter all Verifiable Credentials to get only those issued by the `did:quick`'s `rootDID`, sort them in ascending order by Witness timestamp, then iterate over this list of credentials to build the DID Document as follows:

TODO: describe loop

#### Example

For a `did:quick:did:ethr:` with no update operations, the DID Document would look as follows:

TODO: define metadata reqs

```json
{
  "didDocumentMetadata": {},
  "didResolutionMetadata": {},
  "didDocument": {
    "id": "did:quick:did:ethr:0x033ee37509aaf2c4d7a4aa32adef5307492477904117ba3236656031e51246c10a",
    "verificationMethod": [
      {
        "id": "did:quick:did:ethr:0x033ee37509aaf2c4d7a4aa32adef5307492477904117ba3236656031e51246c10a#controller",
        "type": "EcdsaSecp256k1RecoveryMethod2020",
        "controller": "did:quick:did:ethr:0x033ee37509aaf2c4d7a4aa32adef5307492477904117ba3236656031e51246c10a",
        "blockchainAccountId": "eip155:1:0xa3A36F4fa2C98D5a3849FbcFD04bA55287E9FB19"
      },
      {
        "id": "did:quick:did:ethr:0x033ee37509aaf2c4d7a4aa32adef5307492477904117ba3236656031e51246c10a#controllerKey",
        "type": "EcdsaSecp256k1VerificationKey2019",
        "controller": "did:quick:did:ethr:0x033ee37509aaf2c4d7a4aa32adef5307492477904117ba3236656031e51246c10a",
        "publicKeyHex": "033ee37509aaf2c4d7a4aa32adef5307492477904117ba3236656031e51246c10a"
      }
    ],
    "authentication": [
      "did:quick:did:ethr:0x033ee37509aaf2c4d7a4aa32adef5307492477904117ba3236656031e51246c10a#controller",
      "did:quick:did:ethr:0x033ee37509aaf2c4d7a4aa32adef5307492477904117ba3236656031e51246c10a#controllerKey"
    ],
    "assertionMethod": [
      "did:quick:did:ethr:0x033ee37509aaf2c4d7a4aa32adef5307492477904117ba3236656031e51246c10a#controller",
      "did:quick:did:ethr:0x033ee37509aaf2c4d7a4aa32adef5307492477904117ba3236656031e51246c10a#controllerKey"
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

All updates take the form of Verifiable Credentials with the following supported proof formats:
- EthereumEip712Signature2021
- JwtProof2020
- Ed25519Signature2018
- Ed25519Signature2020
- EcdsaSecp256k1RecoverySignature2020
- EcdsaSecp256r1Signature2019

Credentials must be issued by the `rootDID` associated with a `did:quick`

#### ADD KEY

Add Key Credential:
```
{
  type: `[VerifiableCredential, DIDQuickUpdate, DIDQuickAddKey]`,
  issuer: `rootDID`,
  credentialSubject:
  {
    key: {
      id: `someUniqueID`,
      type: `<"Ed25519", "X25519", "Secp256k1", or "Secp256r1">`,
      keyUse: `<"veriKey", "sigAuth" or "enc">`,
      publicKeyMultibase: <public key expressed in multibase format>
    }
  }
}
```

note: key IDs MUST be unique across the life of the DID (i.e. no re-using IDs after deleting)

#### DELETE KEY

Delete Key Credential:
```
{
  type: `[VerifiableCredential, DIDQuickUpdate, DIDQuickDeleteKey]`,
  issuer: `rootDID`,
  credentialSubject:
  {
    key: {
      id: `someUniqueID`
    }
  }
}
```

#### ADD SERVICE

Add Service Credential:
```
{
  type: `[VerifiableCredential, DIDQuickUpdate, DIDQuickAddService]`,
  issuer: `rootDID`,
  credentialSubject:
  {
    service: {
      id: `someUniqueID`,
      type: `<e.g. "DIDCommMessaging">`,
      description: `<"veriKey", "sigAuth" or "enc">`,
      serviceEndpoint: `<e.g. "did:web:didcommmediator.com" or "http://myendpoint.com">`
    }
  }
}
```

note: service IDs MUST be unique across the life of the DID (i.e. no re-using IDs after deleting)

#### DELETE SERVICE

Delete Service Credential:
```
{
  type: `[VerifiableCredential, DIDQuickUpdate, DIDQuickDeleteService]`,
  issuer: `rootDID`,
  credentialSubject:
  {
    service: {
      id: `someUniqueID`
    }
  }
}
```

### DELETE

Delete operations are inherited from the `rootDID`, if there are any.

No explicit delete operation for `did:quick` is provided.

## Privacy Considerations


## Security Considerations
As `did:quick` inherits the properties of the `rootDID`, security considerations of the `rootDID` must be noted.
