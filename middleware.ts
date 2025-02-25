// middleware.ts
import { withAuth } from "next-auth/middleware"

// More info on middleware configuration options:
// https://next-auth.js.org/configuration/nextjs#middleware
export default withAuth({
  callbacks: {
    authorized({ req, token }) {
      // `/profile` requires authentication
      return !!token
    },
  },
})

export const config = {
  matcher: ["/profile"]
}