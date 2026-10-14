# Setting up the ifYouMind QA account (founder guide)

About 10 minutes. You do this once. It keeps your own testing out of the founder dashboard's
customer numbers.

## 1. Create the QA Gmail account

1. In a private browser window, go to accounts.google.com and choose **Create account → For my personal use**.
2. Name it **ifYouMind QA**. Pick an address such as `ifyoumind.qa@gmail.com`. Write it down
   exactly as you typed it, including any dots.
3. Turn on 2-Step Verification. Save the password in your password manager.
4. Keep it separate: no Dose Ninja mailbox, no forwarding, no recovery address on a Dose Ninja
   account, and no payment card.

**One address per test run.** Gmail delivers `ifyoumind.qa+run1@gmail.com`,
`ifyoumind.qa+run2@gmail.com` and so on to the same inbox. Use a new `+runN` address for each
email sign-up test. For the Google sign-in test, use the plain address.

## 2. Tell ifYouMind the account is for QA

This list lives in Firebase. Only you (through the Firebase console) and the server can see or
change it. Customers and signed-in users can't.

1. Open console.firebase.google.com → project **ifyoumind-473fe** → **Firestore Database**.
2. Click **Start collection**. Collection ID: `adminConfig`.
3. Document ID: `qaExclusion`.
4. Add one field:
   - Field name: `qaMailboxes`
   - Type: **array**
   - Add one value of type **string**: your QA address, e.g. `ifyoumind.qa@gmail.com` (the plain address, no `+`).
5. Click **Save**.

That's all. Every verified `+runN` alias of that mailbox, and the mailbox itself, now stays out
of the dashboard numbers.

## 3. Check it worked

Open **ifyoumind.com/app/growth** while signed in as yourself. The box at the top should list
what was excluded and show **no warning**.

If you see a warning:

| Warning says | What to do |
| --- | --- |
| "has not been created" | Step 2 wasn't saved. Check the collection is `adminConfig` and the document is `qaExclusion`. |
| "has no usable entries" or "could not be used" | Check the field is named `qaMailboxes`, its type is **array**, and the address has no `+` and no spaces. |
| "a QA address that has not been verified" | A test account never clicked its verification email. It still counts as a customer until it does. |

## What is and isn't excluded

- **Excluded:** verified accounts on your listed QA mailbox (and its `+` aliases), and the automated test accounts.
- **Never excluded:** anyone else, including other Gmail users and customers who use their own `+` aliases. The rule only matches the mailbox you listed.
- **Nothing is deleted.** Excluded activity stays in the database. The dashboard simply doesn't count it, and shows how much it left out.

Rarely needed, and only if something slips through, you can add these array fields to the same document:

- `emails`: one exact address. Its aliases aren't included.
- `organizationIds`: a specific workspace.
- `uids`: a specific Firebase user.
