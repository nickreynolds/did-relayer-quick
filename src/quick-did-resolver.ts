import { fetch } from 'cross-fetch'
import { IIdentifier } from '@veramo/core-types'
import { DIDResolutionOptions, DIDResolutionResult, DIDResolver } from 'did-resolver'

export function getResolver(options: ConfigurationOptions): Record<string, DIDResolver> {
  return new QuickDidResolver(options).build()
}
export class QuickDidResolver {

  private nodeEndpoint: string
  constructor(options: ConfigurationOptions) {
    this.nodeEndpoint = options.nodeEndpoint
  }

  // export const resolveDidQuick: DIDResolver = async (didUrl: string, options?: DIDResolutionOptions): Promise<DIDResolutionResult> => {
  //   return resolve(didUrl, options)
  // }

  async resolve (didUrl: string, options?: DIDResolutionOptions) {
    return fetch(
      (this.nodeEndpoint || 'https://didmediate.com/resolveDIDQuick'), {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ didUrl }),
          
      }).then(async (response) => {
      if (response.status >= 400) {
        throw new Error(`Not Found:\r\n${didUrl}\r\n${JSON.stringify(await response.json())}`)
      }
      return response.json()
    })
  }

  /**
   * @public
   */
  build(): Record<string, DIDResolver>{
    return { quick: this.resolve.bind(this) }
  }
}

export interface ConfigurationOptions {
  nodeEndpoint: string
}
