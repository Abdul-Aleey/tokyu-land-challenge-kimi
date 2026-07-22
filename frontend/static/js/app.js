/* Sakura Deeptech Shibuya — Member Console frontend controller.
   Vanilla JS, no build step. Talks to the FastAPI backend under /api. */

const I18N = {
  en: {
    brandTitle: "Sakura Deeptech Shibuya",
    brandSubtitle: "Member Status Console",
    kpiTotal: "Total Members",
    kpiActive: "Active Contracts",
    kpiRenewals: "Renewals Due (30d)",
    kpiOverdue: "Late Payments",
    kpiMissing: "Invoices Not Sent",
    insightLoading: "Reading today's portfolio…",
    insightUnavailable: "AI insight unavailable right now — showing computed stats instead.",
    radarTitle: "AI Risk Radar",
    radarSub: "Companies needing attention first",
    radarEmpty: "No companies currently at risk — portfolio is healthy.",
    searchPlaceholder: "Search company, industry, contact…",
    askAi: "Ask AI",
    askAiBadge: "AI-Powered Search",
    resetFilters: "Reset",
    exportCsv: "Export CSV",
    rowsPerPage: "Rows per page", pagerPrev: "Prev", pagerNext: "Next",
    askAiPlaceholder: "e.g. who has a late payment and renews this month?",
    askAiSubmit: "Ask",
    askAiModeSingle: "Single Question", askAiModeSession: "Session", askAiNewSession: "New Session",
    colCompany: "Company", colIndustry: "Industry", colContract: "Contract",
    colRenewal: "Renewal Date", colPayment: "Payment", colPaymentDue: "Payment Date", colInvoice: "Invoice Request", colRisk: "Risk",
    noResults: "No member companies match your search.",
    noResultsTypo: "No exact match for that search.",
    didYouMean: "Did you mean:",
    analyticsTitle: "Portfolio Analytics",
    analyticsSub: "Breakdown across all member companies",
    chartContract: "Contract Status", chartPayment: "Payment Status",
    chartInvoice: "Invoice Requests", chartRenewals: "Upcoming Renewals by Month",
    footerNote: "Built for the Tokyo Land / Tokyu Fudosan Enterprise Challenge — local demo only.",
    filterAllContract: "All contract statuses",
    filterAllPayment: "All payment statuses",
    filterAllInvoice: "All invoice statuses",
    statusActive: "Active", statusExpired: "Expired",
    statusPaid: "Paid", statusNotPaid: "Not Paid", statusLatePayment: "Late Payment",
    statusSent: "Sent", statusNotSent: "Not Sent",
    riskCritical: "Critical", riskHigh: "High", riskMedium: "Medium", riskLow: "Low", riskNone: "—",
    drawerContact: "Contact", drawerPlan: "Plan", drawerFee: "Monthly Fee",
    drawerStarted: "Member Since", drawerLastPayment: "Last Payment", drawerNotes: "Ops Notes",
    drawerEmail: "Email", drawerPhone: "Phone", drawerInvoiceSent: "Invoice Sent",
    drawerPaymentDue: "Payment Due", formPaymentDue: "Next payment due date",
    aiCallScript: "Suggested call script", aiRecommended: "Recommended action",
    copy: "Copy", copied: "Copied!",
    emailSectionTitle: "Email (demo)", sendEmail: "Send Email",
    emailSentTo: "Email sent to", emailSentNoAddress: "Email sent (no address on file)",
    sendInvoice: "Send Invoice", invoiceSent: "Invoice marked as sent",
    statusEditorTitle: "Update status", save: "Save changes", saved: "Status updated",
    timelineTitle: "Activity timeline",
    modifyRecord: "Modify record", deleteRecord: "Delete record", deleted: "Record deleted",
    addRecord: "Add Record", recordSaved: "Record saved",
    formName: "Company name", formNameKana: "Japanese reading (name_kana)", formIndustry: "Industry",
    formPlan: "Membership plan", formContactPerson: "Contact person", formContactEmail: "Contact email",
    formContactPhone: "Contact phone", formContractStatus: "Contract status",
    formContractStart: "Contract start date", formRenewalDate: "Renewal date",
    formPaymentStatus: "Payment status", formInvoiceStatus: "Invoice request status",
    formFee: "Monthly fee (JPY)", formNotes: "Ops notes", formCancel: "Cancel", formSave: "Save record",
    loadingBrief: "Generating call script…",
    aiSourceAi: "AI", aiSourceFallback: "RULE-BASED",
    eventStart: "Membership agreement signed and onboarded",
    eventRenewed: "Contract renewed for another term",
    eventPayment: "Monthly invoice paid in full",
    eventInvoiceSent: "Invoice issued to member company",
    eventInvoiceRequested: "Member company requested a new invoice",
    eventReminder: "Renewal reminder sent to primary contact",
    eventOverdueNotice: "Late payment notice sent",
    eventStatusUpdate: "Status manually updated by operations staff",
    eventEmailSent: "Email sent to member company",
    legendDueSoon: "Due this month",
    legendDueMid: "Due in 2–3 months",
    legendDueLater: "Later",
    fetchError: "Could not reach the server. Is the backend running?",
    briefLoadingSteps: [
      "Reviewing contract & renewal details…",
      "Checking payment and invoice status…",
      "Drafting a call script for staff…",
      "Almost ready…",
    ],
    insightLoadingSteps: [
      "Scanning all member companies…",
      "Identifying renewal and payment risks…",
      "Prioritizing today's actions…",
      "Finalizing the portfolio insight…",
    ],
    askAiLoadingSteps: [
      "Interpreting your question…",
      "Matching it to contract, payment & invoice filters…",
      "Almost there…",
    ],
    segmentTitle: "Segmentation",
    segmentSub: "Risk by membership plan and industry",
    byPlanTitle: "By Membership Plan",
    byIndustryTitle: "By Industry",
    colIndustryName: "Industry",
    colTotalShort: "Total",
    colAtRiskShort: "At Risk",
    colOverdueShort: "Late",
    colMissingShort: "Not Sent",
    atRiskLabel: "At risk",
    activeLabel: "Active",
    segmentInsightLoadingSteps: [
      "Grouping companies by plan and industry…",
      "Finding the biggest gaps…",
      "Finalizing the insight…",
    ],
    modelChecking: "Checking model…",
    modelConnected: "Model Connected",
    modelFallback: "Fallback Mode",
    modelDemoMode: "Demo Mode",
  },
  ja: {
    brandTitle: "サクラ ディープテック 渋谷",
    brandSubtitle: "会員ステータス コンソール",
    kpiTotal: "会員企業数",
    kpiActive: "有効契約数",
    kpiRenewals: "30日以内の更新",
    kpiOverdue: "支払い遅延",
    kpiMissing: "請求書未送付",
    insightLoading: "本日のポートフォリオを確認中…",
    insightUnavailable: "AIインサイトは現在利用できません。計算済みの統計を表示しています。",
    radarTitle: "AIリスクレーダー",
    radarSub: "優先的に対応が必要な企業",
    radarEmpty: "現在リスクのある企業はありません。ポートフォリオは健全です。",
    searchPlaceholder: "会社名・業種・担当者で検索…",
    askAi: "AIに質問",
    askAiBadge: "AI検索",
    resetFilters: "リセット",
    exportCsv: "CSV出力",
    rowsPerPage: "表示件数", pagerPrev: "前へ", pagerNext: "次へ",
    askAiPlaceholder: "例：支払いが遅延していて今月更新の会社は？",
    askAiSubmit: "質問する",
    askAiModeSingle: "単発質問", askAiModeSession: "セッション", askAiNewSession: "新しいセッション",
    colCompany: "会社名", colIndustry: "業種", colContract: "契約状況",
    colRenewal: "更新日", colPayment: "支払状況", colPaymentDue: "支払日", colInvoice: "請求書対応", colRisk: "リスク",
    noResults: "該当する会員企業がありません。",
    noResultsTypo: "完全に一致する結果は見つかりませんでした。",
    didYouMean: "もしかして:",
    analyticsTitle: "ポートフォリオ分析",
    analyticsSub: "全会員企業の内訳",
    chartContract: "契約状況", chartPayment: "支払状況",
    chartInvoice: "請求書対応状況", chartRenewals: "月別 今後の更新予定",
    footerNote: "Tokyo Land / Tokyu Fudosan Enterprise Challenge 向けローカルデモです。",
    filterAllContract: "すべての契約状況",
    filterAllPayment: "すべての支払状況",
    filterAllInvoice: "すべての請求書対応状況",
    statusActive: "有効", statusExpired: "契約終了",
    statusPaid: "支払済み", statusNotPaid: "未払い", statusLatePayment: "支払遅延",
    statusSent: "送付済み", statusNotSent: "未送付",
    riskCritical: "重大", riskHigh: "高", riskMedium: "中", riskLow: "低", riskNone: "—",
    drawerContact: "担当者", drawerPlan: "プラン", drawerFee: "月額料金",
    drawerStarted: "契約開始日", drawerLastPayment: "直近の支払い", drawerNotes: "運営メモ",
    drawerEmail: "メールアドレス", drawerPhone: "電話番号", drawerInvoiceSent: "請求書送付日",
    drawerPaymentDue: "次回支払期日", formPaymentDue: "次回支払期日",
    aiCallScript: "応答スクリプト案", aiRecommended: "推奨アクション",
    copy: "コピー", copied: "コピーしました",
    emailSectionTitle: "メール（デモ）", sendEmail: "メール送信",
    emailSentTo: "メールを送信しました：", emailSentNoAddress: "メールを送信しました（登録アドレスなし）",
    sendInvoice: "請求書送付", invoiceSent: "請求書を送付済みにしました",
    statusEditorTitle: "ステータス更新", save: "保存する", saved: "ステータスを更新しました",
    timelineTitle: "アクティビティ履歴",
    modifyRecord: "編集する", deleteRecord: "削除する", deleted: "レコードを削除しました",
    addRecord: "新規登録", recordSaved: "レコードを保存しました",
    formName: "会社名", formNameKana: "ふりがな（name_kana）", formIndustry: "業種",
    formPlan: "プラン", formContactPerson: "担当者名", formContactEmail: "担当者メール",
    formContactPhone: "担当者電話番号", formContractStatus: "契約ステータス",
    formContractStart: "契約開始日", formRenewalDate: "更新日",
    formPaymentStatus: "支払ステータス", formInvoiceStatus: "請求書ステータス",
    formFee: "月額料金（円）", formNotes: "運営メモ", formCancel: "キャンセル", formSave: "保存する",
    loadingBrief: "応答スクリプトを生成中…",
    aiSourceAi: "AI", aiSourceFallback: "ルールベース",
    eventStart: "入会契約締結・オンボーディング完了",
    eventRenewed: "契約が更新されました",
    eventPayment: "月額請求のお支払いが完了しました",
    eventInvoiceSent: "会員企業へ請求書を発行しました",
    eventInvoiceRequested: "会員企業より請求書の発行依頼がありました",
    eventReminder: "担当者へ更新リマインダーを送付しました",
    eventOverdueNotice: "支払い遅延の通知を送付しました",
    eventStatusUpdate: "運営スタッフがステータスを手動更新しました",
    eventEmailSent: "会員企業へメールを送信しました",
    legendDueSoon: "今月中",
    legendDueMid: "2〜3ヶ月以内",
    legendDueLater: "それ以降",
    fetchError: "サーバーに接続できません。バックエンドが起動しているか確認してください。",
    briefLoadingSteps: [
      "契約内容と更新日を確認中…",
      "支払い・請求書の状況を確認中…",
      "応答スクリプトを作成中…",
      "もうすぐ完了します…",
    ],
    insightLoadingSteps: [
      "全会員企業をスキャン中…",
      "更新・支払いのリスクを確認中…",
      "本日の優先事項を整理中…",
      "インサイトを作成中…",
    ],
    askAiLoadingSteps: [
      "ご質問を解析中…",
      "契約・支払い・請求条件に変換中…",
      "もうすぐ完了します…",
    ],
    segmentTitle: "セグメント分析",
    segmentSub: "プラン・業種別のリスク",
    byPlanTitle: "プラン別",
    byIndustryTitle: "業種別",
    colIndustryName: "業種",
    colTotalShort: "件数",
    colAtRiskShort: "要注意",
    colOverdueShort: "支払遅延",
    colMissingShort: "請求書未送付",
    atRiskLabel: "要注意",
    activeLabel: "有効",
    segmentInsightLoadingSteps: [
      "プラン・業種ごとに集計中…",
      "主な課題を抽出中…",
      "インサイトを作成中…",
    ],
    modelChecking: "モデル確認中…",
    modelConnected: "モデル接続中",
    modelFallback: "フォールバックモード",
    modelDemoMode: "デモモード",
  },
};

