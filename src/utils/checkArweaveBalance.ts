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

(async () => {
    const jwk = JSON.parse(process.env.ARWEAVE_WALLET_JWK!)

    const address = await arweave.wallets.jwkToAddress(jwk);
    const signer = new ArweaveSigner(jwk);

    const turboAuthClient = TurboFactory.authenticated({
        privateKey: jwk,
    });


    const estimatedWinc = await turboAuthClient.getWincForFiat({
        amount: USD(10),
    });

    console.log("$10 - estimatedWinc: ", estimatedWinc);

    const balance = await turboAuthClient.getBalance();
    // open the URL to top-up, continue when done
    console.log("balance: ", balance);

})();
