'use server';

import {auth} from "@/lib/better-auth/auth";
import {inngest} from "@/lib/inngest/client";
import {headers} from "next/headers";

export const signUpWithEmail = async ({ email, password, fullName, country, investmentGoals, riskTolerance, preferredIndustry }: SignUpFormData) => {
    try {
        // Pass Next.js headers so BetterAuth can set cookies on the response
        const response = await auth.api.signUpEmail({ body: { email, password, name: fullName }, headers: await headers() })

        if (response) {
            try {
                await inngest.send({
                    name: 'app/user.created',
                    data: { email, name: fullName, country, investmentGoals, riskTolerance, preferredIndustry }
                })
            } catch (e) {
                // Inngest failures should not block a successful sign-up. Log and continue.
                console.warn('Warning: failed to send inngest event for user.created', e)
            }
        }

        return { success: true, data: response }
    } catch (e) {
        console.log('Sign up failed', e)
        return { success: false, error: 'Sign up failed' }
    }
}

export const signInWithEmail = async ({ email, password }: SignInFormData) => {
    try {
        // Pass Next.js headers so BetterAuth can set auth cookies on successful sign-in
        const response = await auth.api.signInEmail({ body: { email, password }, headers: await headers() })

        // BetterAuth may return an object describing an error. Check and return a structured result.
        if (!response || (typeof response === 'object' && 'error' in (response as Record<string, unknown>) && (response as Record<string, unknown>).error)) {
            console.log('Sign in response indicates failure', response)
            const resp = response as Record<string, unknown> | null;
            const errMsg = resp && typeof resp.error === 'string' ? resp.error : 'Sign in failed';
            return { success: false, error: errMsg }
        }

        return { success: true, data: response }
    } catch (e) {
        console.log('Sign in failed', e)
        return { success: false, error: 'Sign in failed' }
    }
}

export const signOut = async () => {
    try {
        await auth.api.signOut({ headers: await headers() });
    } catch (e) {
        console.log('Sign out failed', e)
        return { success: false, error: 'Sign out failed' }
    }
}