const HELP_GUIDE = {
  en: {
    title: "How to use this dashboard",
    sections: [
      {
        h: "What this is",
        p: ["The Sakura Deeptech Shibuya member status console. It lets staff look up any member company's contract, payment, and invoice status in seconds, and manage that data day to day."],
        items: [],
      },
      {
        h: "Search & filter",
        p: [],
        items: [
          "Type in the search box to match company name, industry, or contact person.",
          "Use the contract, payment, or invoice dropdowns to narrow the table to one status.",
          "A \"Reset\" button appears whenever a search, filter, or Ask AI question is active. One click clears everything.",
        ],
      },
      {
        h: "Ask AI",
        p: [
          "Type a question in plain language and click Ask. It answers directly, in whichever language you're using, and when relevant also filters the table to the companies it's talking about. For example, \"which company is at highest risk?\" or \"how many companies have a late payment?\". You can also ask it about the dashboard itself, e.g. \"how do I add a company?\" or \"what does Late Payment mean?\".",
          "Choose \"Single Question\" for a one-off lookup, or switch to \"Session\" to ask follow-up questions with memory of what you already asked (e.g. \"and which of those renews soonest?\"). Click \"New Session\" any time to start a fresh conversation.",
        ],
        items: [],
      },
      {
        h: "AI Risk Radar",
        p: ["A scrollable strip of the companies needing attention first, ranked by risk, showing their payment status and payment due date, so you see priorities before you even search."],
        items: [],
      },
      {
        h: "Company details",
        p: ["Click any row to open its full details, including contact email, phone, invoice sent date, payment due date, and last payment date. These only appear here, not in the list, and last payment date only shows once the company has actually been paid."],
        items: [],
      },
      {
        h: "Payment & invoice rules",
        p: [],
        items: [
          "Contract status is Active or Expired. Payment status is Paid or Not Paid, and invoice request status is Sent or Not Sent. That's what the table and drawer show.",
          "A company can never be marked Paid until its invoice has been marked Sent.",
          "Every company has a recurring monthly payment due date, separate from its contract renewal date. \"Late Payment\" is never set by hand: it appears automatically once a company is unpaid past that due date, shown as the Payment badge turning red and the Risk column showing Critical.",
          "Risk level follows payment timing, and only applies once an invoice has actually been Sent: Critical (unpaid, past due date), High (unpaid, due today), Low (unpaid, due within a week), otherwise no risk. An unpaid company whose invoice hasn't been sent yet is never flagged as risk, since there's no issued invoice to be late on.",
          "Marking a company Paid automatically rolls its payment due date forward one month.",
        ],
      },
      {
        h: "Update, add, modify, delete",
        p: [],
        items: [
          "Inside a company's details, use \"Update status\" for a quick contract, payment, or invoice change.",
          "\"Modify record\" opens the full edit form for every field on that company, including its payment due date.",
          "\"Add Record\" above the table creates a brand new company.",
          "\"Delete record\" permanently removes a company and its activity history.",
          "Every change is logged to that company's activity timeline.",
        ],
      },
      {
        h: "Email (demo) & Send Invoice",
        p: [
          "Inside a company's details, the Email box is pre-filled with an AI-drafted email (greeting, status update, and a closing signature) and can be edited freely. \"Send Email\" is a showcase action only, no real email is sent, but it logs the send to the activity timeline.",
          "When invoice status is Not Sent, a \"Send Invoice\" button appears next to the status badges. Unlike Send Email, this is a real action: it marks the invoice Sent and sets its sent date.",
        ],
        items: [],
      },
      {
        h: "Table, sorting & pagination",
        p: ["Click any column header to sort by it (click again to reverse the direction, shown by the arrow). Choose 10, 25, or 50 rows per page and use Prev/Next to page through the list. \"Export CSV\" downloads exactly what's currently shown, with search and filters applied, and Japanese characters export correctly for Excel."],
        items: [],
      },
      {
        h: "Analytics & segmentation",
        p: ["Below the table, Portfolio Analytics breaks down contract, payment, and invoice status plus upcoming renewals by month. Segmentation shows the same risk picture grouped by membership plan and industry. The 5 summary tiles at the top, every chart segment, each membership plan card, and each industry row are all clickable: they open a popup listing exactly which companies make up that number."],
        items: [],
      },
      {
        h: "Language, theme & AI status",
        p: ["Toggle EN/日本語 and light/dark from the top bar. The badge next to the clock shows whether AI answers are live (\"Model Connected\", with the model name) or using the rule-based fallback (\"Fallback Mode\" or \"Demo Mode\")."],
        items: [],
      },
    ],
  },
  ja: {
    title: "このダッシュボードの使い方",
    sections: [
      {
        h: "概要",
        p: ["サクラ ディープテック渋谷の会員ステータス管理画面です。会員企業の契約、支払い、請求書ステータスをすぐに確認し、日々のデータ管理も行えます。"],
        items: [],
      },
      {
        h: "検索・フィルター",
        p: [],
        items: [
          "検索欄に入力すると、会社名、業種、担当者名で絞り込めます。",
          "契約、支払、請求書のドロップダウンで、特定のステータスに絞り込めます。",
          "検索やフィルター、AI検索が使われているときは「リセット」ボタンが表示され、ワンクリックで全て解除できます。",
        ],
      },
      {
        h: "AI検索",
        p: [
          "自然な文章で質問を入力して「質問する」を押すと、その場で直接回答します（表示言語で回答）。関連する会社があれば、表の絞り込みも自動で行われます。例：「最もリスクが高い会社は？」「支払いが遅延している会社は何社？」など。「新しい会社の登録方法は？」「支払遅延とは？」のような、ダッシュボード自体についての質問にも答えられます。",
          "1回限りの質問には「単発質問」を、直前のやり取りを踏まえて続けて質問したい場合は「セッション」を選んでください（例：「その中で一番早く更新を迎えるのは？」）。「新しいセッション」でいつでも会話をリセットできます。",
        ],
        items: [],
      },
      {
        h: "AIリスクレーダー",
        p: ["優先的に対応が必要な企業を、支払状況と支払期日とともにリスク順に並べた一覧です。検索する前に、まず確認すべき企業がひと目でわかります。"],
        items: [],
      },
      {
        h: "会社詳細",
        p: ["行をクリックすると詳細が開き、担当者メール、電話番号、請求書送付日、次回支払期日、直近の支払日が表示されます。これらは詳細画面でのみ表示され、直近の支払日は実際に支払いが完了している場合のみ表示されます。"],
        items: [],
      },
      {
        h: "支払い・請求書のルール",
        p: [],
        items: [
          "契約状況は「有効」または「契約終了」、支払状況は「支払済み」または「未払い」、請求書対応は「送付済み」または「未送付」です。表と詳細画面にはこれらのみが表示されます。",
          "請求書が「送付済み」になるまで、支払いステータスを「支払済み」にすることはできません。",
          "会員企業ごとに、契約更新日とは別に、毎月の支払期日があります。「支払遅延」は手動設定ではなく、未払いのままこの期日を過ぎると自動的に表示され、支払バッジが赤くなり、リスク欄が「重大」になります。",
          "リスクレベルは支払いのタイミングで決まり、請求書が実際に「送付済み」の場合のみ適用されます。重大（未払いで期日超過）、高（未払いで本日が期日）、低（未払いで期日まで1週間以内）、それ以外はリスクなしです。請求書が未送付の会社は、どれだけ期日を過ぎていてもリスクとして表示されません。",
          "支払済みにすると、次回の支払期日は自動的に1か月先に更新されます。",
        ],
      },
      {
        h: "更新・新規登録・編集・削除",
        p: [],
        items: [
          "詳細画面の「ステータス更新」で、契約、支払、請求書のステータスをすばやく変更できます。",
          "「編集する」では、支払期日を含む、その会社のすべての項目を編集できます。",
          "表の上にある「新規登録」で新しい会社を登録できます。",
          "「削除する」で会社とその活動履歴を完全に削除します。",
          "変更内容はすべてその会社のアクティビティ履歴に記録されます。",
        ],
      },
      {
        h: "メール（デモ）と請求書送付",
        p: [
          "詳細画面のメール欄には、挨拶・状況説明・結びの署名を含むAI作成のメール案があらかじめ入力されており、自由に編集できます。「メール送信」はあくまでデモ用の操作で、実際にメールは送信されませんが、アクティビティ履歴には送信記録として残ります。",
          "請求書対応が「未送付」の場合、ステータスバッジの隣に「請求書送付」ボタンが表示されます。メール送信とは異なり、こちらは実際の操作です。請求書対応を「送付済み」にし、送付日を記録します。",
        ],
        items: [],
      },
      {
        h: "表、並べ替え、ページ表示",
        p: ["列見出しをクリックすると、その列で並べ替えられます（もう一度クリックすると昇順・降順が切り替わり、矢印で表示されます）。表示件数は10、25、50件から選べ、「前へ」「次へ」でページを送れます。「CSV出力」は現在表示中の内容（検索・フィルター適用後）をそのまま出力し、日本語もExcelで正しく表示されます。"],
        items: [],
      },
      {
        h: "分析・セグメント",
        p: ["表の下にある「ポートフォリオ分析」では契約、支払、請求書ステータスの内訳と月別更新予定を、「セグメント分析」ではプラン別、業種別の同じリスク傾向を確認できます。上部の5つのサマリータイル、各グラフのセグメント、プランごとのカード、業種ごとの行はすべてクリックでき、該当する会社の一覧をポップアップで表示します。"],
        items: [],
      },
      {
        h: "言語・テーマ・AI接続状況",
        p: ["上部バーでEN/日本語と、ライト/ダークテーマを切り替えられます。時計の隣のバッジは、AIの回答がリアルタイムか（「モデル接続中」、モデル名も表示）、ルールベースのフォールバックか（「フォールバックモード」「デモモード」）を示します。"],
        items: [],
      },
    ],
  },
};

