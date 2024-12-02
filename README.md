# Veramo did:quick relayer

This package contains an implementation of a `did:quick` relayer as a Veramo plugin

The relayer accepts DID Method Update credentials, saves them, submits them to Witness Protocol, and later publishes them to Arweave (using ArDrive's Turbo SDK)

In order to use this plugin, you will need to supply 2 environment variables:
`ARWEAVE_WALLET_JWK` - the JWK representation of an ArDrive wallet
`WITNESS_API_KEY` - an API key for interacting with Witness API