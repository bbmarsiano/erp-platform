"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
require("fastify");
const authenticate = async (request, reply) => {
    try {
        const payload = await request.jwtVerify();
        request.user = {
            id: payload.id,
            email: payload.email,
            role: payload.role,
            tenantId: payload.tenantId
        };
    }
    catch {
        await reply.unauthorized('Invalid or expired token');
    }
};
exports.authenticate = authenticate;
