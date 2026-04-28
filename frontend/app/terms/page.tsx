import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-16">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Пользовательское соглашение Skillent</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-sm leading-7 text-muted-foreground">
              <p>Skillent предоставляет платформу для поиска стутьюторов, размещения анкет, общения пользователей и обмена отзывами внутри академической среды.</p>
              <p>Пользователь обязан указывать достоверную информацию о себе, не использовать платформу для мошенничества, спама, травли, распространения запрещенного контента и иных злоупотреблений.</p>
              <p>Стутьютор самостоятельно отвечает за корректность информации в анкете, описание услуг, стоимость и договоренности, достигнутые с другими пользователями.</p>
              <p>Платформа вправе ограничить или прекратить доступ пользователя при нарушении правил, жалобах, попытках обхода модерации или причинении вреда другим участникам сервиса.</p>
              <p>Используя Skillent, пользователь принимает эти условия и соглашается с действующими правилами модерации и политикой конфиденциальности.</p>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