const CONTRACT_KEYS = { "Active": "statusActive", "Expired": "statusExpired" };
const PAYMENT_KEYS = { "Paid": "statusPaid", "Not Paid": "statusNotPaid", "Late Payment": "statusLatePayment" };
const INVOICE_KEYS = { "Sent": "statusSent", "Not Sent": "statusNotSent" };
const RISK_KEYS = { "Critical": "riskCritical", "High": "riskHigh", "Medium": "riskMedium", "Low": "riskLow", "None": "riskNone" };

const CONTRACT_BADGE = { "Active": "good", "Expired": "serious" };
const PAYMENT_BADGE = { "Paid": "good", "Not Paid": "warning" };
const INVOICE_BADGE = { "Sent": "good", "Not Sent": "serious" };
const RISK_BADGE = { "Critical": "critical", "High": "serious", "Medium": "warning", "Low": "good", "None": "neutral" };

// "Not Paid" is normally just a warning amber, but if the underlying risk is
// Critical (unpaid, invoice Sent, past the renewal date) it renders red like
// the rest of the app's critical-severity signals -- without reintroducing
// "Late Payment" as a separately displayed status value.
function paymentBadgeLevel(c) {
  if (c.payment_status === "Not Paid" && c.risk && c.risk.level === "Critical") return "critical";
  return PAYMENT_BADGE[c.payment_status] || "neutral";
}

// Once a company has paid, the relevant date is when they paid (a few days
// either side of when it was due) -- showing the far-off next cycle's due
// date next to a "Paid" badge reads as a contradiction. Only an unpaid
// company's next_payment_due (the date driving its risk) belongs here.
function paymentDateValue(c) {
  return c.payment_status === "Paid" ? c.last_payment_date : c.next_payment_due;
}

// Payment/invoice selects in the Add/Modify form only ever offer the raw
// ground-truth values staff can set -- "Late Payment" is always computed.
const PAYMENT_WRITE_KEYS = { "Paid": "statusPaid", "Not Paid": "statusNotPaid" };
const INVOICE_WRITE_KEYS = { "Sent": "statusSent", "Not Sent": "statusNotSent" };

const EVENT_KEYS = {
  start: "eventStart", renewed: "eventRenewed", payment: "eventPayment",
  invoice_sent: "eventInvoiceSent", invoice_requested: "eventInvoiceRequested",
  reminder: "eventReminder", overdue_notice: "eventOverdueNotice", status_update: "eventStatusUpdate",
  email_sent: "eventEmailSent",
};

const state = {
  lang: localStorage.getItem("sds_lang") || "en",
  theme: localStorage.getItem("sds_theme") || "light",
  filters: { search: "", contract_status: "", payment_status: "", invoice_status: "" },
  pagination: { page: 1, pageSize: 25 },
  sort: { key: null, dir: "asc" },
  summary: null,
  renewalsByMonth: null,
  insightCache: {},
  segmentInsightCache: {},
  segmentation: null,
  companies: [],
  drawerCompanyId: null,
  modelStatus: null,
  askAiMode: "single",
  askAiHistory: [],
};

function t(key) {
  return (I18N[state.lang] && I18N[state.lang][key]) || I18N.en[key] || key;
}

function tArr(key) {
  return (I18N[state.lang] && I18N[state.lang][key]) || I18N.en[key] || [];
}

/* ---------------------------- animated AI loader ---------------------------- */
/* Cycles through a list of status sentences with a spinner so an AI call
   always shows visible progress instead of a static "loading…" label. */
function createLoader(messagesKey) {
  const messages = tArr(messagesKey);
  const wrap = document.createElement("div");
  wrap.className = "loading-row";
  const spinner = document.createElement("span");
  spinner.className = "loader-spin";
  const text = document.createElement("span");
  text.className = "loading-text";
  text.textContent = messages[0] || "";
  wrap.appendChild(spinner);
  wrap.appendChild(text);

  let idx = 0;
  const interval = setInterval(() => {
    idx = (idx + 1) % messages.length;
    text.style.opacity = "0";
    setTimeout(() => {
      text.textContent = messages[idx];
      text.style.opacity = "1";
    }, 250);
  }, 2200);

  wrap.stopLoader = () => clearInterval(interval);
  return wrap;
}

const activeLoaders = { brief: null, insight: null, askAi: null, segment: null };
function stopLoader(name) {
  if (activeLoaders[name]) {
    activeLoaders[name].stopLoader();
    activeLoaders[name] = null;
  }
}

/* ---------------------------- fetch helper ---------------------------- */
async function api(path, opts = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) {
    let detail = "";
    try { detail = (await res.json()).detail || ""; } catch (e) { /* no JSON body */ }
    const err = new Error(detail || `API ${path} -> ${res.status}`);
    err.detail = detail;
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

/* ---------------------------- toast ---------------------------- */
let toastTimer;
function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2800);
}

/* ---------------------------- formatting ---------------------------- */
const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTHS_EN_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function isoDatePlusDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatDate(iso, lang) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  if (lang === "ja") return `${y}年${m}月${d}日`;
  return `${MONTHS_EN[m - 1]} ${d}, ${y}`;
}

function monthLabel(yyyymm, lang) {
  const [y, m] = yyyymm.split("-").map(Number);
  const shortYear = String(y).slice(-2);
  if (lang === "ja") return `${shortYear}年${m}月`;
  return `${MONTHS_EN_SHORT[m - 1]} '${shortYear}`;
}

function translateReason(reason, lang) {
  if (lang !== "ja") return reason;
  const table = {
    "Payment is late": "支払いが遅延しています",
    "Payment due today, not yet received": "本日が支払期日ですが、まだ入金が確認できていません",
  };
  if (table[reason]) return table[reason];
  let m = reason.match(/Payment due in (\d+) day\(s\)/);
  if (m) return `支払期日まで残り${m[1]}日、まだ入金が確認できていません`;
  return reason;
}

function statusLabel(keyMap, value) {
  return t(keyMap[value] || value);
}

