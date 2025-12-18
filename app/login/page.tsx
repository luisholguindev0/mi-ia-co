import { login } from './actions'

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string, message?: string }>
}) {
    const params = await searchParams;
    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
            <div className="w-full max-w-sm space-y-8 rounded-lg border border-zinc-800 bg-zinc-900/50 p-8 backdrop-blur-xl">
                <div className="text-center">
                    <h1 className="text-2xl font-bold tracking-tight text-white">
                        Mi IA Colombia
                    </h1>
                    <p className="mt-2 text-sm text-zinc-400">
                        Sign in to access the control deck
                    </p>
                </div>

                <form className="space-y-6">
                    <div>
                        <label
                            htmlFor="email"
                            className="block text-xs font-medium uppercase tracking-wider text-zinc-500"
                        >
                            Email Address
                        </label>
                        <div className="mt-2">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="block w-full rounded-md border-0 bg-zinc-800/50 py-2.5 text-white shadow-sm ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="block text-xs font-medium uppercase tracking-wider text-zinc-500"
                        >
                            Password
                        </label>
                        <div className="mt-2">
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="block w-full rounded-md border-0 bg-zinc-800/50 py-2.5 text-white shadow-sm ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                            />
                        </div>
                    </div>

                    {params?.error && (
                        <div className="text-red-400 text-xs text-center border border-red-900/50 bg-red-900/20 p-2 rounded">
                            {params.error}
                        </div>
                    )}

                    <div className="flex gap-4">
                        <button
                            formAction={login}
                            className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all"
                        >
                            Log in
                        </button>
                        {/* 
            <button
              formAction={signup}
              className="flex w-full justify-center rounded-md bg-zinc-800 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600"
            >
              Sign up
            </button> 
            */}
                    </div>
                </form>
            </div>
        </div>
    )
}
