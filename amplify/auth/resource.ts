import { defineAuth } from "@aws-amplify/backend";

export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailSubject: "【一緒にランチ行きましょう】確認コード",
      verificationEmailBody: (createCode) =>
        `ご登録ありがとうございます。\n\nあなたの確認コードは ${createCode()} です。\n\nこのコードをアプリに入力して、登録を完了してください。\n\n※このメールに心当たりがない場合は、無視してください。`,
      verificationEmailStyle: "CODE",
    },
  },
});
