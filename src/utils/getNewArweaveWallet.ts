import {
    TurboFactory,
    USD,
    WinstonToTokenAmount,
    developmentTurboConfiguration,
} from "@ardrive/turbo-sdk";
import Arweave from "arweave";

(async () => {
    /**
     * Generate a key from the arweave wallet.
     */
    const arweave = new Arweave({});
    const jwk = await arweave.wallets.generate();

    console.log("jwk: ", JSON.stringify(jwk));

})();
