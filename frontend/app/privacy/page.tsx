import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-16">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Политика конфиденциальности Skillent</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-sm leading-7 text-muted-foreground">
              <p>Skillent обрабатывает только те данные, которые необходимы для работы платформы: имя, email, роль пользователя, содержимое профиля, сообщения, отзывы и обращения в поддержку.</p>
              <p>Данные используются для регистрации, поиска стутьюторов, общения между пользователями, модерации контента и улучшения качества сервиса.</p>
              <p>Мы не публикуем пароль пользователя и не передаем личные данные третьим лицам без законных оснований. Открытая часть профиля видна другим пользователям только в пределах функциональности платформы.</p>
              <p>Пользователь соглашается с тем, что отзывы, рейтинг, бейджи верификации и модерационные отметки могут отображаться публично внутри Skillent.</p>
              <p>Если пользователь считает, что его данные используются некорректно, он может обратиться в поддержку через встроенный раздел поддержки на сайте.</p>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