/* ---------------------------- i18n DOM application ---------------------------- */
function applyStaticI18n() {
  document.documentElement.lang = state.lang;
  document.querySelectorAll("[data-i18n]").forEach((elm) => {
    elm.textContent = t(elm.getAttribute("data-i18n"));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((elm) => {
    elm.setAttribute("placeholder", t(elm.getAttribute("data-i18n-placeholder")));
  });
  document.getElementById("langToggle").setAttribute("data-active", state.lang);
  populateFilterSelects();
}

function populateFilterSelects() {
  const build = (selectEl, allKey, keyMap) => {
    const prev = selectEl.value;
    selectEl.innerHTML = "";
    const allOpt = document.createElement("option");
    allOpt.value = "";
    allOpt.textContent = t(allKey);
    selectEl.appendChild(allOpt);
    Object.keys(keyMap).forEach((val) => {
      const opt = document.createElement("option");
      opt.value = val;
      opt.textContent = t(keyMap[val]);
      selectEl.appendChild(opt);
    });
    selectEl.value = prev;
  };
  build(document.getElementById("filterContract"), "filterAllContract", CONTRACT_KEYS);
  build(document.getElementById("filterPayment"), "filterAllPayment", PAYMENT_KEYS);
  build(document.getElementById("filterInvoice"), "filterAllInvoice", INVOICE_KEYS);

  const buildPlain = (selectEl, keyMap) => {
    const prev = selectEl.value;
    selectEl.innerHTML = "";
    Object.keys(keyMap).forEach((val) => {
      const opt = document.createElement("option");
      opt.value = val;
      opt.textContent = t(keyMap[val]);
      selectEl.appendChild(opt);
    });
    if (prev) selectEl.value = prev;
  };
  buildPlain(document.getElementById("fContractStatus"), CONTRACT_KEYS);
  buildPlain(document.getElementById("fPaymentStatus"), PAYMENT_WRITE_KEYS);
  buildPlain(document.getElementById("fInvoiceStatus"), INVOICE_WRITE_KEYS);
}

/* ---------------------------- badges ---------------------------- */
function badge(labelText, level) {
  const span = document.createElement("span");
  span.className = `badge badge-${level}`;
  const dot = document.createElement("span");
  dot.className = "dot";
  span.appendChild(dot);
  const txt = document.createElement("span");
  txt.textContent = labelText;
  span.appendChild(txt);
  return span;
}

/* ---------------------------- KPIs ---------------------------- */
function renderKPIs(summary) {
  const map = {
    kpiTotal: summary.total_companies,
    kpiActive: summary.active_contracts,
    kpiRenewals: summary.renewals_due_30d,
    kpiOverdue: summary.payments_late,
    kpiMissing: summary.invoices_not_sent,
  };
  for (const id in map) {
    const elm = document.getElementById(id);
    elm.textContent = map[id];
    elm.classList.remove("animate");
    void elm.offsetWidth;
    elm.classList.add("animate");
  }
}

/* ---------------------------- radar ---------------------------- */
function renderRadar(items) {
  const track = document.getElementById("radarTrack");
  track.innerHTML = "";
  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "radar-empty";
    empty.textContent = t("radarEmpty");
    track.appendChild(empty);
    return;
  }
  items.forEach((c) => {
    const card = document.createElement("div");
    card.className = "radar-card";
    card.addEventListener("click", () => openDrawer(c.id));

    const level = document.createElement("span");
    level.className = `radar-level level-${RISK_BADGE[c.risk.level] || "neutral"}`;
    level.textContent = statusLabel(RISK_KEYS, c.risk.level);
    card.appendChild(level);

    const name = document.createElement("div");
    name.className = "radar-name";
    name.textContent = c.name;
    card.appendChild(name);

    const industry = document.createElement("div");
    industry.className = "radar-industry";
    industry.textContent = c.industry;
    card.appendChild(industry);

    const meta = document.createElement("div");
    meta.className = "radar-meta";
    meta.appendChild(badge(statusLabel(PAYMENT_KEYS, c.payment_status), paymentBadgeLevel(c)));
    const dueDate = document.createElement("span");
    dueDate.className = "radar-renewal";
    dueDate.textContent = `${t("drawerPaymentDue")}: ${formatDate(c.next_payment_due, state.lang)}`;
    meta.appendChild(dueDate);
    card.appendChild(meta);

    c.risk.reasons.slice(0, 2).forEach((r) => {
      const reason = document.createElement("div");
      reason.className = "radar-reason";
      reason.style.color = `var(--status-${RISK_BADGE[c.risk.level] === "critical" ? "critical" : "warning"})`;
      reason.textContent = translateReason(r, state.lang);
      card.appendChild(reason);
    });

    track.appendChild(card);
  });
}

/* ---------------------------- table ---------------------------- */
function buildCompanyRow(c, onClick) {
  const tr = document.createElement("tr");
  tr.addEventListener("click", onClick);

  const tdName = document.createElement("td");
  tdName.className = "cell-name";
  tdName.textContent = c.name;
  const sub = document.createElement("div");
  sub.className = "cell-sub";
  sub.textContent = c.membership_plan;
  tdName.appendChild(sub);
  tr.appendChild(tdName);

  const tdIndustry = document.createElement("td");
  tdIndustry.textContent = c.industry;
  tr.appendChild(tdIndustry);

  const tdContract = document.createElement("td");
  tdContract.appendChild(badge(statusLabel(CONTRACT_KEYS, c.contract_status), CONTRACT_BADGE[c.contract_status] || "neutral"));
  tr.appendChild(tdContract);

  const tdRenewal = document.createElement("td");
  tdRenewal.textContent = formatDate(c.renewal_date, state.lang);
  tr.appendChild(tdRenewal);

  const tdPayment = document.createElement("td");
  tdPayment.appendChild(badge(statusLabel(PAYMENT_KEYS, c.payment_status), paymentBadgeLevel(c)));
  tr.appendChild(tdPayment);

  const tdPaymentDue = document.createElement("td");
  tdPaymentDue.textContent = formatDate(paymentDateValue(c), state.lang);
  tr.appendChild(tdPaymentDue);

  const tdInvoice = document.createElement("td");
  tdInvoice.appendChild(badge(statusLabel(INVOICE_KEYS, c.invoice_request_status), INVOICE_BADGE[c.invoice_request_status] || "neutral"));
  tr.appendChild(tdInvoice);

  const tdRisk = document.createElement("td");
  const pill = document.createElement("span");
  pill.className = `risk-pill badge-${RISK_BADGE[c.risk.level] || "neutral"}`;
  pill.textContent = statusLabel(RISK_KEYS, c.risk.level);
  tdRisk.appendChild(pill);
  tr.appendChild(tdRisk);

  return tr;
}

function renderTable(companies, totalCount) {
  const tbody = document.getElementById("companyTableBody");
  tbody.innerHTML = "";
  const empty = document.getElementById("tableEmpty");
  const countEl = document.getElementById("tableCount");

  if (!companies.length) {
    empty.classList.remove("hidden");
    document.getElementById("tableEmptyText").textContent = t("noResults");
    const suggestRow = document.getElementById("suggestRow");
    suggestRow.classList.add("hidden");
    suggestRow.innerHTML = "";
  } else {
    empty.classList.add("hidden");
  }

  companies.forEach((c) => {
    tbody.appendChild(buildCompanyRow(c, () => openDrawer(c.id)));
  });

  const { page, pageSize } = state.pagination;
  const start = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = (page - 1) * pageSize + companies.length;
  countEl.textContent = state.lang === "ja"
    ? `${totalCount}社中 ${start}-${end}社を表示`
    : `Showing ${start}-${end} of ${totalCount} companies`;
}

function renderPager() {
  const total = state.companies.length;
  const { page, pageSize } = state.pagination;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(page, totalPages);
  state.pagination.page = clampedPage;

  document.getElementById("pagerPrev").disabled = clampedPage <= 1;
  document.getElementById("pagerNext").disabled = clampedPage >= totalPages;
  document.getElementById("pagerLabel").textContent = state.lang === "ja"
    ? `${clampedPage} / ${totalPages} ページ`
    : `Page ${clampedPage} of ${totalPages}`;
  document.getElementById("pagerControls").classList.toggle("hidden", total === 0);
}

function sortValue(c, key) {
  if (key === "risk") return c.risk.score;
  return c[key];
}

function applySort(companies) {
  const { key, dir } = state.sort;
  if (!key) return companies; // default: already sorted by risk score desc from the API
  const sign = dir === "asc" ? 1 : -1;
  return [...companies].sort((a, b) => {
    const av = sortValue(a, key);
    const bv = sortValue(b, key);
    if (av < bv) return -1 * sign;
    if (av > bv) return 1 * sign;
    return 0;
  });
}

function renderSortArrows() {
  document.querySelectorAll("#companyTable th.sortable").forEach((th) => {
    const key = th.getAttribute("data-sort");
    const arrow = th.querySelector(".sort-arrow");
    const active = state.sort.key === key;
    th.classList.toggle("sort-active", active);
    arrow.textContent = active ? (state.sort.dir === "asc" ? "▲" : "▼") : "▲▼";
  });
}

function setSort(key) {
  if (state.sort.key === key) {
    state.sort.dir = state.sort.dir === "asc" ? "desc" : "asc";
  } else {
    state.sort = { key, dir: "asc" };
  }
  state.pagination.page = 1;
  renderTablePage();
}

function renderTablePage() {
  state.companies = applySort(state.companies);
  renderSortArrows();
  const total = state.companies.length;
  const { page, pageSize } = state.pagination;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(page, totalPages);
  state.pagination.page = clampedPage;
  const start = (clampedPage - 1) * pageSize;
  renderTable(state.companies.slice(start, start + pageSize), total);
  renderPager();
}

// Changing the page size (or paging) changes the table's height, which can
// leave the pager/Next button scrolled out of view below the shrunk table --
// keep it in view so staff don't lose their place.
function scrollPagerIntoView() {
  const pager = document.getElementById("pagerControls");
  const rect = pager.getBoundingClientRect();
  const inView = rect.top >= 0 && rect.bottom <= window.innerHeight;
  if (!inView) {
    pager.scrollIntoView({ block: "center", behavior: "smooth" });
  }
}

/* ---------------------------- charts ---------------------------- */
function renderCharts() {
  if (!state.summary) return;
  const s = state.summary;

  const contractColors = { "Active": "var(--status-good)", "Expired": "var(--status-serious)" };
  const paymentColors = { "Paid": "var(--status-good)", "Not Paid": "var(--status-warning)", "Late Payment": "var(--status-critical)" };
  const invoiceColors = { "Sent": "var(--status-good)", "Not Sent": "var(--status-serious)" };

  const resolve = (c) => Charts.cssVar(c.replace("var(", "").replace(")", ""));

  const toData = (breakdown, keyMap, colorMap) =>
    Object.keys(colorMap)
      .filter((k) => breakdown[k])
      .map((k) => ({ key: k, label: statusLabel(keyMap, k), value: breakdown[k] || 0, color: resolve(colorMap[k]) }));

  Charts.donut(document.getElementById("chartContract"), toData(s.contract_status_breakdown, CONTRACT_KEYS, contractColors), {
    centerLabel: t("kpiTotal"),
    onSegmentClick: (d) => openFilteredModal(d.label, (c) => c.contract_status === d.key),
  });
  Charts.donut(document.getElementById("chartPayment"), toData(s.payment_status_breakdown, PAYMENT_KEYS, paymentColors), {
    centerLabel: t("kpiTotal"),
    onSegmentClick: (d) => openFilteredModal(d.label, (c) => c.payment_status === d.key),
  });
  Charts.donut(document.getElementById("chartInvoice"), toData(s.invoice_status_breakdown, INVOICE_KEYS, invoiceColors), {
    centerLabel: t("kpiTotal"),
    onSegmentClick: (d) => openFilteredModal(d.label, (c) => c.invoice_request_status === d.key),
  });

  if (state.renewalsByMonth) {
    const critical = resolve("--status-critical");
    const warning = resolve("--status-warning");
    const indigo = resolve("--accent-indigo");
    const barData = state.renewalsByMonth.map((b, i) => ({
      label: monthLabel(b.month, state.lang),
      value: b.count,
      color: i === 0 ? critical : i <= 2 ? warning : indigo,
    }));
    Charts.barChart(document.getElementById("chartRenewals"), barData, {
      legend: [
        { label: t("legendDueSoon"), color: critical },
        { label: t("legendDueMid"), color: warning },
        { label: t("legendDueLater"), color: indigo },
      ],
    });
  }
}

/* ---------------------------- insight banner ---------------------------- */
async function loadInsights() {
  const headline = document.getElementById("insightHeadline");
  const bullets = document.getElementById("insightBullets");
  const source = document.getElementById("insightSource");

  if (state.insightCache[state.lang]) {
    paintInsights(state.insightCache[state.lang]);
    return;
  }
  headline.textContent = "";
  bullets.innerHTML = "";
  source.textContent = "";
  stopLoader("insight");
  activeLoaders.insight = createLoader("insightLoadingSteps");
  headline.appendChild(activeLoaders.insight);

  try {
    const data = await api(`/api/ai/portfolio-insights?lang=${state.lang}`, { method: "POST" });
    stopLoader("insight");
    state.insightCache[state.lang] = data;
    paintInsights(data);
  } catch (e) {
    stopLoader("insight");
    headline.textContent = t("insightUnavailable");
  }
}

function paintInsights(data) {
  document.getElementById("insightHeadline").textContent = data.headline;
  const bullets = document.getElementById("insightBullets");
  bullets.innerHTML = "";
  (data.bullets || []).forEach((b) => {
    const li = document.createElement("li");
    li.textContent = b;
    bullets.appendChild(li);
  });
  document.getElementById("insightSource").textContent = data.source === "ai" ? t("aiSourceAi") : t("aiSourceFallback");
}

/* ---------------------------- table data loading ---------------------------- */
let searchDebounce;
async function loadTable() {
  const params = new URLSearchParams();
  if (state.filters.search) params.set("search", state.filters.search);
  if (state.filters.contract_status) params.set("contract_status", state.filters.contract_status);
  if (state.filters.payment_status) params.set("payment_status", state.filters.payment_status);
  if (state.filters.invoice_status) params.set("invoice_status", state.filters.invoice_status);

  try {
    const companies = await api(`/api/companies?${params.toString()}`);
    state.companies = companies;
    renderTablePage();
    if (companies.length === 0 && state.filters.search) {
      renderSearchSuggestions(state.filters.search);
    }
  } catch (e) {
    toast(t("fetchError"));
  }
  updateResetVisibility();
}

function updateResetVisibility() {
  const active = state.filters.search || state.filters.contract_status || state.filters.payment_status || state.filters.invoice_status;
  document.getElementById("resetBtn").classList.toggle("hidden", !active);
}

function resetFilters() {
  document.getElementById("searchInput").value = "";
  document.getElementById("filterContract").value = "";
  document.getElementById("filterPayment").value = "";
  document.getElementById("filterInvoice").value = "";
  document.getElementById("askAiInput").value = "";
  document.getElementById("askAiAnswer").textContent = "";
  stopLoader("askAi");
  state.filters = { search: "", contract_status: "", payment_status: "", invoice_status: "" };
  state.pagination.page = 1;
  loadTable();
}

/* Fuzzy "did you mean" suggestions -- only fetched when the real search comes
   back empty, so a plain substring search stays the fast/cheap default path. */
async function renderSearchSuggestions(term) {
  const textEl = document.getElementById("tableEmptyText");
  const suggestRow = document.getElementById("suggestRow");
  try {
    const suggestions = await api(`/api/companies/suggest?q=${encodeURIComponent(term)}`);
    // the search box may have changed while this was in flight
    if (state.filters.search !== term) return;

    if (!suggestions.length) {
      textEl.textContent = t("noResults");
      suggestRow.classList.add("hidden");
      suggestRow.innerHTML = "";
      return;
    }

    textEl.textContent = t("noResultsTypo");
    suggestRow.innerHTML = "";
    suggestRow.classList.remove("hidden");

    const label = document.createElement("span");
    label.className = "suggest-label";
    label.textContent = t("didYouMean");
    suggestRow.appendChild(label);

    suggestions.forEach((s) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "suggest-chip";
      chip.textContent = s.name;
      chip.addEventListener("click", () => {
        document.getElementById("searchInput").value = s.name;
        state.filters.search = s.name;
        loadTable();
      });
      suggestRow.appendChild(chip);
    });
  } catch (e) {
    // suggestions are a nicety, not a critical path -- fail silent
  }
}

