import {builder} from "../builder";
import {prisma} from "../db";
import * as bcrypt from 'bcrypt'
import * as jwt from 'jsonwebtoken'
import {User} from "@prisma/client";
import {queryFromInfo} from "@pothos/plugin-prisma";

// This is a GraphQL type
const User = builder.prismaObject("User", {
    description: "A User Object",
    fields: (t) => ({
        id: t.exposeID('id'),
        username: t.exposeString('username'),
        email: t.exposeString('email'),
        createdAt: t.expose('createdAt', {
            type: 'Date'
        }),
        library: t.relation('library')
    })
})

const AuthenticatedPayload = builder.objectRef<{ uniqueToken: string, user: User }>('AuthenticatedPayload').implement({
    description: "Payload of an authenticated user, contains a unique token and a User object",
    fields: (t) => ({
        uniqueToken: t.string({
            resolve: (result) => result.uniqueToken
        }),
        user: t.field({
            type: User,
            resolve: (result) => result.user
        })
    })
})


builder.queryFields((t) => ({
    currentUser: t.prismaField({
        type: 'User',
        description: 'Query information about the current authenticated User',
        resolve: async (query, root, args, ctx, info) => {
            const user = await prisma.user.findUnique({...query, where: {id: Number(ctx.currentUserId)}})

            if (!user) {
                throw new Error('User not found')
            }

            return user
        }
    }),
}))

builder.mutationFields((t) => ({
    signup: t.field({
        type: AuthenticatedPayload,
        description: 'Create a new unique User Object in the database',
        args: {
            username: t.arg.string({required: true}),
            email: t.arg.string({required: true}),
            password: t.arg.string({required: true})
        },
        resolve: async (root, args, ctx, info) => {
            const existingUser = await prisma.user.findUnique({where: {email: args.email}})

            if (existingUser) {
                throw new Error('User information already exists.')
            }

            const salt = await bcrypt.genSalt()
            const hashedPassword = await bcrypt.hash(args.password, salt)

            const newUser = await prisma.user.create({
                ...queryFromInfo({
                    context: ctx,
                    info,
                    path: ['user', 'library']
                }),
                data: {
                    username: args.username,
                    email: args.email,
                    hashedPassword,
                    library: {
                        create: {
                            data: '{"all":{"ids":[]}}'
                        }
                    }
                }
            });

            const uniqueToken = jwt.sign(`${newUser.id}`, process.env.APP_SECRET_KEY as string)

            return {uniqueToken, user: newUser}
        }
    }),
    login: t.field({
        type: AuthenticatedPayload,
        description: 'Verify credentials to find User Object in database',
        args: {email: t.arg.string({required: true}), password: t.arg.string({required: true})},
        resolve: async (root, args, ctx, info) => {
            const user = await prisma.user.findUnique({
                ...queryFromInfo({
                    context: ctx,
                    info,
                    path: ['user', 'library']
                }), where: {email: args.email}
            })

            if (!user) {
                throw new Error('User does not exist.')
            }

            const isValidPassword = await bcrypt.compare(args.password, user.hashedPassword)

            if (!isValidPassword) {
                throw new Error('Invalid Password')
            }

            const uniqueToken = jwt.sign(`${user.id}`, process.env.APP_SECRET_KEY as string)

            return {uniqueToken, user}
        }
    }),
    deleteUser: t.prismaField({
        type: 'User',
        description: 'Remove the current authenticated User from the database',
        resolve: async (query, root, args, ctx, info) => {
            return prisma.user.delete({where: {id: Number(ctx.currentUserId)}})
        }
    }),
    updateUser: t.prismaField({
        type: 'User',
        description: 'Alter User information of the current User Object',
        args: {
            currentPassword: t.arg.string({required: true}),
            newEmail: t.arg.string({defaultValue: undefined}),
            newPassword: t.arg.string({defaultValue: undefined}),
        },
        resolve: async (query, root, args, ctx, info) => {
            // Check to see if user with new email already exists
            if (args.newEmail) {
                const existingUser = await prisma.user.findUnique({where: {email: args.newEmail}})
                if (existingUser) {
                    throw new Error('User with that email already exists')
                }
            }

            const user = await prisma.user.findUnique({where: {id: Number(ctx.currentUserId)}})
            if (!user) {
                throw new Error('User does not exist.')
            }

            const isValidPassword = await bcrypt.compare(args.currentPassword, user.hashedPassword)
            if (!isValidPassword) {
                throw new Error('Invalid password')
            }

            if (args.newEmail && args.newPassword) {
                const salt = await bcrypt.genSalt()
                const hashedPassword = await bcrypt.hash(args.newPassword, salt)

                return prisma.user.update({
                    ...query,
                    where: {id: Number(ctx.currentUserId)},
                    data: {email: args.newEmail, hashedPassword}
                })
            } else if (args.newEmail) {
                return prisma.user.update({...query, where: {id: Number(ctx.currentUserId)}, data: {email: args.newEmail}})
            } else if (args.newPassword) {
                const salt = await bcrypt.genSalt()
                const hashedPassword = await bcrypt.hash(args.newPassword, salt)

                return prisma.user.update({
                    ...query,
                    where: {id: Number(ctx.currentUserId)},
                    data: {hashedPassword}
                })
            }

            throw new Error('No new information provided.')
        }
    })

}))


