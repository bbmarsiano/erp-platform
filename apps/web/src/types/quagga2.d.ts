declare module '@ericblade/quagga2' {
  const Quagga: {
    init: (config: unknown, callback: (err?: unknown) => void) => void
    start: () => void
    stop: () => void
    onDetected: (callback: (result: { codeResult?: { code?: string } }) => void) => void
  }
  export default Quagga
}
