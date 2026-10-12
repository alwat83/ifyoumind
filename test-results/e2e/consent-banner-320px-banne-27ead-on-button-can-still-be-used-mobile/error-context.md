# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - main [ref=e4]:
      - link "ifYouMind" [ref=e5] [cursor=pointer]:
        - /url: /
      - generic [ref=e6]:
        - paragraph [ref=e7]: Welcome back
        - heading "Pick up where you left off." [level=1] [ref=e8]
        - paragraph [ref=e9]: Your saved decisions and reports are waiting.
        - generic [ref=e10]:
          - generic [ref=e11]:
            - generic [ref=e12]: Email
            - textbox "Email" [ref=e13]: f03-free-empty.mv5qas89b12db6@qa.ifyoumind.test
          - generic [ref=e14]:
            - generic [ref=e15]: Password
            - textbox "Password" [active] [ref=e16]: Qa-fixture-password-1
          - button "Sign in" [ref=e17] [cursor=pointer]
        - generic [ref=e19]: or
        - button "Continue with Google" [ref=e20] [cursor=pointer]
        - paragraph [ref=e21]:
          - text: New here?
          - link "Create a free account" [ref=e22] [cursor=pointer]:
            - /url: /register
    - region "Cookie choice" [ref=e23]:
      - generic [ref=e24]:
        - paragraph [ref=e25]:
          - text: We'd like to use Google Analytics cookies to see how visitors use ifYouMind. Google Analytics only runs if you allow it.
          - link "Privacy Policy" [ref=e26] [cursor=pointer]:
            - /url: /privacy-policy
        - generic [ref=e27]:
          - button "Allow analytics" [ref=e28] [cursor=pointer]
          - button "Reject" [ref=e29] [cursor=pointer]
          - button "Manage" [ref=e30] [cursor=pointer]
  - paragraph [ref=e31]: Running in emulator mode. Do not use with production credentials.
```