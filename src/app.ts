import {schema} from "./schema";
import dotenv from 'dotenv'
import {ApolloServer} from "@apollo/server";
import {startStandaloneServer} from "@apollo/server/standalone";
import {getUserId} from "./utils/utils";

dotenv.config()

const server = new ApolloServer({
    schema,
})

const bootstrap = async () => {
    return startStandaloneServer(server, {
        //@ts-ignore
        listen: {port: process.env.PORT || 4000},
        context: async ({req}) => {
            const token = req.headers.authorization || undefined;

            if (!token) {
                return {currentUserId: undefined}
            }

            return {currentUserId: getUserId(token)}
        }
    })
}


bootstrap().then((value) => {
    console.log(`🚀 Server listening on ${value.url}`)
})