async function loadDashboardData() {
  try {
    const [summary, radar, renewals] = await Promise.all([
      api("/api/analytics/summary"),
      api("/api/analytics/risk-radar?limit=8"),
      api("/api/analytics/renewals-by-month"),
    ]);
    state.summary = summary;
    state.renewalsByMonth = renewals;
    renderKPIs(summary);
    renderRadar(radar);
    renderCharts();
  } catch (e) {
    toast(t("fetchError"));
  }
}

/* ---------------------------- segmentation & data quality ---------------------------- */
function riskLevelVar(count, total) {
  if (!total || count === 0) return "--status-good";
  const ratio = count / total;
  if (ratio >= 0.35) return "--status-critical";
  if (ratio >= 0.15) return "--status-warning";
  return "--status-serious";
}

async function loadSegmentation() {
  try {
    const segmentation = await api("/api/analytics/segmentation");
    state.segmentation = segmentation;
    renderPlanCards(segmentation.by_plan);
    renderIndustryTable(segmentation.by_industry);
  } catch (e) {
    toast(t("fetchError"));
  }
  loadSegmentInsight();
}

function renderPlanCards(byPlan) {
  const wrap = document.getElementById("planCards");
  wrap.innerHTML = "";
  byPlan.forEach((g) => {
    const card = document.createElement("div");
    card.className = "plan-card kpi-clickable";
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");
    const openThisPlan = () => openFilteredModal(g.key, (c) => c.membership_plan === g.key);
    card.addEventListener("click", openThisPlan);
    card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openThisPlan(); } });

    const name = document.createElement("div");
    name.className = "plan-name";
    name.textContent = g.key;

    const total = document.createElement("div");
    total.className = "plan-total";
    total.textContent = g.total;

    const stats = document.createElement("div");
    stats.className = "plan-stats";

    const activeStat = document.createElement("span");
    activeStat.className = "plan-stat";
    activeStat.style.background = "color-mix(in srgb, var(--status-good) 18%, transparent)";
    activeStat.style.color = "var(--status-good)";
    activeStat.textContent = `${t("activeLabel")} ${g.active}`;
    stats.appendChild(activeStat);

    const riskVar = riskLevelVar(g.at_risk_count, g.total);
    const riskStat = document.createElement("span");
    riskStat.className = "plan-stat";
    riskStat.style.background = `color-mix(in srgb, var(${riskVar}) 18%, transparent)`;
    riskStat.style.color = `var(${riskVar})`;
    riskStat.textContent = `${t("atRiskLabel")} ${g.at_risk_count}`;
    stats.appendChild(riskStat);

    card.appendChild(name);
    card.appendChild(total);
    card.appendChild(stats);
    wrap.appendChild(card);
  });
}

function renderIndustryTable(byIndustry) {
  const tbody = document.getElementById("industryTableBody");
  tbody.innerHTML = "";
  byIndustry.forEach((g) => {
    const tr = document.createElement("tr");

    const tdName = document.createElement("td");
    tdName.textContent = g.key;

    const tdTotal = document.createElement("td");
    tdTotal.className = "num";
    tdTotal.textContent = g.total;

    const tdRisk = document.createElement("td");
    tdRisk.className = "num at-risk-cell";
    tdRisk.style.color = `var(${riskLevelVar(g.at_risk_count, g.total)})`;
    tdRisk.textContent = g.at_risk_count;

    const tdLate = document.createElement("td");
    tdLate.className = "num";
    tdLate.textContent = g.payments_late;

    const tdNotSent = document.createElement("td");
    tdNotSent.className = "num";
    tdNotSent.textContent = g.invoices_not_sent;

    tr.appendChild(tdName);
    tr.appendChild(tdTotal);
    tr.appendChild(tdRisk);
    tr.appendChild(tdLate);
    tr.appendChild(tdNotSent);
    tr.style.cursor = "pointer";
    tr.addEventListener("click", () => openFilteredModal(g.key, (c) => c.industry === g.key));
    tbody.appendChild(tr);
  });
}

async function loadSegmentInsight() {
  const headline = document.getElementById("segmentInsightHeadline");
  const bullets = document.getElementById("segmentInsightBullets");
  const source = document.getElementById("segmentInsightSource");

  if (state.segmentInsightCache[state.lang]) {
    paintSegmentInsight(state.segmentInsightCache[state.lang]);
    return;
  }

  headline.textContent = "";
  bullets.innerHTML = "";
  source.textContent = "";
  stopLoader("segment");
  activeLoaders.segment = createLoader("segmentInsightLoadingSteps");
  headline.appendChild(activeLoaders.segment);

  try {
    const data = await api(`/api/ai/segment-insights?lang=${state.lang}`, { method: "POST" });
    stopLoader("segment");
    state.segmentInsightCache[state.lang] = data;
    paintSegmentInsight(data);
  } catch (e) {
    stopLoader("segment");
    headline.textContent = t("insightUnavailable");
  }
}

function paintSegmentInsight(data) {
  document.getElementById("segmentInsightHeadline").textContent = data.headline;
  const bullets = document.getElementById("segmentInsightBullets");
  bullets.innerHTML = "";
  (data.bullets || []).forEach((b) => {
    const li = document.createElement("li");
    li.textContent = b;
    bullets.appendChild(li);
  });
  document.getElementById("segmentInsightSource").textContent = data.source === "ai" ? t("aiSourceAi") : t("aiSourceFallback");
}

