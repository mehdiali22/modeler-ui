# خلاصهٔ کامل و دقیق چت — V3 UI (Modeler)

> این سند خلاصهٔ دقیق تصمیم‌ها و خروجی‌های همین چت است؛ مناسب برای بردن به چت جدید یا نگهداری در ریپو.

---

## 1) تصمیم‌های معماری V3

- در UI/مدل به‌جای «Rule» از **Scenario (سناریو)** استفاده می‌شود.
- هر **Scenario** با یک **Trigger** شروع می‌شود، منطق خود را اجرا می‌کند و در پایان **Event** تولید می‌کند.
- سیستم شما در واقع **event-driven کامل** نیست و محور تصمیم‌گیری‌اش **status/fact** است؛ ولی برای مقیاس‌پذیری و زنجیره‌سازی، مدل **Event → Trigger Link** را در UI اضافه کردیم (به‌صورت viewer/editable).

### Atomic بودن سناریوها
- پیشنهاد Atomic (سناریوی جدا برای Approve/Reject) مطرح شد.
- شما گفتید **همه‌جا اتمیک شدنی نیست**.
- بنابراین مدل اصلی را نگه داشتیم: یک Scenario می‌تواند **چند خروجی** داشته باشد که با **Decision** مدل می‌شود.

---

## 2) مدل مفهومی V3 که در UI پیاده شد

### Artifact
- موجودیت/مدرک سطح‌بالا که State روی آن معنی دارد.
- مثال‌ها: `Case`، `CaseKsr`، `MonthlyPerformance`

### Fact
- «فیلد/وضعیت تاثیرگذار در تصمیم‌گیری».
- مثال‌ها: `Case.Status`، `Case.LockedByIncome`، `CaseKsr.KsrGateState`

### Condition (ساده‌شده برای V3)
- Conditionها به‌جای فرمول پیچیده، با یک **expression string آزاد** نگهداری می‌شوند.
- expression برای AND/OR روی Factهاست.
- (Formula را در V3 حذف کردیم؛ اگر لازم شد در V4 می‌توانیم DSL/Parser اضافه کنیم.)

### Scenario
هر سناریو شامل:
- `preconditionIds` (شرط‌های شروع)
- `actions` (ارجاع به Action Catalog + paramsJson اختیاری)
- `factChanges`
- `producedEventIds`
- `decisions[]` (اختیاری برای چند خروجی)

### Decision (درون Scenario)
هر Decision شامل:
- `decisionKey` (مثلاً Approve/Reject/ReturnToPool)
- `conditionIds` (اختیاری)
- `actions`
- `factChanges`
- `producedEventIds`

---

## 3) KSR در V3

- **KSR Execution** یک **Child Artifact** داخل **Case** است (عمرش با Case گره خورده).
- **KSR Policy/Definition** را فعلاً واردش نشدیم؛ بعداً اگر لازم شد ماژول جدا می‌سازیم.

---

## 4) اصول UI/Angular که تثبیت شد

- تمرکز فعلی: ساخت **Modeler UI** برای V3 (بدون API/DB فعلاً).
- **ModelContext حذف شد** (پیچیدگی غیرضروری).
- ذخیره‌سازی فعلاً در **Local Store** است (راه‌حل موقت تا UI تکمیل شود).
- شما تاکید کردی:
  - از **Reactive Form** استفاده نکنیم.
  - UI با `<input>`, `<select>`, ... ساخته شود.
- RTL باید فعال باشد و **منو سمت راست**.

---

## 5) مشکلات UI که حل شد

### منو سمت چپ و اسکرول اضافی
- مشکل از ترکیب RTL و `row-reverse` بود.
- راه‌حل:
  - `flex-direction: row` برای layout
  - `html, body { height:100%; overflow:hidden }`
  - اسکرول فقط روی محتوای داخلی

### خطای Angular (NG9): `stageKeyById` وجود ندارد
- با اضافه کردن تابع `stageKeyById()` داخل `ScenariosComponent` حل شد.

---

## 6) صفحات/کامپوننت‌های اضافه‌شده (V3 UI)

### 6.1) Flow Explorer
- دو حالت نمایش:
  - Trigger → Scenarios
  - Event → Producer Scenarios
- قابلیت کلیدی:
  - **EventTriggerLink**: نگاشت `Event → Trigger` برای زنجیره‌سازی (قابل ویرایش)

