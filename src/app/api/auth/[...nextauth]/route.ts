import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        role: { label: 'Role', type: 'text' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const { email, password, role } = credentials

        if (role === 'admin') {
          // Admin login
          const admin = await prisma.admin.findUnique({
            where: { email }
          })

          if (!admin) return null

          const isValid = await bcrypt.compare(password, admin.passwordHash)
          if (!isValid) return null

          return {
            id: admin.id,
            email: admin.email,
            name: admin.name,
            role: 'admin'
          }
        } else {
          // CareHome login
          const careHome = await prisma.careHome.findUnique({
            where: { email }
          })

          if (!careHome || !careHome.isActive) return null

          const isValid = await bcrypt.compare(password, careHome.passwordHash)
          if (!isValid) return null

          return {
            id: careHome.id,
            email: careHome.email,
            name: careHome.name,
            role: 'careHome'
          }
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: { token: any, user: any }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }: { session: any, token: any }) {
      if (session.user) {
        session.user.role = token.role
        session.user.id = token.id
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/login'
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false
      }
    }
  }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
