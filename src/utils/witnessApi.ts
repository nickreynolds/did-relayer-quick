import { WitnessClient } from "@witnessco/client";

export const API_KEY = process.env.WITNESS_API_KEY

export const createWitnessHash = (content: string): `0x${string}` => {
  const witness = new WitnessClient(API_KEY)
  return witness.hash(content)
}

export const getTimestamp = async (leafHash: `0x${string}`): Promise<Date | undefined> => {
  const witness = new WitnessClient(API_KEY)
  try {
    const timestamp = await witness.getTimestampForLeafHash(leafHash);
    // console.log("timestamp: ", timestamp)
    return timestamp
  } catch (ex) {
    console.log("no timestamp found")
    await postLeaf(leafHash)
    return undefined
  }
};

export const postLeaf = async (leafHash: `0x${string}`): Promise<any> => {
  const witness = new WitnessClient(API_KEY)
  const result = await witness.postLeaf(leafHash);
  //   console.log("result: ", result)
  return result
};

export const getProof = async (leafHash: `0x${string}`): Promise<any> => {
  const witness = new WitnessClient(API_KEY)
  const result = await witness.getProofForLeafHash(leafHash);
  return result
}