### 6.2) Seed / Bootstrap
- دکمه‌ها:
  - Seed (If Empty)
  - Seed (Overwrite)
  - Clear All
- دیتاهای پایه را برای تست سریع در Store می‌ریزد.

### 6.3) Stage Board
- انتخاب Process و Stage
- نمایش کارت‌های سناریوهای همان Stage
- نمایش Trigger/Events/هشدارها

### 6.4) Scenario Matrix
- Stageها به‌صورت ستون
- سناریوها داخل هر ستون
- نمایش آمار Actions/Events/Decisions

---

## 7) اضافه شدن Decision به Scenario Editor

- ساختار `ScenarioDecision` به مدل اضافه شد.
- در UI، پنل Decision اضافه شد:
  - افزودن/ویرایش/حذف Decision
  - انتخاب Condition با checkbox + فیلتر
  - افزودن Action از Catalog + paramsJson
  - افزودن FactChange (fact + value)
  - انتخاب Produced Events با checkbox + فیلتر
- **Sanitize** هنگام ذخیره:
  - trim
  - حذف آیتم‌های نامعتبر
  - نگه داشتن فقط referenceهای معتبر (IDs)

---

## 8) Patch برای Decision-aware شدن Explorer و Board

چون قبلاً فقط `producedEventIds` سناریو خوانده می‌شد، پچ دادیم تا:
- Event/Action/FactChange داخل `decisions` هم در آمار و نمایش لحاظ شود.
- union کردن Eventها بین base و decisions
- نمایش «منبع تولید Event»:
  - `Base` یا `Decision:<decisionKey>`

> Matrix از اول Decision-aware نوشته شده بود.

---

## 9) Seed هم Decision-aware شد (نمونه واقعی)

سناریوی درآمد از حالت تک‌مسیر به حالت چندخروجی تبدیل شد:

### Decisions
1) **Approve**
   - شرط: `CanIncomeApprove`
   - Action: `IncomeApprove`
   - FactChange: `Case.Status=Approved`, `Case.LockedByIncome=false`
   - Event: `IncomeApproved`

2) **Reject**
   - Action: `IncomeReject`
   - FactChange: `Case.Status=Rejected`, `Case.LockedByIncome=false`
   - Event: `IncomeRejected`

3) **ReturnToPool**
   - Action جدید: `ReturnToPool` (آزادسازی مالکیت)
   - FactChange: `Case.Status=Draft`, `Case.LockedByIncome=false`
   - Event جدید: `ReturnedToPool`

### Event → Trigger Link جدید
- `ReturnedToPool → OnIncomeStartActivity`

---

## 10) تصمیم درباره Action Catalog

- شما گفتید: **گزینه A (Action Catalog جدا) را بعداً**.
- بنابراین فعلاً Actionها به‌صورت **Reference** در Scenario استفاده می‌شوند.
- Catalog رسمی/پیشرفته‌تر در مرحله بعدی ساخته می‌شود.

---

## 11) وضعیت فعلی پروژه

- UI فعلی شامل:
  - Catalogهای اصلی (Artifacts/Facts/Conditions/Triggers/Events/Scenarios و …)
  - Explorer + StageBoard + Matrix
  - Decision داخل Scenario
  - Seed برای ساخت دیتای نمونه و تست سریع
- ذخیره‌سازی فعلاً Store است؛ مرحله بعدی اتصال به **SQL Server + .NET Core API** خواهد بود.

---

## 12) قدم‌های بعدی پیشنهادی (برای ادامه)

1) تکمیل Scenario Editor برای تجربهٔ مدل‌سازی راحت‌تر:
   - مرتب‌سازی و UX بهتر برای Actions/FactChanges/Events/Decisions
   - (اختیاری) نگاشت Decision به دکمه‌های UI با `uiActionKey`

2) بعد از تثبیت UI:
   - طراحی دیتابیس SQL Server
   - ساخت API در .NET Core
   - جایگزینی Store با API

---

## 13) نکتهٔ کلیدی اصطلاحات

- **Fact**: وضعیت/فیلد تاثیرگذار در تصمیم‌گیری
- **Condition**: عبارت ترکیبی (string) روی Factها که Bool می‌دهد
- **Gate**: همان Condition با نقش «اجازه انجام/عبور»
- **Decision**: شاخهٔ خروجی داخل یک Scenario (چند outcome)

---

### پایان سند

