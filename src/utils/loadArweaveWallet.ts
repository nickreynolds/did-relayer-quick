import {
    TurboFactory,
    USD,
    WinstonToTokenAmount,
    developmentTurboConfiguration,
} from "@ardrive/turbo-sdk";
import Arweave from "arweave";

import * as dotenv from "dotenv";

dotenv.config();

(async () => {
    const jwk = JSON.parse(process.env.ARWEAVE_WALLET_JWK!)
    console.log("jwk: ", jwk);
})();