/* ---------------------------- drawer ---------------------------- */
async function openDrawer(id) {
  state.drawerCompanyId = id;
  const backdrop = document.getElementById("drawerBackdrop");
  const drawer = document.getElementById("drawer");
  backdrop.classList.remove("hidden");
  drawer.classList.remove("hidden");
  drawer.setAttribute("aria-hidden", "false");

  const content = document.getElementById("drawerContent");
  content.innerHTML = `<div style="padding-top:60px;color:var(--text-muted);font-size:13px;">…</div>`;

  try {
    const c = await api(`/api/companies/${id}`);
    renderDrawer(c);
    loadBrief(c);
  } catch (e) {
    toast(t("fetchError"));
  }
}

function closeDrawer() {
  document.getElementById("drawerBackdrop").classList.add("hidden");
  const drawer = document.getElementById("drawer");
  drawer.classList.add("hidden");
  drawer.setAttribute("aria-hidden", "true");
  state.drawerCompanyId = null;
  stopLoader("brief");
}

function renderDrawer(c) {
  const content = document.getElementById("drawerContent");
  content.innerHTML = "";

  const title = document.createElement("div");
  title.className = "drawer-title";
  title.textContent = c.name;
  content.appendChild(title);

  const meta = document.createElement("div");
  meta.className = "drawer-meta";
  meta.textContent = c.industry;
  content.appendChild(meta);

  const badges = document.createElement("div");
  badges.className = "drawer-badges";
  badges.appendChild(badge(statusLabel(CONTRACT_KEYS, c.contract_status), CONTRACT_BADGE[c.contract_status] || "neutral"));
  badges.appendChild(badge(statusLabel(PAYMENT_KEYS, c.payment_status), paymentBadgeLevel(c)));
  badges.appendChild(badge(statusLabel(INVOICE_KEYS, c.invoice_request_status), INVOICE_BADGE[c.invoice_request_status] || "neutral"));
  if (c.invoice_request_status === "Not Sent") {
    const sendInvoiceBtn = document.createElement("button");
    sendInvoiceBtn.className = "btn-primary send-invoice-btn";
    sendInvoiceBtn.type = "button";
    sendInvoiceBtn.textContent = t("sendInvoice");
    sendInvoiceBtn.addEventListener("click", () => sendInvoiceNow(c.id));
    badges.appendChild(sendInvoiceBtn);
  }
  content.appendChild(badges);

  const aiCard = document.createElement("div");
  aiCard.className = "ai-card";
  aiCard.id = "aiBriefCard";
  aiCard.innerHTML = `<div class="ai-card-head"><span class="label">${t("aiCallScript")}</span><span id="aiSourceTag" style="font-size:10px;color:var(--text-muted);"></span></div>
    <div class="ai-script" id="aiScriptText"></div>`;
  content.appendChild(aiCard);
  stopLoader("brief");
  activeLoaders.brief = createLoader("briefLoadingSteps");
  document.getElementById("aiScriptText").appendChild(activeLoaders.brief);

  const emailCard = document.createElement("div");
  emailCard.className = "ai-card";
  emailCard.innerHTML = `<div class="ai-card-head"><span class="label">${t("emailSectionTitle")}</span></div>
    <textarea class="email-script" id="emailScriptText" rows="5"></textarea>
    <button class="btn-primary" id="sendEmailBtn" style="margin-top:8px;" type="button">${t("sendEmail")}</button>`;
  content.appendChild(emailCard);
  document.getElementById("sendEmailBtn").addEventListener("click", () => sendEmailNow(c.id));

  const info = document.createElement("div");
  info.className = "info-grid";
  const items = [
    ["drawerContact", c.contact_person || "—"],
    ["drawerEmail", c.contact_email || "—"],
    ["drawerPhone", c.contact_phone || "—"],
    ["drawerPlan", c.membership_plan],
    ["drawerFee", `¥${c.monthly_fee_jpy.toLocaleString()}`],
    ["drawerStarted", formatDate(c.contract_start_date, state.lang)],
    ["colRenewal", formatDate(c.renewal_date, state.lang)],
    ["drawerInvoiceSent", formatDate(c.invoice_sent_date, state.lang)],
    ["drawerLastPayment", formatDate(c.last_payment_date, state.lang)],
    ["drawerPaymentDue", formatDate(c.next_payment_due, state.lang)],
  ];
  items.forEach(([labelKey, val]) => {
    const item = document.createElement("div");
    item.className = "info-item";
    const k = document.createElement("div");
    k.className = "k";
    k.textContent = t(labelKey);
    const v = document.createElement("div");
    v.className = "v";
    v.textContent = val;
    item.appendChild(k);
    item.appendChild(v);
    info.appendChild(item);
  });
  content.appendChild(info);

  if (c.notes) {
    const notes = document.createElement("div");
    notes.className = "info-item";
    notes.style.marginBottom = "18px";
    notes.innerHTML = `<div class="k">${t("drawerNotes")}</div><div class="v" style="font-weight:400;">${escapeHtml(c.notes)}</div>`;
    content.appendChild(notes);
  }

  const editor = buildStatusEditor(c);
  content.appendChild(editor);

  const timelineTitle = document.createElement("h3");
  timelineTitle.textContent = t("timelineTitle");
  timelineTitle.style.fontSize = "13.5px";
  timelineTitle.style.margin = "0 0 8px";
  content.appendChild(timelineTitle);

  const timeline = document.createElement("div");
  timeline.className = "timeline";
  c.timeline.forEach((ev) => {
    const item = document.createElement("div");
    item.className = "timeline-item";
    const dot = document.createElement("div");
    dot.className = "timeline-dot";
    const date = document.createElement("div");
    date.className = "timeline-date";
    date.textContent = formatDate(ev.event_date, state.lang);
    const desc = document.createElement("div");
    desc.className = "timeline-desc";
    desc.textContent = t(EVENT_KEYS[ev.event_type] || ev.event_type);
    item.appendChild(dot);
    item.appendChild(date);
    item.appendChild(desc);
    timeline.appendChild(item);
  });
  content.appendChild(timeline);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function buildStatusEditor(c) {
  const wrap = document.createElement("div");
  wrap.className = "status-editor";

  const heading = document.createElement("div");
  heading.style.fontSize = "12px";
  heading.style.fontWeight = "700";
  heading.style.color = "var(--text-muted)";
  heading.style.textTransform = "uppercase";
  heading.style.letterSpacing = "0.05em";
  heading.style.marginBottom = "2px";
  heading.textContent = t("statusEditorTitle");
  wrap.appendChild(heading);

  const makeRow = (labelKey, id, keyMap, current) => {
    const row = document.createElement("div");
    row.className = "row";
    const label = document.createElement("label");
    label.textContent = t(labelKey);
    label.setAttribute("for", id);
    const select = document.createElement("select");
    select.id = id;
    Object.keys(keyMap).forEach((val) => {
      const opt = document.createElement("option");
      opt.value = val;
      opt.textContent = t(keyMap[val]);
      if (val === current) opt.selected = true;
      select.appendChild(opt);
    });
    row.appendChild(label);
    row.appendChild(select);
    return row;
  };

  // "Late Payment" is computed, never a raw value staff can pick -- the select
  // only ever offers the ground truth (Paid/Not Paid) it was derived from.
  const rawPayment = c.payment_status === "Late Payment" ? "Not Paid" : c.payment_status;

  wrap.appendChild(makeRow("colContract", "editContract", CONTRACT_KEYS, c.contract_status));
  wrap.appendChild(makeRow("colPayment", "editPayment", PAYMENT_WRITE_KEYS, rawPayment));
  wrap.appendChild(makeRow("colInvoice", "editInvoice", INVOICE_WRITE_KEYS, c.invoice_request_status));

  const btnRow = document.createElement("div");
  btnRow.className = "row";
  btnRow.style.marginTop = "4px";
  btnRow.style.gap = "8px";

  const saveBtn = document.createElement("button");
  saveBtn.className = "btn-primary";
  saveBtn.textContent = t("save");
  saveBtn.addEventListener("click", () => saveStatus(c.id));
  btnRow.appendChild(saveBtn);

  const modifyBtn = document.createElement("button");
  modifyBtn.className = "btn-ghost";
  modifyBtn.type = "button";
  modifyBtn.textContent = t("modifyRecord");
  modifyBtn.addEventListener("click", () => openRecordModal("edit", c));
  btnRow.appendChild(modifyBtn);

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "btn-ghost";
  deleteBtn.type = "button";
  deleteBtn.textContent = t("deleteRecord");
  deleteBtn.addEventListener("click", () => deleteRecord(c.id, c.name));
  btnRow.appendChild(deleteBtn);

  wrap.appendChild(btnRow);

  return wrap;
}

async function saveStatus(id) {
  const payload = {
    contract_status: document.getElementById("editContract").value,
    payment_status: document.getElementById("editPayment").value,
    invoice_request_status: document.getElementById("editInvoice").value,
  };
  try {
    const updated = await api(`/api/companies/${id}/status`, { method: "PATCH", body: JSON.stringify(payload) });
    toast(t("saved"));
    renderDrawer(updated);
    loadBrief(updated);
    await Promise.all([loadTable(), loadDashboardData()]);
  } catch (e) {
    toast(e.detail || t("fetchError"));
  }
}

async function sendInvoiceNow(id) {
  try {
    const updated = await api(`/api/companies/${id}/status`, { method: "PATCH", body: JSON.stringify({ invoice_request_status: "Sent" }) });
    toast(t("invoiceSent"));
    renderDrawer(updated);
    loadBrief(updated);
    await Promise.all([loadTable(), loadDashboardData()]);
  } catch (e) {
    toast(e.detail || t("fetchError"));
  }
}

async function deleteRecord(id, name) {
  const msg = state.lang === "ja" ? `${name} を削除しますか？この操作は取り消せません。` : `Delete ${name}? This cannot be undone.`;
  if (!window.confirm(msg)) return;
  try {
    await api(`/api/companies/${id}`, { method: "DELETE" });
    toast(t("deleted"));
    closeDrawer();
    await Promise.all([loadTable(), loadDashboardData()]);
  } catch (e) {
    toast(e.detail || t("fetchError"));
  }
}

/* ---------------------------- add / modify record modal ---------------------------- */
function openRecordModal(mode, company) {
  const modal = document.getElementById("recordModal");
  const backdrop = document.getElementById("recordModalBackdrop");
  document.getElementById("recordModalTitle").textContent = mode === "edit" ? t("modifyRecord") : t("addRecord");

  const c = company || {};
  document.getElementById("fName").value = c.name || "";
  document.getElementById("fNameKana").value = c.name_kana || "";
  document.getElementById("fIndustry").value = c.industry || "";
  document.getElementById("fPlan").value = c.membership_plan || "";
  document.getElementById("fContactPerson").value = c.contact_person || "";
  document.getElementById("fContactEmail").value = c.contact_email || "";
  document.getElementById("fContactPhone").value = c.contact_phone || "";
  document.getElementById("fContractStatus").value = c.contract_status || "Active";
  document.getElementById("fContractStart").value = c.contract_start_date || "";
  document.getElementById("fRenewalDate").value = c.renewal_date || "";
  document.getElementById("fPaymentStatus").value = c.payment_status === "Late Payment" ? "Not Paid" : (c.payment_status || "Not Paid");
  document.getElementById("fPaymentDue").value = c.next_payment_due || isoDatePlusDays(30);
  document.getElementById("fInvoiceStatus").value = c.invoice_request_status || "Not Sent";
  document.getElementById("fFee").value = c.monthly_fee_jpy != null ? c.monthly_fee_jpy : "";
  document.getElementById("fNotes").value = c.notes || "";

  document.getElementById("recordForm").dataset.mode = mode;
  document.getElementById("recordForm").dataset.id = c.id || "";

  backdrop.classList.remove("hidden");
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
}

function closeRecordModal() {
  document.getElementById("recordModalBackdrop").classList.add("hidden");
  const modal = document.getElementById("recordModal");
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
}

/* ---------------------------- help guide modal ---------------------------- */
function renderHelpGuide() {
  const guide = HELP_GUIDE[state.lang] || HELP_GUIDE.en;
  document.getElementById("helpModalTitle").textContent = guide.title;
  const body = document.getElementById("helpModalBody");
  body.innerHTML = "";
  guide.sections.forEach((section) => {
    const wrap = document.createElement("div");
    wrap.className = "help-section";
    const h = document.createElement("h3");
    h.textContent = section.h;
    wrap.appendChild(h);
    section.p.forEach((text) => {
      const p = document.createElement("p");
      p.textContent = text;
      wrap.appendChild(p);
    });
    if (section.items.length) {
      const ul = document.createElement("ul");
      section.items.forEach((text) => {
        const li = document.createElement("li");
        li.textContent = text;
        ul.appendChild(li);
      });
      wrap.appendChild(ul);
    }
    body.appendChild(wrap);
  });
}

function openHelpModal() {
  renderHelpGuide();
  document.getElementById("helpModalBackdrop").classList.remove("hidden");
  const modal = document.getElementById("helpModal");
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
}

function closeHelpModal() {
  document.getElementById("helpModalBackdrop").classList.add("hidden");
  const modal = document.getElementById("helpModal");
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
}

/* ---------------------------- KPI drill-down modal ---------------------------- */
const KPI_FILTERS = {
  total: (c) => true,
  active: (c) => c.contract_status === "Active",
  renewals: (c) => c.contract_status === "Active" && c.risk.days_to_renewal !== null && c.risk.days_to_renewal >= 0 && c.risk.days_to_renewal <= 30,
  overdue: (c) => c.effective_payment_status === "Late Payment",
  missing: (c) => c.invoice_request_status === "Not Sent",
};
const KPI_TITLE_KEYS = { total: "kpiTotal", active: "kpiActive", renewals: "kpiRenewals", overdue: "kpiOverdue", missing: "kpiMissing" };

async function openKpiModal(kind) {
  const filterFn = KPI_FILTERS[kind];
  if (!filterFn) return;
  const sortFn = kind === "renewals" ? (a, b) => a.risk.days_to_renewal - b.risk.days_to_renewal : null;
  return openFilteredModal(t(KPI_TITLE_KEYS[kind] || ""), filterFn, sortFn);
}

// Generic drill-down used by the KPI tiles, donut chart segments, and the
// membership-plan / industry segmentation panels -- anywhere a summary
// number or group should be clickable to see exactly which companies make it up.
async function openFilteredModal(title, filterFn, sortFn) {
  const backdrop = document.getElementById("kpiModalBackdrop");
  const modal = document.getElementById("kpiModal");
  document.getElementById("kpiModalTitle").textContent = title;
  const tbody = document.getElementById("kpiModalTableBody");
  const empty = document.getElementById("kpiModalEmpty");
  tbody.innerHTML = "";
  empty.classList.add("hidden");
  document.getElementById("kpiModalSub").textContent = "";

  backdrop.classList.remove("hidden");
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");

  try {
    const all = await api("/api/companies");
    let matches = all.filter(filterFn);
    if (sortFn) matches = matches.sort(sortFn);

    document.getElementById("kpiModalSub").textContent = state.lang === "ja"
      ? `${matches.length}社`
      : `${matches.length} ${matches.length === 1 ? "company" : "companies"}`;

    if (!matches.length) {
      empty.textContent = t("noResults");
      empty.classList.remove("hidden");
    } else {
      matches.forEach((c) => {
        tbody.appendChild(buildCompanyRow(c, () => { closeKpiModal(); openDrawer(c.id); }));
      });
    }
  } catch (e) {
    toast(t("fetchError"));
  }
}

function closeKpiModal() {
  document.getElementById("kpiModalBackdrop").classList.add("hidden");
  const modal = document.getElementById("kpiModal");
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
}

async function submitRecordModal(e) {
  e.preventDefault();
  const form = document.getElementById("recordForm");
  const mode = form.dataset.mode;
  const id = form.dataset.id;

  const payload = {
    name: document.getElementById("fName").value.trim(),
    name_kana: document.getElementById("fNameKana").value.trim() || null,
    industry: document.getElementById("fIndustry").value.trim(),
    membership_plan: document.getElementById("fPlan").value.trim(),
    contact_person: document.getElementById("fContactPerson").value.trim() || null,
    contact_email: document.getElementById("fContactEmail").value.trim() || null,
    contact_phone: document.getElementById("fContactPhone").value.trim() || null,
    contract_status: document.getElementById("fContractStatus").value,
    contract_start_date: document.getElementById("fContractStart").value,
    renewal_date: document.getElementById("fRenewalDate").value,
    payment_status: document.getElementById("fPaymentStatus").value,
    next_payment_due: document.getElementById("fPaymentDue").value,
    monthly_fee_jpy: parseInt(document.getElementById("fFee").value, 10) || 0,
    invoice_request_status: document.getElementById("fInvoiceStatus").value,
    notes: document.getElementById("fNotes").value.trim() || null,
  };

  try {
    const saved = mode === "edit"
      ? await api(`/api/companies/${id}`, { method: "PUT", body: JSON.stringify(payload) })
      : await api("/api/companies", { method: "POST", body: JSON.stringify(payload) });
    toast(t("recordSaved"));
    closeRecordModal();
    await Promise.all([loadTable(), loadDashboardData()]);
    if (mode === "edit") openDrawer(saved.id);
  } catch (e) {
    toast(e.detail || t("fetchError"));
  }
}

function validateRecordFormPaymentInvoice() {
  const paymentSelect = document.getElementById("fPaymentStatus");
  const invoiceSelect = document.getElementById("fInvoiceStatus");
  const paidOption = paymentSelect.querySelector('option[value="Paid"]');
  const invoiceNotSent = invoiceSelect.value !== "Sent";
  paidOption.disabled = invoiceNotSent;
  if (invoiceNotSent && paymentSelect.value === "Paid") {
    paymentSelect.value = "Not Paid";
  }
}

async function loadBrief(c) {
  try {
    const brief = await api(`/api/ai/company-brief/${c.id}?lang=${state.lang}`, { method: "POST" });
    stopLoader("brief");
    const scriptEl = document.getElementById("aiScriptText");
    const sourceEl = document.getElementById("aiSourceTag");
    if (!scriptEl) return;
    scriptEl.textContent = brief.call_script;
    const action = document.createElement("div");
    action.className = "ai-action";
    action.innerHTML = `<strong>${t("aiRecommended")}:</strong> `;
    action.appendChild(document.createTextNode(brief.recommended_action));
    scriptEl.after(action);

    const copyBtn = document.createElement("button");
    copyBtn.className = "copy-btn";
    copyBtn.textContent = t("copy");
    copyBtn.style.marginTop = "8px";
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(brief.call_script);
      copyBtn.textContent = t("copied");
      setTimeout(() => (copyBtn.textContent = t("copy")), 1500);
    });
    action.after(copyBtn);

    if (sourceEl) sourceEl.textContent = brief.source === "ai" ? t("aiSourceAi") : t("aiSourceFallback");

    const emailEl = document.getElementById("emailScriptText");
    if (emailEl && !emailEl.value) emailEl.value = brief.email_body;
  } catch (e) {
    stopLoader("brief");
    const scriptEl = document.getElementById("aiScriptText");
    if (scriptEl) scriptEl.textContent = t("insightUnavailable");
  }
}

