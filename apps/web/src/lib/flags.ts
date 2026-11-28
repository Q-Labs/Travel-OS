/**
 * Feature flags: build-time switches for code that is outside the MVP.
 *
 * Each flag is read from a `VITE_FLAG_<NAME>` variable and is off unless that
 * variable is exactly `true`. Components import the flag from here and never
 * read the variable themselves, which `flags.test.ts` enforces.
 *
 * Vite fixes the values when it builds, so turning a flag on means a rebuild
 * and a redeploy. Each flag is its own exported constant with the comparison
 * written out in place. Do not gather them into an object, loop over
 * `import.meta.env`, or share a helper function: the bundler then cannot see
 * that a flag is off, and the code behind it stays in the production bundle.
 *
 * Each flag names the issue that owns it. Delete a flag when its feature ships
 * or is cut.
 */

// #142: the Tweaks panel (theme, density, accents) is a prototype control until settings exist.
export const FLAG_TWEAKS = import.meta.env.VITE_FLAG_TWEAKS === 'true';

// #143: "Continue with Google" stays hidden until the provider is set up and tested.
export const FLAG_SIGNIN_GOOGLE = import.meta.env.VITE_FLAG_SIGNIN_GOOGLE === 'true';
