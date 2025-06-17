module.exports = {
  // List of environment variables to expose to the client
  publicRuntimeConfig: {
    NEXT_PUBLIC_EXCHANGE_API: process.env.NEXT_PUBLIC_EXCHANGE_API,
    NEXT_PUBLIC_STANCER_PUBLIC_KEY: process.env.NEXT_PUBLIC_STANCER_PUBLIC_KEY,
    NEXT_PUBLIC_STANCER_API: process.env.NEXT_PUBLIC_STANCER_API,
  },
};
