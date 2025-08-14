declare module 'fastify' {
  interface FastifyInstance {
    io: any;
    addHook: (...args: any[]) => any;
    get<T = any>(...args: any[]): any;
    post<T = any>(...args: any[]): any;
    register: (...args: any[]) => any;
    decorate: (name: string, value: any) => any;
    server: any;
  }
  interface FastifyRequest {
    playerId?: string;
    sessionCode?: string;
  }
  interface FastifyReply {}
}