async function sendEmailNow(companyId) {
  const textarea = document.getElementById("emailScriptText");
  const script = textarea ? textarea.value.trim() : "";
  if (!script) return;

  const btn = document.getElementById("sendEmailBtn");
  btn.disabled = true;
  try {
    const result = await api(`/api/companies/${companyId}/send-email`, { method: "POST", body: JSON.stringify({ script }) });
    toast(result.to ? `${t("emailSentTo")} ${result.to}` : t("emailSentNoAddress"));
    if (state.drawerCompanyId === companyId) openDrawer(companyId);
  } catch (e) {
    toast(e.detail || t("fetchError"));
  } finally {
    btn.disabled = false;
  }
}

/* ---------------------------- CSV export ---------------------------- */
function exportCsv() {
  const header = [t("colCompany"), t("colIndustry"), t("colContract"), t("colRenewal"), t("colPayment"), t("colPaymentDue"), t("colInvoice"), t("colRisk")];
  const rows = state.companies.map((c) => [
    c.name, c.industry,
    statusLabel(CONTRACT_KEYS, c.contract_status),
    formatDate(c.renewal_date, state.lang),
    statusLabel(PAYMENT_KEYS, c.payment_status),
    formatDate(paymentDateValue(c), state.lang),
    statusLabel(INVOICE_KEYS, c.invoice_request_status),
    statusLabel(RISK_KEYS, c.risk.level),
  ]);
  const csv = [header, ...rows]
    .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sakura_deeptech_shibuya_members.csv";
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------------------------- ask AI ---------------------------- */
function setAskAiMode(mode) {
  state.askAiMode = mode;
  state.askAiHistory = [];
  document.getElementById("askAiModeSingle").classList.toggle("active", mode === "single");
  document.getElementById("askAiModeSession").classList.toggle("active", mode === "session");
  document.getElementById("askAiNewSession").classList.toggle("hidden", mode !== "session");
  document.getElementById("askAiAnswer").innerHTML = "";
}

function renderAskAiSource(container, source) {
  if (!source) return;
  const tag = document.createElement("span");
  tag.style.marginLeft = "8px";
  tag.style.fontSize = "10px";
  tag.style.color = "var(--text-muted)";
  tag.style.textTransform = "uppercase";
  tag.style.letterSpacing = "0.05em";
  tag.textContent = source === "ai" ? t("aiSourceAi") : t("aiSourceFallback");
  container.appendChild(tag);
}

function renderAskAiSession() {
  const answerEl = document.getElementById("askAiAnswer");
  answerEl.innerHTML = "";
  state.askAiHistory.forEach((turn) => {
    const wrap = document.createElement("div");
    wrap.className = "ask-ai-turn";
    const q = document.createElement("div");
    q.className = "q";
    q.textContent = turn.question;
    const a = document.createElement("div");
    a.className = "a";
    a.textContent = turn.answer;
    renderAskAiSource(a, turn.source);
    wrap.appendChild(q);
    wrap.appendChild(a);
    answerEl.appendChild(wrap);
  });
}

async function submitAskAi() {
  const q = document.getElementById("askAiInput").value.trim();
  if (!q) return;

  const submitBtn = document.getElementById("askAiSubmit");
  const answerEl = document.getElementById("askAiAnswer");
  const isSession = state.askAiMode === "session";
  submitBtn.disabled = true;
  submitBtn.classList.add("is-loading");
  if (!isSession) answerEl.innerHTML = "";
  stopLoader("askAi");
  activeLoaders.askAi = createLoader("askAiLoadingSteps");
  if (isSession) {
    const loaderRow = document.createElement("div");
    loaderRow.appendChild(activeLoaders.askAi);
    answerEl.appendChild(loaderRow);
  } else {
    answerEl.appendChild(activeLoaders.askAi);
  }

  try {
    const body = { question: q };
    if (isSession && state.askAiHistory.length) {
      body.history = state.askAiHistory.map((t) => ({ question: t.question, answer: t.answer }));
    }
    const result = await api(`/api/ai/smart-search?lang=${state.lang}`, { method: "POST", body: JSON.stringify(body) });
    document.getElementById("searchInput").value = result.search || "";
    document.getElementById("filterContract").value = result.contract_status || "";
    document.getElementById("filterPayment").value = result.payment_status || "";
    document.getElementById("filterInvoice").value = result.invoice_status || "";
    state.filters.search = result.search || "";
    state.filters.contract_status = result.contract_status || "";
    state.filters.payment_status = result.payment_status || "";
    state.filters.invoice_status = result.invoice_status || "";
    state.pagination.page = 1;
    stopLoader("askAi");

    if (isSession) {
      state.askAiHistory.push({ question: q, answer: result.answer || "", source: result.source });
      renderAskAiSession();
      document.getElementById("askAiInput").value = "";
    } else {
      answerEl.innerHTML = "";
      const answerText = document.createElement("span");
      answerText.textContent = result.answer || "";
      answerEl.appendChild(answerText);
      renderAskAiSource(answerEl, result.source);
    }
    await loadTable();
  } catch (e) {
    stopLoader("askAi");
    if (!isSession) answerEl.textContent = "";
    toast(t("fetchError"));
  } finally {
    submitBtn.disabled = false;
    submitBtn.classList.remove("is-loading");
  }
}

/* ---------------------------- theme / lang toggles ---------------------------- */
function applyTheme() {
  document.documentElement.setAttribute("data-theme", state.theme);
}

function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  localStorage.setItem("sds_theme", state.theme);
  applyTheme();
  renderCharts();
}

