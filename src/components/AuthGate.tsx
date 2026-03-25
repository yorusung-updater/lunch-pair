"use client";

import { Authenticator } from "@aws-amplify/ui-react";
import { I18n } from "aws-amplify/utils";
import { translations } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import AppShell from "./AppShell";

I18n.putVocabularies(translations);
I18n.setLanguage("ja");

I18n.putVocabularies({
  ja: {
    "Sign In": "ログイン",
    "Sign in": "ログイン",
    "Sign Up": "新規登録",
    "Sign up": "新規登録",
    "Create Account": "アカウント作成",
    "Email": "メールアドレス",
    "Enter your Email": "メールアドレスを入力",
    "Password": "パスワード",
    "Enter your Password": "パスワードを入力",
    "Please confirm your Password": "パスワードを再入力",
    "Confirm Password": "パスワード確認",
    "Forgot your password?": "パスワードをお忘れですか？",
    "Reset Password": "パスワードをリセット",
    "Send code": "コードを送信",
    "Back to Sign In": "ログインに戻る",
    "Confirmation Code": "確認コード",
    "Enter your code": "確認コードを入力",
    "Confirm": "確認",
    "Resend Code": "コードを再送信",
    "Submit": "送信",
    "Signing in": "ログイン中...",
    "Creating Account": "アカウント作成中...",
    "Confirming": "確認中...",
    "Sending": "送信中...",
    "Your code is on the way. To log in, enter the code we emailed to":
      "確認コードを送信しました。メールに届いたコードを入力してください。送信先：",
    "It may take a minute to arrive.": "届くまで1分ほどかかる場合があります。",
    "We Emailed You": "メールを送信しました",
    "We Sent A Code": "コードを送信しました",
    "We Texted You": "SMSを送信しました",
    "Code": "コード",
    "New password": "新しいパスワード",
    "Incorrect username or password.": "メールアドレスまたはパスワードが正しくありません。",
    "User does not exist.": "このユーザーは登録されていません。",
    "User already exists": "このメールアドレスは既に登録されています。",
    "Invalid verification code provided, please try again.":
      "確認コードが正しくありません。もう一度お試しください。",
    "Password did not conform with policy: Password not long enough":
      "パスワードが短すぎます（8文字以上必要）",
    "Password must have at least 8 characters":
      "パスワードは8文字以上で入力してください",
    "Your passwords must match": "パスワードが一致しません",
    "An account with the given email already exists.":
      "このメールアドレスは既に登録されています。",
    "Username cannot be empty": "メールアドレスを入力してください",
  },
});

export default function AuthGate() {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <AppShell signOut={signOut!} user={user!} />
      )}
    </Authenticator>
  );
}
