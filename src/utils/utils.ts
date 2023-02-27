import * as jwt from 'jsonwebtoken'

type TokenPayload = string | jwt.JwtPayload | undefined

const getTokenPayload = (token: string): TokenPayload => {
    return jwt.verify(token, process.env.APP_SECRET_KEY as string)
}
export const getUserId = (authorizationHeader: string): TokenPayload => {
    const token = authorizationHeader.replace('Bearer ', '')
    if (!token) {
        throw new Error('Token does not exist')
    }

    const tokenPayload = getTokenPayload(token)
    if (!tokenPayload) {
        return undefined
    }

    return tokenPayload
}

/*
* User logs in, they are what is returned is an object with the current user + a JWT (payload which is the 'User' object and it is signed by a user secret)
*   * Inside of this JSON web token the payload is the 'User' object/maybe just id
* Apollo Sever Context calls function for each new request and checks if there are any headers
* If there are headers check to see if bearer authorization headers exist (should be the JWT)
* If the authorization header is a valid JWT, then call getTokenPayload which will unlock payload of token using the secret key
* Use the payload to do things such as get current user information, delete account, or change library data
* */
