import { useState, useMemo } from 'react'
import { Search, X, BookOpen, ChevronRight, Download } from 'lucide-react'
import { useAuthStore } from '../store/auth.store'
import { isFinanceModuleEnabledForTenant } from '../lib/tenantModules'

type Language = 'bg' | 'en'

interface HelpSection {
  id: string
  icon: string
  title: { bg: string; en: string }
  content: { bg: string; en: string }
  keywords: string[]
  requiresFinance?: boolean
}

const sections: HelpSection[] = [
  {
    id: 'intro',
    icon: '⚡',
    title: { bg: 'Въведение', en: 'Introduction' },
    keywords: ['въведение', 'начало', 'intro', 'getting started', 'браузър', 'browser'],
    content: {
      bg: `DFlowERP е модулна ERP система за малки и средни предприятия.

**Поддържани браузъри:**
- ✅ Google Chrome (препоръчан)
- ✅ Mozilla Firefox
- ✅ Microsoft Edge
- ⚠️ Safari (частична поддръжка)

**Достъп:** Отворете браузър на адрес \`http://[IP-на-сървъра]:3001\``,
      en: `DFlowERP is a modular ERP system for small and medium businesses.

**Supported browsers:**
- ✅ Google Chrome (recommended)
- ✅ Mozilla Firefox
- ✅ Microsoft Edge
- ⚠️ Safari (partial support)

**Access:** Open your browser at \`http://[server-IP]:3001\``
    }
  },
  {
    id: 'login',
    icon: '🔐',
    title: { bg: 'Вход в системата', en: 'Login' },
    keywords: ['вход', 'логин', 'парола', 'login', 'password', 'имейл', 'email'],
    content: {
      bg: `**Стъпки за вход:**
1. Въведете имейл адрес
2. Въведете парола
3. Натиснете "Влез в системата"

При забравена парола се свържете с вашия администратор.`,
      en: `**Login steps:**
1. Enter your email address
2. Enter your password
3. Click "Login"

For forgotten password, contact your system administrator.`
    }
  },
  {
    id: 'dashboard',
    icon: '📊',
    title: { bg: 'Табло', en: 'Dashboard' },
    keywords: ['табло', 'dashboard', 'начална страница', 'home', 'карти', 'cards'],
    content: {
      bg: `Таблото показва обобщена информация за всички модули:

| Модул | Показва |
|-------|---------|
| 📦 WMS | Складове, артикули, чернови |
| 🚚 SCM | Доставчици, поръчки в изчакване |
| 🏭 MES | Рецептури, нареждания |
| 🛒 POS | Каси, продажби, приход днес |
| 💾 Backup | Политики, последно архивиране |

**Червените числа** = предупреждения (напр. артикули под минимум)
Кликнете **"Виж →"** за да отворите модула.`,
      en: `The dashboard shows a summary of all modules:

| Module | Shows |
|--------|-------|
| 📦 WMS | Warehouses, items, drafts |
| 🚚 SCM | Suppliers, pending orders |
| 🏭 MES | BOMs, work orders |
| 🛒 POS | Registers, today's sales |
| 💾 Backup | Policies, last backup |

**Red numbers** = warnings (e.g. items below minimum stock)
Click **"View →"** to open the module.`
    }
  },
  {
    id: 'users',
    icon: '👥',
    title: { bg: 'Потребители', en: 'Users' },
    keywords: ['потребители', 'users', 'роля', 'role', 'парола', 'password', 'admin'],
    content: {
      bg: `**Добавяне на потребител:**
1. Меню → Потребители
2. Попълнете имейл, парола, роля
3. Натиснете "Добави"

**Роли:**
| Роля | Права |
|------|-------|
| SUPER_ADMIN | Пълен достъп |
| ADMIN | Потребители + настройки |
| MANAGER | Всички модули |
| OPERATOR | Работа с модули |
| READONLY | Само четене |`,
      en: `**Adding a user:**
1. Menu → Users
2. Fill in email, password, role
3. Click "Add"

**Roles:**
| Role | Access |
|------|--------|
| SUPER_ADMIN | Full access |
| ADMIN | Users + settings |
| MANAGER | All modules |
| OPERATOR | Work with modules |
| READONLY | Read only |`
    }
  },
  {
    id: 'wms',
    icon: '📦',
    title: { bg: 'Складово стопанство (WMS)', en: 'Warehouse Management (WMS)' },
    keywords: ['склад', 'warehouse', 'наличност', 'stock', 'продукт', 'product', 'баркод', 'barcode', 'приходен', 'receipt', 'движения', 'movements'],
    content: {
      bg: `**Складове:** Управление на физически складове и локации.

**Продукти:**
1. WMS → Продукти → "Нов продукт"
2. Попълнете: Код, Наименование, М.Е.
3. По желание: Баркод (сканирайте с 📷), Мин. наличност, Цена
4. Задайте начална наличност и склад

**Наличности:** Текущи количества по продукт и локация.
⚠️ Червено = под минимум

**Приемане:** Приходни документи за получени стоки.
1. Създайте документ → добавете артикули → "Потвърди"

**Движения:** История на всички входове и изходи.

**Справки:** Графики и Excel export по период.`,
      en: `**Warehouses:** Manage physical warehouses and locations.

**Products:**
1. WMS → Products → "New product"
2. Fill in: Code, Name, Unit
3. Optional: Barcode (scan with 📷), Min stock, Price
4. Set initial stock and warehouse

**Stock:** Current quantities by product and location.
⚠️ Red = below minimum

**Receipts:** Goods receipt documents.
1. Create document → add items → "Confirm"

**Movements:** History of all ins and outs.

**Reports:** Charts and Excel export by period.`
    }
  },
  {
    id: 'scm',
    icon: '🚚',
    title: { bg: 'Верига на доставките (SCM)', en: 'Supply Chain Management (SCM)' },
    keywords: ['доставчик', 'supplier', 'поръчка', 'order', 'доставка', 'delivery', 'покупка', 'purchase'],
    content: {
      bg: `**Доставчици:** Регистър на всички доставчици.

**Поръчки покупка:**
1. Изберете доставчик → "Създай"
2. Добавете артикули и количества
3. Статуси: Чернова → Изпратена → Получена

**Доставки:**
При получаване потвърдете количествата.
✅ Потвърдена доставка автоматично създава приходен в WMS.`,
      en: `**Suppliers:** Registry of all suppliers.

**Purchase Orders:**
1. Select supplier → "Create"
2. Add items and quantities
3. Statuses: Draft → Sent → Received

**Deliveries:**
Confirm quantities when goods arrive.
✅ Confirmed delivery automatically creates a WMS receipt.`
    }
  },
  {
    id: 'mes',
    icon: '🏭',
    title: { bg: 'Производство (MES)', en: 'Manufacturing (MES)' },
    keywords: ['производство', 'manufacturing', 'рецептура', 'bom', 'нареждане', 'work order', 'компонент', 'component'],
    content: {
      bg: `**Рецептури (BOM):**
1. MES → Рецептури → "Създай"
2. Изберете краен продукт
3. Добавете компоненти (материали + количества)

**Производствени нареждания:**
1. Изберете рецептура и количество
2. Статуси: Планирано → В изпълнение → Завършено
3. При завършване: материалите се изписват, продуктът се заприхождава`,
      en: `**Bill of Materials (BOM):**
1. MES → BOM → "Create"
2. Select finished product
3. Add components (materials + quantities)

**Work Orders:**
1. Select BOM and quantity
2. Statuses: Planned → In Progress → Completed
3. On completion: materials are consumed, product is stocked`
    }
  },
  {
    id: 'pos',
    icon: '🛒',
    title: { bg: 'Точка на продажба (POS)', en: 'Point of Sale (POS)' },
    keywords: ['продажба', 'sale', 'каса', 'register', 'касова бележка', 'receipt', 'фактура', 'invoice', 'баркод', 'barcode', 'плащане', 'payment', 'контрагент', 'counterparty', 'еик', 'зддс', 'vat'],
    content: {
      bg: `**Извършване на продажба:**
1. POS → Каса → изберете каса
2. Добавете продукти (клик или 🔍 баркод скенер)
3. Изберете: 💵 Кеш или 💳 Карта
4. "Завърши продажбата"

**Касова бележка:**
- 🖨️ Принтирайте директно
- 📥 Свалете като файл

**Баркод скенер:**
Натиснете "Сканирай" → изберете USB или Камера режим.

**Контрагенти**
Управление на юридически лица (фирми) за фактуриране от POS.
- Къде: Точка на продажба → Контрагенти
- Създаване: "Нов контрагент" → попълнете име, ЕИК, ДДС номер, адрес, МОЛ, телефон, имейл
- История: отворете контрагент за списък с всички свързани покупки
- ⚠️ Видимо само когато модулът Финанси НЕ е активиран. При активен Финанси използвайте Финанси → Клиенти.

**Фактури от POS**
Издаване на законосъобразни български ЗДДС фактури директно от касата.
- Къде: Точка на продажба → Фактури (списък) + процес на плащане в касата
- Издаване: в касата изберете контрагент от "Клиент" → ✅ "Издай фактура" → попълнете дати/ДДС → завършете продажбата → свалете PDF
- Номерация: поредни 10-цифрени номера (0000000001, 0000000002, ...)
- Ръчна корекция: операторът може да промени номера преди издаване за синхрон с външна счетоводна система
- Начален номер: Настройки → Фирма → секция "Фактури"
- ⚠️ Видимо само когато модулът Финанси НЕ е активиран.`,
      en: `**Making a sale:**
1. POS → Register → select register
2. Add products (click or 🔍 barcode scanner)
3. Select: 💵 Cash or 💳 Card
4. "Complete Sale"

**Receipt:**
- 🖨️ Print directly
- 📥 Download as file

**Barcode scanner:**
Click "Scan" → choose USB or Camera mode.

**Counterparties**
Manage legal entity customers for POS invoicing.
- Where: Point of Sale → Counterparties
- Create: "New counterparty" → fill name, EIK, VAT number, address, manager, phone, email
- History: open a counterparty to see all linked purchases
- ⚠️ Only visible when the Finance module is NOT enabled. When Finance is enabled, use Finance → Customers.

**POS Invoices**
Issue Bulgarian VAT-compliant invoices directly from the POS terminal.
- Where: Point of Sale → Invoices (list) + checkout flow
- Issue: at checkout select a counterparty from "Customer" → ✅ "Issue invoice" → fill dates/VAT → complete sale → download PDF
- Numbering: sequential 10-digit numbers (0000000001, 0000000002, ...)
- Manual override: operator can change the number before issuing to sync with external accounting
- Start number: Settings → Company → "Invoices" section
- ⚠️ Only visible when the Finance module is NOT enabled.`
    }
  },
  {
    id: 'finance',
    icon: '💰',
    title: { bg: 'Финанси', en: 'Finance' },
    requiresFinance: true,
    keywords: ['финанси', 'finance', 'фактура', 'invoice', 'клиент', 'customer', 'вземане', 'receivable', 'задължение', 'payable', 'главна книга', 'journal', 'банка', 'bank', 'справка', 'report', 'период', 'period', 'счетоводство', 'accounting'],
    content: {
      bg: `**Финанси модул — обзор**
Пълнофункционален финансово-счетоводен модул с двойно счетоводство, съвместим с българското законодателство.

**Клиенти**
Управление на клиенти (юридически лица) за фактуриране.
Финанси → Клиенти → "Нов клиент"

**Фактури**
Изходящи (към клиенти) и входящи (от доставчици) фактури.
Номерация: отделни поредни номера по тип документ.
Издадена фактура е неизменна (българско законодателство).

**Вземания и Задължения**
Автоматично се създават при издаване на фактура.
Записвайте плащания чрез бутона "Плащане".

**Главна книга**
Счетоводни записи (double-entry) — автоматично от POS и SCM.
Всяка продажба → дебит Каса/кредит Приходи.
Всяка доставка → дебит Стоки/кредит Доставчици.

**Банкови операции**
Ръчно въвеждане на банкови транзакции + съпоставяне с вземания/задължения.

**Справки**
Оборотна ведомост, ОПР, Баланс — с Excel експорт.

**Счетоводни периоди**
Затваряне на месец предотвратява редакция на минали записи.
Само SUPER_ADMIN може да отвори затворен период.`,
      en: `**Finance module — overview**
Full accounting module with double-entry bookkeeping, compliant with Bulgarian regulations.

**Customers**
Manage legal entity customers for invoicing.
Finance → Customers → "New customer"

**Invoices**
Outgoing (to customers) and incoming (from suppliers) invoices.
Numbering: separate sequential numbers per document type.
Issued invoices are immutable (Bulgarian law).

**Receivables and Payables**
Created automatically when an invoice is issued.
Record payments via the "Payment" button.

**General ledger**
Journal entries (double-entry) — automated from POS and SCM.
Each sale → debit Cash/credit Revenue.
Each delivery → debit Inventory/credit Suppliers.

**Bank operations**
Manual bank transaction entry + matching with receivables/payables.

**Reports**
Trial balance, P&L, Balance sheet — with Excel export.

**Accounting periods**
Month closing prevents editing past entries.
Only SUPER_ADMIN can reopen a closed period.`
    }
  },
  {
    id: 'backup',
    icon: '💾',
    title: { bg: 'Архивиране', en: 'Backup' },
    keywords: ['архив', 'backup', 'политика', 'policy', 'възстановяване', 'restore'],
    content: {
      bg: `**Политики:**
Определят кога и как се архивира автоматично.
1. Архивиране → Политики → "Създай"
2. Задайте честота и час

**История:** Всички изпълнени архивирания.

**Възстановяване:**
За възстановяване от архив се свържете с администратора.`,
      en: `**Policies:**
Define when and how data is automatically backed up.
1. Backup → Policies → "Create"
2. Set frequency and time

**History:** All completed backups.

**Restore:**
Contact your administrator to restore from a backup.`
    }
  },
  {
    id: 'settings',
    icon: '⚙️',
    title: { bg: 'Настройки', en: 'Settings' },
    keywords: ['настройки', 'settings', 'фирма', 'company', 'лиценз', 'license', 'профил', 'profile', 'еик', 'vat', 'iban'],
    content: {
      bg: `**Профил:** Промяна на вашите данни и парола.

**Фирма:** Данни използвани в документи:
- Наименование, МОЛ, ЕИК, ДДС номер
- Адрес, Телефон, Имейл
- Банка, IBAN, Лого
- Начален номер на фактури (само без модул Финанси) — секция "Фактури"

**Лиценз:** Информация за абонамента.

**Система:** Техническа информация за версията.`,
      en: `**Profile:** Change your personal data and password.

**Company:** Data used in documents:
- Name, Manager, EIK, VAT number
- Address, Phone, Email
- Bank, IBAN, Logo
- Invoice start number (only without Finance module) — "Invoices" section

**License:** Subscription information.

**System:** Technical information about the version.`
    }
  }
]

