import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/db/models";
import { LoginSchema } from "@/lib/validation/schemas";

export const authOptions: NextAuthOptions = {
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const parsed = LoginSchema.safeParse(credentials);
                if (!parsed.success) return null;

                const { email, password } = parsed.data;

                await connectDB();
                const user = await User.findOne({ email });
                if (!user) return null;

                const isValid = await bcrypt.compare(password, user.passwordHash);
                if (!isValid) return null;

                return {
                    id: user._id.toString(),
                    email: user.email,
                    name: user.name,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
            }
            return session;
        },
    },
};
