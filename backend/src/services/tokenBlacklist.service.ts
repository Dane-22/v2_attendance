const blacklistedTokens = new Map<string, number>();

const pruneExpiredTokens = () => {
  const nowSeconds = Math.floor(Date.now() / 1000);

  for (const [token, exp] of blacklistedTokens.entries()) {
    if (exp <= nowSeconds) {
      blacklistedTokens.delete(token);
    }
  }
};

export const blacklistToken = (token: string, exp: number) => {
  pruneExpiredTokens();
  blacklistedTokens.set(token, exp);
};

export const isTokenBlacklisted = (token: string): boolean => {
  pruneExpiredTokens();
  return blacklistedTokens.has(token);
};
