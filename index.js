require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const USDT_ADDRESS = process.env.USDT_ADDRESS;
const FROM_ADDRESS = process.env.FROM_ADDRESS;

if (!RPC_URL || !PRIVATE_KEY || !USDT_ADDRESS || !FROM_ADDRESS) {
  console.error("Please set all required environment variables.");
  process.exit(1);
}

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

const USDT_ABI = [
  "function transfer(address to, uint amount) public returns (bool)"
];

const usdtContract = new ethers.Contract(USDT_ADDRESS, USDT_ABI, wallet);

app.get('/', (req, res) => {
  res.send('Backend is live and reachable');
});

app.post('/transfer', async (req, res) => {
  const { to, amount } = req.body;
  if (!to || !amount) {
    return res.status(400).json({ success: false, error: "Missing 'to' or 'amount'" });
  }
  try {
    console.log(`Sending ${amount} USDT to ${to}`);
    const txResponse = await usdtContract.transfer(to, ethers.parseUnits(amount.toString(), 18));
    await txResponse.wait();
    return res.json({ success: true, txHash: txResponse.hash });
  } catch (error) {
    console.error("Transfer error:", error);
    return res.status(500).json({ success: false, error: error.message || "Unknown error" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
