/**
 * Paymob card payment is done via a webview iframe.
 * URL: https://accept.paymob.com/api/acceptance/iframes/{iframeId}?payment_token={paymentKeyToken}
 * This function returns the URL to open in a WebView.
 */
export function openPaymobPayment(paymentKeyToken: string, iframeId: string): string {
  return `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${paymentKeyToken}`;
}