export default function Help() {
  const [lang, setLang] = useState<Language>('bg')
  const [search, setSearch] = useState('')
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const enabledModules = useAuthStore((s) => s.enabledModules)
  const financeEnabled = isFinanceModuleEnabledForTenant({ enabledModules })

  const visibleSections = useMemo(
    () => sections.filter((section) => !section.requiresFinance || financeEnabled),
    [financeEnabled]
  )

  const filtered = useMemo(() => {
    if (!search.trim()) return visibleSections
    const q = search.toLowerCase()
    return visibleSections.filter(
      (s) =>
        s.title[lang].toLowerCase().includes(q) ||
        s.content[lang].toLowerCase().includes(q) ||
        s.keywords.some((k) => k.includes(q))
    )
  }, [search, lang, visibleSections])

  const renderContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <div
            key={i}
            style={{ fontWeight: 700, color: '#0f172a', marginTop: 12, marginBottom: 4 }}
          >
            {line.replace(/\*\*/g, '')}
          </div>
        )
      }
      if (line.startsWith('- ') || line.match(/^\d+\./)) {
        return (
          <div key={i} style={{ paddingLeft: 16, marginBottom: 2, fontSize: 13, color: '#374151' }}>
            {line}
          </div>
        )
      }
      if (line.includes('|') && line.includes('---')) return null
      if (line.includes('|')) {
        const cells = line.split('|').filter((c) => c.trim())
        return (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 2 }}>
            {cells.map((cell, j) => (
              <div
                key={j}
                style={{
                  flex: 1,
                  fontSize: 12,
                  padding: '2px 8px',
                  background: j === 0 ? '#f8faff' : 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: 4
                }}
              >
                {cell.trim()}
              </div>
            ))}
          </div>
        )
      }
      if (!line.trim()) return <div key={i} style={{ height: 8 }} />
      return (
        <div key={i} style={{ fontSize: 13, color: '#374151', marginBottom: 2 }}>
          {line}
        </div>
      )
    })
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1000 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 24
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              margin: '0 0 4px',
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}
          >
            <BookOpen size={22} color="#7c3aed" />
            {lang === 'bg' ? 'Помощ и документация' : 'Help & Documentation'}
          </h1>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
            {lang === 'bg' ? 'Ръководство за употреба на DFlowERP' : 'DFlowERP User Manual'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: 8, padding: 3 }}>
            {(['bg', 'en'] as Language[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                style={{
                  padding: '5px 12px',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  background: lang === l ? 'white' : 'transparent',
                  color: lang === l ? '#0f172a' : '#6b7280',
                  boxShadow: lang === l ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                {l === 'bg' ? '🇧🇬 БГ' : '🇬🇧 EN'}
              </button>
            ))}
          </div>
          <a
            href={`/docs/DFlowERP-Manual-${lang.toUpperCase()}.pdf`}
            download
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              background: '#7c3aed',
              color: 'white',
              textDecoration: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(124,58,237,0.3)'
            }}
          >
            <Download size={14} />
            {lang === 'bg' ? 'Свали PDF' : 'Download PDF'}
          </a>
        </div>
      </div>

      <div style={{ position: 'relative', marginBottom: 24 }}>
        <Search
          size={16}
          style={{
            position: 'absolute',
            left: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#9ca3af'
          }}
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={
            lang === 'bg' ? '🔍 Търсете в документацията...' : '🔍 Search documentation...'
          }
          style={{
            width: '100%',
            padding: '11px 14px 11px 42px',
            border: '1.5px solid #e5e7eb',
            borderRadius: 10,
            fontSize: 14,
            fontFamily: 'inherit',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.15s'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#7c3aed'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#e5e7eb'
          }}
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#9ca3af'
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {search && (
        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
          {lang === 'bg'
            ? `${filtered.length} резултата за "${search}"`
            : `${filtered.length} results for "${search}"`}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map((section) => (
          <div
            key={section.id}
            style={{
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: activeSection === section.id ? '0 4px 12px rgba(124,58,237,0.1)' : 'none',
              transition: 'box-shadow 0.2s'
            }}
          >
            <button
              type="button"
              onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
              style={{
                width: '100%',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 22 }}>{section.icon}</span>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>
                  {section.title[lang]}
                </span>
              </div>
              <ChevronRight
                size={16}
                color="#9ca3af"
                style={{
                  transform: activeSection === section.id ? 'rotate(90deg)' : 'none',
                  transition: 'transform 0.2s'
                }}
              />
            </button>

            {(activeSection === section.id || !!search) && (
              <div
                style={{
                  padding: '0 20px 20px',
                  borderTop: '1px solid #f3f4f6',
                  paddingTop: 16
                }}
              >
                {renderContent(section.content[lang])}
              </div>
            )}
          </div>
        ))}
      </div>

      {!filtered.length && (
        <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
          <BookOpen size={40} color="#e5e7eb" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: 15, fontWeight: 500 }}>
            {lang === 'bg' ? 'Няма резултати' : 'No results found'}
          </div>
        </div>
      )}
    </div>
  )
}
