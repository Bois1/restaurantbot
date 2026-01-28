const axios = require('axios');

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

async function initializePayment(email, amount, reference, callbackUrl) {
  try {
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount: amount * 100,
        reference,
        callback_url: callbackUrl
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data.data.authorization_url;
  } catch (error) {
    console.error('Paystack init error:', error.message);
    throw error;
  }
}

async function verifyPayment(reference) {
  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` }
      }
    );
    return response.data.data.status === 'success';
  } catch (error) {
    return false;
  }
}

module.exports = { initializePayment, verifyPayment };