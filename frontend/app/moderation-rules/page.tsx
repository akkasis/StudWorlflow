import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ModerationRulesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-16">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Правила модерации Skillent</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-sm leading-7 text-muted-foreground">
              <p>Модерация Skillent следит за корректностью анкет, отзывов, переписки в поддержке и соблюдением правил платформы.</p>
              <p>Модератор может редактировать или удалять отзыв, если он содержит оскорбления, недостоверные обвинения, спам, рекламу, персональные данные других лиц или иной неподходящий контент.</p>
              <p>Тьютор может получить отметку верификации, если его профиль проверен модерацией. Отзыв может получить отметку подтверждения, если он признан достоверным и полезным для других пользователей.</p>
              <p>При серьезных нарушениях пользователь может быть временно ограничен или заблокирован навсегда. Основанием могут быть мошенничество, обход блокировок, агрессивное поведение, фальшивые анкеты и систематические жалобы.</p>
              <p>Если пользователь не согласен с решением модерации, он может написать в поддержку через встроенный чат поддержки на платформе.</p>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