function toggleLang() {
  state.lang = state.lang === "en" ? "ja" : "en";
  localStorage.setItem("sds_lang", state.lang);
  applyStaticI18n();
  renderKPIs(state.summary || { total_companies: 0, active_contracts: 0, renewals_due_30d: 0, payments_late: 0, invoices_not_sent: 0 });
  loadTable();
  loadDashboardData();
  loadInsights();
  loadSegmentation();
  renderModelStatus();
  updateClock();
  if (state.drawerCompanyId) openDrawer(state.drawerCompanyId);
}

/* ---------------------------- model connection status ---------------------------- */
function renderModelStatus() {
  const dot = document.querySelector("#modelStatus .status-dot");
  const text = document.getElementById("modelStatusText");
  const badge = document.getElementById("modelStatus");
  const s = state.modelStatus;

  if (!s) {
    dot.className = "status-dot checking";
    text.textContent = t("modelChecking");
    badge.title = "";
    return;
  }
  if (s.connected) {
    dot.className = "status-dot connected";
    text.textContent = s.model ? `${t("modelConnected")} (${s.model})` : t("modelConnected");
  } else if (s.demo_mode) {
    dot.className = "status-dot fallback";
    text.textContent = t("modelDemoMode");
  } else {
    dot.className = "status-dot fallback";
    text.textContent = t("modelFallback");
  }
  badge.title = s.message || "";
}

async function checkModelStatus() {
  state.modelStatus = null;
  renderModelStatus();
  try {
    state.modelStatus = await api("/api/ai/status");
  } catch (e) {
    state.modelStatus = { connected: false, demo_mode: false, message: "" };
  }
  renderModelStatus();
}

/* ---------------------------- clock ---------------------------- */
function updateClock() {
  const now = new Date();
  const locale = state.lang === "ja" ? "ja-JP" : "en-US";
  document.getElementById("clock").textContent = now.toLocaleString(locale, {
    hour: "2-digit", minute: "2-digit", month: "short", day: "numeric",
  });
}

/* ---------------------------- init ---------------------------- */
function initEvents() {
  document.getElementById("themeToggle").addEventListener("click", toggleTheme);
  document.getElementById("langToggle").addEventListener("click", toggleLang);

  document.getElementById("searchInput").addEventListener("input", (e) => {
    clearTimeout(searchDebounce);
    const val = e.target.value;
    searchDebounce = setTimeout(() => {
      state.filters.search = val;
      state.pagination.page = 1;
      loadTable();
    }, 250);
  });

  ["filterContract", "filterPayment", "filterInvoice"].forEach((id) => {
    document.getElementById(id).addEventListener("change", (e) => {
      const key = { filterContract: "contract_status", filterPayment: "payment_status", filterInvoice: "invoice_status" }[id];
      state.filters[key] = e.target.value;
      state.pagination.page = 1;
      loadTable();
    });
  });

  document.getElementById("resetBtn").addEventListener("click", resetFilters);

  document.querySelectorAll(".kpi-clickable").forEach((tile) => {
    const kind = tile.getAttribute("data-kpi");
    tile.addEventListener("click", () => openKpiModal(kind));
    tile.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openKpiModal(kind); }
    });
  });
  document.getElementById("kpiModalClose").addEventListener("click", closeKpiModal);
  document.getElementById("kpiModalBackdrop").addEventListener("click", closeKpiModal);

  document.querySelectorAll("#companyTable th.sortable").forEach((th) => {
    th.addEventListener("click", () => setSort(th.getAttribute("data-sort")));
  });

  document.getElementById("askAiSubmit").addEventListener("click", submitAskAi);
  document.getElementById("askAiInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitAskAi();
  });
  document.getElementById("askAiModeSingle").addEventListener("click", () => setAskAiMode("single"));
  document.getElementById("askAiModeSession").addEventListener("click", () => setAskAiMode("session"));
  document.getElementById("askAiNewSession").addEventListener("click", () => setAskAiMode("session"));

  document.getElementById("exportBtn").addEventListener("click", exportCsv);

  document.getElementById("pageSizeSelect").addEventListener("change", (e) => {
    state.pagination.pageSize = parseInt(e.target.value, 10);
    state.pagination.page = 1;
    renderTablePage();
    scrollPagerIntoView();
  });
  document.getElementById("pagerPrev").addEventListener("click", () => {
    state.pagination.page = Math.max(1, state.pagination.page - 1);
    renderTablePage();
    scrollPagerIntoView();
  });
  document.getElementById("pagerNext").addEventListener("click", () => {
    state.pagination.page += 1;
    renderTablePage();
    scrollPagerIntoView();
  });

  document.getElementById("addRecordBtn").addEventListener("click", () => openRecordModal("add", null));
  document.getElementById("recordModalClose").addEventListener("click", closeRecordModal);
  document.getElementById("recordModalBackdrop").addEventListener("click", closeRecordModal);
  document.getElementById("recordFormCancel").addEventListener("click", closeRecordModal);
  document.getElementById("recordForm").addEventListener("submit", submitRecordModal);
  document.getElementById("fInvoiceStatus").addEventListener("change", validateRecordFormPaymentInvoice);

  document.getElementById("drawerClose").addEventListener("click", closeDrawer);
  document.getElementById("drawerBackdrop").addEventListener("click", closeDrawer);

  document.getElementById("helpBtn").addEventListener("click", openHelpModal);
  document.getElementById("helpModalClose").addEventListener("click", closeHelpModal);
  document.getElementById("helpModalBackdrop").addEventListener("click", closeHelpModal);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeDrawer(); closeRecordModal(); closeHelpModal(); closeKpiModal(); }
  });
}

async function init() {
  applyTheme();
  applyStaticI18n();
  updateClock();
  setInterval(updateClock, 30000);
  initEvents();
  await loadDashboardData();
  await loadTable();
  loadInsights();
  loadSegmentation();
  checkModelStatus();
  setInterval(checkModelStatus, 120000);
}

init();
