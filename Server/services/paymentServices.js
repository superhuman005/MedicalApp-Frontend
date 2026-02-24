const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET);

exports.createPaymentIntent = async (req, res) => {
  const { amount } = req.body;

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100,
    currency: "usd"
  });

  res.json({ clientSecret: paymentIntent.client_secret });
};