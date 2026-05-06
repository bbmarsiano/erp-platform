declare module 'fastify-plugin/plugin.js' {
  const fp: <T>(plugin: T) => T
  export default fp
}
