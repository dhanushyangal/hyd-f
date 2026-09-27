[Skip to content](https://github.com/shadcn-ui/ui/blob/main/apps/v4/content/docs/dark-mode/next.mdx?plain=1#start-of-content)

You signed in with another tab or window. [Reload](https://github.com/shadcn-ui/ui/blob/main/apps/v4/content/docs/dark-mode/next.mdx?plain=1) to refresh your session.You signed out in another tab or window. [Reload](https://github.com/shadcn-ui/ui/blob/main/apps/v4/content/docs/dark-mode/next.mdx?plain=1) to refresh your session.You switched accounts on another tab or window. [Reload](https://github.com/shadcn-ui/ui/blob/main/apps/v4/content/docs/dark-mode/next.mdx?plain=1) to refresh your session.Dismiss alert

{{ message }}

[shadcn-ui](https://github.com/shadcn-ui)/ **[ui](https://github.com/shadcn-ui/ui)** Public

- [Sponsor](https://github.com/sponsors/shadcn)
- [Notifications](https://github.com/login?return_to=%2Fshadcn-ui%2Fui) You must be signed in to change notification settings
- [Fork\\
10.8k](https://github.com/login?return_to=%2Fshadcn-ui%2Fui)
- [Star\\
124k](https://github.com/login?return_to=%2Fshadcn-ui%2Fui)


## Collapse file tree

## Files

main

Search this repository(forward slash)` forward slash/`

/

# next.mdx

Copy path

Blame

More file actions

Blame

More file actions

## Latest commit

[![shadcn](https://avatars.githubusercontent.com/u/124599?v=4&size=40)](https://github.com/shadcn)[shadcn](https://github.com/shadcn-ui/ui/commits?author=shadcn)

[feat: base (](https://github.com/shadcn-ui/ui/commit/f3e7de11752b087b1c4bf61f4035a866f3a4f9ed) [#11082](https://github.com/shadcn-ui/ui/pull/11082) [)](https://github.com/shadcn-ui/ui/commit/f3e7de11752b087b1c4bf61f4035a866f3a4f9ed)

Open commit detailssuccess

2 months agoJul 3, 2026

[f3e7de1](https://github.com/shadcn-ui/ui/commit/f3e7de11752b087b1c4bf61f4035a866f3a4f9ed) · 2 months agoJul 3, 2026

## History

[History](https://github.com/shadcn-ui/ui/commits/main/apps/v4/content/docs/dark-mode/next.mdx)

Open commit details

[View commit history for this file.](https://github.com/shadcn-ui/ui/commits/main/apps/v4/content/docs/dark-mode/next.mdx) History

70 lines (54 loc) · 1.43 KB

/

# next.mdx

Copy path

Top

## File metadata and controls

- Preview

- Code

- Blame


70 lines (54 loc) · 1.43 KB

[Raw](https://github.com/shadcn-ui/ui/raw/refs/heads/main/apps/v4/content/docs/dark-mode/next.mdx)

Copy raw file

Download raw file

You must be signed in to make or propose changes

More edit options

Open symbols panel

Edit and raw actions

1

2

3

4

5

6

7

8

9

10

11

12

13

14

15

16

17

18

19

20

21

22

23

24

25

26

27

28

29

30

31

32

33

34

35

36

37

38

39

40

41

42

43

44

45

46

47

48

49

50

51

52

53

54

55

56

57

58

59

60

61

62

63

64

65

66

67

68

69

70

\-\-\-

title: Next.js

description: Adding dark mode to your Next.js app.

\-\-\-

<Steps>

\## Install next-themes

Start by installing \`next-themes\`:

\`\`\`bash

npm install next-themes

\`\`\`

\## Create a theme provider

\`\`\`tsx title="components/theme-provider.tsx" showLineNumbers

"use client"

import\*asReactfrom"react"

import { ThemeProviderasNextThemesProvider } from"next-themes"

exportfunction ThemeProvider({

children,

...props

}:React.ComponentProps<typeofNextThemesProvider>) {

return <NextThemesProvider{...props}>{children}</NextThemesProvider>

}

\`\`\`

\## Wrap your root layout

Add the \`ThemeProvider\` to your root layout and add the \`suppressHydrationWarning\` prop to the \`html\` tag.

\`\`\`tsx {1,6,9-14,16} title="app/layout.tsx" showLineNumbers

import { ThemeProvider } from"@/components/theme-provider"

exportdefaultfunction RootLayout({ children }:RootLayoutProps) {

return (

<>

<htmllang="en"suppressHydrationWarning>

<head />

<body>

<ThemeProvider

attribute="class"

defaultTheme="system"

enableSystem

disableTransitionOnChange

>

{children}

</ThemeProvider>

</body>

</html>

</>

)

}

\`\`\`

\## Add a mode toggle

Place a mode toggle on your site to toggle between light and dark mode.

<ComponentPreview

styleName="new-york-v4"

name="mode-toggle"

className="\[&\_.preview\]:items-start"

/>

</Steps>

You can’t perform that action at this time.