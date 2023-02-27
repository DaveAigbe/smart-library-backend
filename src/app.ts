import {schema} from "./schema";
import dotenv from 'dotenv'
import {ApolloServer} from "@apollo/server";
import {startStandaloneServer} from "@apollo/server/standalone";
import {getUserId} from "./utils/utils";

dotenv.config()

const server = new ApolloServer({
    schema,
    introspection: true
})

const bootstrap = async () => {
    await startStandaloneServer(server, {
        listen: {port: Number(process.env.API_PORT) || 4000},
        context: async ({req, res}) => {
            const token = req.headers.authorization || undefined;

            if (!token) {
                return {currentUserId: undefined}
            }
            
            return {currentUserId: getUserId(token)}
        }
    }).then((value) => {
        console.log(`🚀 Server listening on ${value.url}`)
    })
}


bootstrap()


