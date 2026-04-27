import Link from "next/link"
import { CircleHelp, MessageSquare, Search, Star, UserRound } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function HelpPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pt-16">
        <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/12">
              <CircleHelp className="h-6 w-6 text-primary" />
            </div>
            <h1 className="mt-4 text-4xl font-bold">Помощь по Skillent</h1>
            <p className="mt-3 text-muted-foreground">
              Коротко и понятно: как найти тьютора, как создать анкету и как пользоваться сервисом внутри РАНХиГС.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" />
                  Как студенту найти тьютора
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>1. Открой каталог тьюторов и введи предмет, навык или тему.</p>
                <p>2. Переключай сортировку: по популярности, цене или дате создания.</p>
                <p>3. Открой анкету, посмотри отзывы и напиши тьютору в чат.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserRound className="h-5 w-5 text-primary" />
                  Как тьютору оформить анкету
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>1. Зарегистрируйся как тьютор.</p>
                <p>2. Заполни имя, курс, описание, навыки и цену за час.</p>
                <p>3. Следи за отзывами и отвечай на сообщения в личном кабинете.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Как работает чат
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>Сообщения открываются из профиля тьютора или через иконку чата в шапке.</p>
                <p>Непрочитанные сообщения показываются цифрой рядом с иконкой.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  Как работают отзывы
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>Студент может оставить тьютору только один отзыв.</p>
                <p>Из этих отзывов формируется рейтинг и доверие к анкете.</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center">
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/marketplace">
                <Button>Перейти к тьюторам</Button>
              </Link>
              <Link href="/privacy">
                <Button variant="outline">Конфиденциальность</Button>
              </Link>
              <Link href="/terms">
                <Button variant="outline">Соглашение</Button>
              </Link>
              <Link href="/moderation-rules">
                <Button variant="outline">Правила модерации</Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
