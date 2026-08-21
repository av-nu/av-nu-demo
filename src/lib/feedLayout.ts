export function shouldInsertFeedPrompt(productCount: number) {
  return productCount === 6 || (productCount > 6 && (productCount - 6) % 30 === 0);
}

export function feedPromptProductCounts(totalProducts: number) {
  return Array.from({ length: Math.max(0, totalProducts) }, (_, index) => index + 1).filter(shouldInsertFeedPrompt);
}
