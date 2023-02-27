import {builder} from "../builder";
import {prisma} from "../db";

builder.prismaObject("Library", {
    description: 'A User Objects specific Library Relational Object',
    fields: (t) => ({
        id: t.exposeID('id'),
        data: t.exposeString('data'),
    })
})

builder.mutationFields((t) => ({
    updateLibrary: t.prismaField({
        type: 'Library',
        description: 'Update the current User Objects Library data',
        args: {updatedLibrary: t.arg.string({required: true})},
        resolve: async (query, root, args, ctx, info) => {
            if (!ctx.currentUserId) {
                throw new Error('Library could not be updated because user is not authenticated')
            }

            return prisma.library.update({...query, where: {userId: Number(ctx.currentUserId)}, data: {data: args.updatedLibrary}})
        }
    })
}))

