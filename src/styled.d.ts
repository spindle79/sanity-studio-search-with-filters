/**
 * Module augmentation: tell styled-components that whatever `<ThemeProvider>`
 * passes down (in our case the @sanity/ui studio theme) has the
 * `theme.sanity.*` shape Sanity's components rely on.
 *
 * This lets us write `theme.sanity.color.card.disabled.bg2` inside styled
 * blocks without inline casts. Pulled from `@sanity/ui`'s `Theme` type so it
 * stays in sync with whichever version of @sanity/ui consumers install.
 *
 * See: https://styled-components.com/docs/api#typescript
 */
import type {Theme as SanityTheme} from '@sanity/ui'

declare module 'styled-components' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface DefaultTheme extends SanityTheme {}
}
