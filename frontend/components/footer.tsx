import Link from "next/link"
import { SiteLogo } from "@/components/site-logo"

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-card/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-3">
              <SiteLogo markClassName="h-9 w-9 rounded-xl glow-primary" />
            </Link>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-xs">
              Платформа, где студенты находят стутьюторов, договариваются о занятиях и помогают друг другу учиться эффективнее.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Платформа</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/marketplace" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Каталог стутьюторов
                </Link>
              </li>
              <li>
                <Link href="/signup" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Стать стутьютором
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Тарифы
                </Link>
              </li>
            </ul>
          </div>

          {/* Subjects */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Направления</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/marketplace?tag=programming" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Программирование
                </Link>
              </li>
              <li>
                <Link href="/marketplace?tag=math" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Математика
                </Link>
              </li>
              <li>
                <Link href="/marketplace?tag=writing" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Письмо
                </Link>
              </li>
              <li>
                <Link href="/marketplace?tag=science" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Естественные науки
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Документы</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Политика конфиденциальности
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Пользовательское соглашение
                </Link>
              </li>
              <li>
                <Link href="/moderation-rules" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Правила модерации
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Помощь
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Skillent. Все права защищены.
          </p>
        </div>
      </div>
    </footer>
  )
}
